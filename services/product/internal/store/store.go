package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/devmanishoffl/sabhyatam-product/internal/model"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	db *pgxpool.Pool
}

func NewPG(databaseURL string) (*Store, error) {
	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		return nil, err
	}
	return &Store{db: pool}, nil
}

func (s *Store) Close(ctx context.Context) {
	s.db.Close()
}

// --- ADMIN SPECIFIC METHODS ---

func (s *Store) ListAdminProducts(ctx context.Context, page, limit int, search string) ([]model.Product, int, error) {
	offset := (page - 1) * limit

	whereClause := "WHERE deleted_at IS NULL"
	args := []interface{}{}
	argIdx := 1

	if search != "" {
		whereClause += fmt.Sprintf(" AND (title ILIKE $%d OR short_desc ILIKE $%d OR sku ILIKE $%d)", argIdx, argIdx, argIdx)
		args = append(args, "%"+search+"%", "%"+search+"%", "%"+search+"%")
		argIdx++
	}

	// 1. Count
	var total int
	countQuery := "SELECT COUNT(*) FROM products " + whereClause
	if err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// 2. Fetch
	query := fmt.Sprintf(`
    SELECT id, slug, title, 
           COALESCE(short_desc, ''), 
           category, 
           COALESCE(subcategory, ''), 
           price, mrp, stock, 
           COALESCE(sku, ''), 
           published, created_at
    FROM products
    %s
    ORDER BY created_at DESC
    LIMIT $%d OFFSET $%d
  `, whereClause, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var products []model.Product
	var productIDs []string

	for rows.Next() {
		var p model.Product
		if err := rows.Scan(
			&p.ID, &p.Slug, &p.Title, &p.ShortDesc, &p.Category, &p.Subcat,
			&p.Price, &p.MRP, &p.Stock, &p.SKU, &p.Published, &p.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		p.InStock = p.Stock > 0
		products = append(products, p)
		productIDs = append(productIDs, p.ID)
	}

	if len(products) == 0 {
		return []model.Product{}, 0, nil
	}

	// 3. Batch Fetch Media
	mediaMap, _ := s.getMediaForProducts(ctx, productIDs)
	for i := range products {
		products[i].Media = mediaMap[products[i].ID]
	}

	return products, total, nil
}

func (s *Store) GetDashboardStats(ctx context.Context) (int, int, error) {
	var active int
	var lowStock int

	s.db.QueryRow(ctx, `SELECT COUNT(*) FROM products WHERE published = true AND deleted_at IS NULL`).Scan(&active)
	s.db.QueryRow(ctx, `SELECT COUNT(*) FROM products WHERE deleted_at IS NULL AND stock < 5`).Scan(&lowStock)

	return active, lowStock, nil
}

func (s *Store) getMediaForProducts(ctx context.Context, productIDs []string) (map[string][]model.Media, error) {
	if len(productIDs) == 0 {
		return nil, nil
	}
	rows, err := s.db.Query(ctx, `
    SELECT id, product_id, url, media_type, meta 
    FROM product_media 
    WHERE product_id = ANY($1) 
    ORDER BY (meta->>'order')::int ASC
  `, productIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string][]model.Media)
	for rows.Next() {
		var m model.Media
		var metaBytes []byte
		rows.Scan(&m.ID, &m.ProductID, &m.URL, &m.MediaType, &metaBytes)
		json.Unmarshal(metaBytes, &m.Meta)
		result[m.ProductID] = append(result[m.ProductID], m)
	}
	return result, nil
}

// --- STANDARD CRUD METHODS ---

func (s *Store) GetProductByID(ctx context.Context, id string) (*model.Product, error) {
	row := s.db.QueryRow(ctx, `
        SELECT id, slug, title, 
               COALESCE(short_desc, ''), 
               category, 
               COALESCE(subcategory, ''), 
               price, mrp, stock, 
               COALESCE(sku, ''),
               attributes, tags, published, created_at, updated_at 
        FROM products WHERE id=$1
    `, id)

	var p model.Product
	var attrs []byte

	if err := row.Scan(
		&p.ID, &p.Slug, &p.Title, &p.ShortDesc, &p.Category, &p.Subcat,
		&p.Price, &p.MRP, &p.Stock, &p.SKU,
		&attrs, &p.Tags, &p.Published, &p.CreatedAt, &p.UpdatedAt,
	); err != nil {
		return nil, err
	}

	p.InStock = p.Stock > 0
	_ = json.Unmarshal(attrs, &p.Attributes)

	// FIX: Fetch Media for Single Product
	mediaMap, err := s.getMediaForProducts(ctx, []string{p.ID})
	if err == nil {
		p.Media = mediaMap[p.ID]
	}

	return &p, nil
}

func (s *Store) ListProductsFiltered(ctx context.Context, filters map[string]string, sort string, limit, offset int) ([]model.Product, error) {
	query := `
  SELECT
    p.id, p.slug, p.title, 
    COALESCE(p.short_desc, ''), 
    p.category,
    p.price, p.mrp,
    COALESCE((SELECT url FROM product_media WHERE product_id = p.id ORDER BY (meta->>'order')::int LIMIT 1), '') AS image_url,
    COALESCE(p.subcategory, ''), 
    p.attributes, p.tags, p.published, p.created_at, p.updated_at, p.stock
  FROM products p
  WHERE 1=1 AND p.deleted_at IS NULL AND p.published = true
  `
	args := []interface{}{}
	argIndex := 1

	if v := filters["category"]; v != "" {
		query += fmt.Sprintf(" AND p.category = $%d", argIndex)
		args = append(args, v)
		argIndex++
	}
	if v := filters["subcategory"]; v != "" {
		query += fmt.Sprintf(" AND p.subcategory = $%d", argIndex)
		args = append(args, v)
		argIndex++
	}
	if v := filters["fabric"]; v != "" {
		query += fmt.Sprintf(" AND p.attributes->>'fabric' = $%d", argIndex)
		args = append(args, v)
		argIndex++
	}
	if v := filters["weave"]; v != "" {
		query += fmt.Sprintf(" AND p.attributes->>'weave' = $%d", argIndex)
		args = append(args, v)
		argIndex++
	}
	if v := filters["color"]; v != "" {
		query += fmt.Sprintf(" AND p.attributes->>'color' = $%d", argIndex)
		args = append(args, v)
		argIndex++
	}
	if v := filters["origin"]; v != "" {
		query += fmt.Sprintf(" AND p.attributes->>'origin' = $%d", argIndex)
		args = append(args, v)
		argIndex++
	}
	if v := filters["q"]; v != "" {
		query += fmt.Sprintf(" AND (p.title ILIKE $%d OR p.short_desc ILIKE $%d)", argIndex, argIndex)
		args = append(args, "%"+v+"%")
		argIndex++
	}

	switch sort {
	case "price_asc":
		query += ` ORDER BY p.price ASC`
	case "price_desc":
		query += ` ORDER BY p.price DESC`
	default:
		query += " ORDER BY p.created_at DESC"
	}

	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, limit, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []model.Product
	for rows.Next() {
		var p model.Product
		var attrs []byte
		err := rows.Scan(
			&p.ID, &p.Slug, &p.Title, &p.ShortDesc, &p.Category, &p.Price, &p.MRP,
			&p.ImageURL, &p.Subcat, &attrs, &p.Tags, &p.Published, &p.CreatedAt,
			&p.UpdatedAt, &p.Stock,
		)
		if err != nil {
			return nil, err
		}
		p.InStock = p.Stock > 0
		_ = json.Unmarshal(attrs, &p.Attributes)
		out = append(out, p)
	}
	return out, nil
}

func (s *Store) CreateProduct(ctx context.Context, p *model.Product) (string, error) {
	var id string
	attrs, _ := json.Marshal(p.Attributes)

	if p.SKU == "" {
		p.SKU = fmt.Sprintf("SKU-%d", time.Now().UnixNano())
	}

	err := s.db.QueryRow(ctx, `
    INSERT INTO products (
      slug, title, short_desc, long_desc, category, subcategory, 
      price, mrp, stock, sku,
      attributes, tags, published
    ) 
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) 
    RETURNING id
  `,
		p.Slug, p.Title, p.ShortDesc, p.LongDesc, p.Category, p.Subcat,
		p.Price, p.MRP, p.Stock, p.SKU,
		attrs, p.Tags, p.Published,
	).Scan(&id)

	if err != nil {
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" {
			return "", fmt.Errorf("duplicate key: %s", pgErr.Detail)
		}
	}
	return id, err
}

func (s *Store) UpdateProduct(ctx context.Context, id string, p *model.Product) error {
	attrs, _ := json.Marshal(p.Attributes)

	_, err := s.db.Exec(ctx, `
        UPDATE products SET
            slug = $1, title = $2, short_desc = $3, long_desc = $4,
            category = $5, subcategory = $6, attributes = $7, tags = $8,
            published = $9, price = $10, mrp = $11, stock = $12, sku = $13,
            updated_at = now()
        WHERE id = $14
    `,
		p.Slug, p.Title, p.ShortDesc, p.LongDesc, p.Category, p.Subcat,
		attrs, p.Tags, p.Published, p.Price, p.MRP, p.Stock, p.SKU,
		id,
	)
	return err
}

func (s *Store) DeleteProduct(ctx context.Context, id string) error {
	cmd, err := s.db.Exec(ctx, `UPDATE products SET deleted_at = now() WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return fmt.Errorf("product not found")
	}
	return nil
}

// --- STOCK METHODS ---

func (s *Store) ReserveStock(ctx context.Context, productID string, qty int) error {
	if qty <= 0 {
		return fmt.Errorf("invalid quantity")
	}
	res, err := s.db.Exec(ctx, `
    UPDATE products 
    SET stock = stock - $1, stock_reserved = stock_reserved + $1 
    WHERE id = $2 AND stock >= $1
  `, qty, productID)

	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("insufficient stock")
	}
	return nil
}

func (s *Store) ReleaseStock(ctx context.Context, productID string, qty int) error {
	if qty <= 0 {
		return fmt.Errorf("invalid quantity")
	}
	res, err := s.db.Exec(ctx, `
    UPDATE products 
    SET stock = stock + $1, stock_reserved = stock_reserved - $1 
    WHERE id = $2 AND stock_reserved >= $1
  `, qty, productID)

	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("invalid reserved stock")
	}
	return nil
}

func (s *Store) DeductStock(ctx context.Context, productID string, qty int) error {
	if qty <= 0 {
		return fmt.Errorf("invalid quantity")
	}
	res, err := s.db.Exec(ctx, `
    UPDATE products 
    SET stock_reserved = stock_reserved - $1 
    WHERE id = $2 AND stock_reserved >= $1
  `, qty, productID)

	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("insufficient reserved stock")
	}
	return nil
}

// --- MEDIA METHODS ---
func (s *Store) CreateMedia(ctx context.Context, productID string, m *model.Media) (string, error) {
	var id string
	err := s.db.QueryRow(ctx, `INSERT INTO product_media (product_id, url, media_type, meta) VALUES ($1, $2, $3, $4) RETURNING id`, productID, m.URL, m.MediaType, m.Meta).Scan(&id)
	return id, err
}

func (s *Store) DeleteMedia(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM product_media WHERE id=$1`, id)
	return err
}

func (s *Store) GetProductBySlug(ctx context.Context, slug string) (*model.Product, error) {
	var p model.Product
	var attrs []byte

	err := s.db.QueryRow(ctx, `
    SELECT id, slug, title, 
           COALESCE(short_desc, ''), 
           category, 
           COALESCE(subcategory, ''), 
           price, mrp, stock, 
           COALESCE(sku, ''),
           attributes, tags, published, created_at, updated_at 
    FROM products 
    WHERE slug = $1 AND published = true AND deleted_at IS NULL
  `, slug).Scan(
		&p.ID, &p.Slug, &p.Title, &p.ShortDesc, &p.Category, &p.Subcat,
		&p.Price, &p.MRP, &p.Stock, &p.SKU,
		&attrs, &p.Tags, &p.Published, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	p.InStock = p.Stock > 0
	_ = json.Unmarshal(attrs, &p.Attributes)

	// FIX: Fetch Media for Single Product (Slug)
	mediaMap, err := s.getMediaForProducts(ctx, []string{p.ID})
	if err == nil {
		p.Media = mediaMap[p.ID]
	}

	return &p, nil
}

func (s *Store) CountProductsFiltered(ctx context.Context, filters map[string]string) (int, error) {
	query := `SELECT COUNT(*) FROM products p WHERE 1=1 AND p.deleted_at IS NULL AND p.published = true`
	args := []interface{}{}
	argIndex := 1

	if v := filters["category"]; v != "" {
		query += fmt.Sprintf(" AND p.category = $%d", argIndex)
		args = append(args, v)
		argIndex++
	}
	var count int
	err := s.db.QueryRow(ctx, query, args...).Scan(&count)
	return count, err
}

func (s *Store) GetSimilarProducts(ctx context.Context, product *model.Product, limit int) ([]model.Product, error) {
	return []model.Product{}, nil
}

func (s *Store) HasHeroImage(ctx context.Context, productID string) (bool, error) {
	var exists bool
	err := s.db.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM product_media WHERE product_id = $1 AND meta->>'role' = 'hero')`, productID).Scan(&exists)
	return exists, err
}

func (s *Store) HasMediaOrder(ctx context.Context, productID string, order int) (bool, error) {
	var exists bool
	err := s.db.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM product_media WHERE product_id = $1 AND (meta->>'order')::int = $2)`, productID, order).Scan(&exists)
	return exists, err
}
