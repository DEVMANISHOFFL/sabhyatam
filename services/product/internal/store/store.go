package store

import (
	"context"
	"encoding/json"
	"fmt"

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

// ListAdminProducts fetches products for the admin table with variants and media
func (s *Store) ListAdminProducts(ctx context.Context, page, limit int, search string) ([]model.Product, int, error) {
	offset := (page - 1) * limit

	// 1. Build Base Query
	whereClause := "WHERE deleted_at IS NULL"
	args := []interface{}{}
	argIdx := 1

	if search != "" {
		whereClause += fmt.Sprintf(" AND (title ILIKE $%d OR short_desc ILIKE $%d)", argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	// 2. Count Total
	var total int
	countQuery := "SELECT COUNT(*) FROM products " + whereClause
	if err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// 3. Fetch Products
	query := fmt.Sprintf(`
		SELECT id, slug, title, short_desc, category, subcategory, published, created_at
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
		if err := rows.Scan(&p.ID, &p.Slug, &p.Title, &p.ShortDesc, &p.Category, &p.Subcat, &p.Published, &p.CreatedAt); err != nil {
			return nil, 0, err
		}
		products = append(products, p)
		productIDs = append(productIDs, p.ID)
	}

	if len(products) == 0 {
		return []model.Product{}, 0, nil
	}

	// 4. Batch Fetch Variants & Media (Populates the dashboard table)
	variantsMap, _ := s.getVariantsForProducts(ctx, productIDs)
	mediaMap, _ := s.getMediaForProducts(ctx, productIDs)

	for i := range products {
		products[i].Variants = variantsMap[products[i].ID]
		products[i].Media = mediaMap[products[i].ID]
	}

	return products, total, nil
}

func (s *Store) GetDashboardStats(ctx context.Context) (int, int, error) {
	var active int
	var lowStock int

	s.db.QueryRow(ctx, `SELECT COUNT(*) FROM products WHERE published = true AND deleted_at IS NULL`).Scan(&active)

	s.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM (
			SELECT p.id
			FROM products p
			JOIN product_variants v ON p.id = v.product_id
			WHERE p.deleted_at IS NULL
			GROUP BY p.id
			HAVING SUM(v.stock) < 5
		) AS sub
	`).Scan(&lowStock)

	return active, lowStock, nil
}

// Helper: Batch fetch variants
func (s *Store) getVariantsForProducts(ctx context.Context, productIDs []string) (map[string][]model.Variant, error) {
	if len(productIDs) == 0 {
		return nil, nil
	}
	rows, err := s.db.Query(ctx, `
		SELECT id, product_id, sku, price, mrp, stock 
		FROM product_variants 
		WHERE product_id = ANY($1)
	`, productIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string][]model.Variant)
	for rows.Next() {
		var v model.Variant
		rows.Scan(&v.ID, &v.ProductID, &v.SKU, &v.Price, &v.MRP, &v.Stock)
		result[v.ProductID] = append(result[v.ProductID], v)
	}
	return result, nil
}

// Helper: Batch fetch media
func (s *Store) getMediaForProducts(ctx context.Context, productIDs []string) (map[string][]model.Media, error) {
	if len(productIDs) == 0 {
		return nil, nil
	}
	rows, err := s.db.Query(ctx, `
		SELECT id, product_id, url, media_type 
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
		rows.Scan(&m.ID, &m.ProductID, &m.URL, &m.MediaType)
		result[m.ProductID] = append(result[m.ProductID], m)
	}
	return result, nil
}

// --- STANDARD CRUD METHODS ---

func (s *Store) ListProducts(ctx context.Context, limit, offset int) ([]model.Product, error) {
	rows, err := s.db.Query(ctx, `SELECT id, slug, title, short_desc, price, category, subcategory, attributes, tags, published, created_at, updated_at FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []model.Product
	for rows.Next() {
		var p model.Product
		var attrs []byte
		if err := rows.Scan(&p.ID, &p.Slug, &p.Title, &p.ShortDesc, &p.Price, &p.Category, &p.Subcat, &attrs, &p.Tags, &p.Published, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		var m map[string]interface{}
		if len(attrs) > 0 {
			_ = json.Unmarshal(attrs, &m)
			p.Attributes = m
		} else {
			p.Attributes = map[string]interface{}{}
		}
		out = append(out, p)
	}
	return out, nil
}

func (s *Store) GetProductByID(ctx context.Context, id string) (*model.Product, error) {
	row := s.db.QueryRow(ctx, `SELECT id, slug, title, short_desc, category, subcategory, attributes, tags, published, created_at, updated_at FROM products WHERE id=$1`, id)
	var p model.Product
	var attrs []byte
	if err := row.Scan(&p.ID, &p.Slug, &p.Title, &p.ShortDesc, &p.Category, &p.Subcat, &attrs, &p.Tags, &p.Published, &p.CreatedAt, &p.UpdatedAt); err != nil {
		return nil, err
	}
	var m map[string]interface{}
	_ = json.Unmarshal(attrs, &m)
	p.Attributes = m
	return &p, nil
}

func (s *Store) GetVariantsByProductID(ctx context.Context, productID string) ([]model.Variant, error) {
	rows, err := s.db.Query(ctx, `SELECT id, product_id, sku, price, mrp, stock, attributes FROM product_variants WHERE product_id=$1`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []model.Variant
	for rows.Next() {
		var v model.Variant
		var attrs []byte
		if err := rows.Scan(&v.ID, &v.ProductID, &v.SKU, &v.Price, &v.MRP, &v.Stock, &attrs); err != nil {
			return nil, err
		}
		var m map[string]any
		_ = json.Unmarshal(attrs, &m)
		v.Attributes = m
		out = append(out, v)
	}
	return out, nil
}

func (s *Store) ListProductsFiltered(ctx context.Context, filters map[string]string, sort string, limit, offset int) ([]model.Product, error) {
	query := `
	SELECT
		p.id, p.slug, p.title, p.short_desc, p.category,
		COALESCE((SELECT (v.price)::INT FROM product_variants v WHERE v.product_id = p.id ORDER BY v.price ASC LIMIT 1), 0) AS price,
		COALESCE((SELECT (v.mrp)::INT FROM product_variants v WHERE v.product_id = p.id ORDER BY v.mrp ASC LIMIT 1), 0) AS mrp,
		COALESCE((SELECT url FROM product_media WHERE product_id = p.id ORDER BY (meta->>'order')::int LIMIT 1), '') AS image_url,
		p.subcategory, p.attributes, p.tags, p.published, p.created_at, p.updated_at
	FROM products p
	WHERE 1=1
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
		query += ` ORDER BY (SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = p.id) ASC`
	case "price_desc":
		query += ` ORDER BY (SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = p.id) DESC`
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
		err := rows.Scan(&p.ID, &p.Slug, &p.Title, &p.ShortDesc, &p.Category, &p.Price, &p.MRP, &p.ImageURL, &p.Subcat, &attrs, &p.Tags, &p.Published, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return nil, err
		}
		_ = json.Unmarshal(attrs, &p.Attributes)
		out = append(out, p)
	}
	return out, nil
}

func (s *Store) CountProductsFiltered(ctx context.Context, filters map[string]string) (int, error) {
	query := `SELECT COUNT(*) FROM products p WHERE 1=1`
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

	var count int
	err := s.db.QueryRow(ctx, query, args...).Scan(&count)
	return count, err
}

func (s *Store) GetSimilarProducts(ctx context.Context, product *model.Product, limit int) ([]model.Product, error) {
	rows, err := s.db.Query(ctx, `
        SELECT id, slug, title, short_desc, category, subcategory, attributes, tags, published, created_at, updated_at
        FROM products
        WHERE category = $1 AND id != $2
        ORDER BY created_at DESC
        LIMIT $3
    `, product.Category, product.ID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []model.Product
	for rows.Next() {
		var p model.Product
		var attrs []byte
		if err := rows.Scan(&p.ID, &p.Slug, &p.Title, &p.ShortDesc, &p.Category, &p.Subcat, &attrs, &p.Tags, &p.Published, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		var m map[string]interface{}
		_ = json.Unmarshal(attrs, &m)
		p.Attributes = m
		out = append(out, p)
	}
	return out, nil
}

func (s *Store) CreateProduct(ctx context.Context, p *model.Product) (string, error) {
	var id string
	attrs, _ := json.Marshal(p.Attributes)
	err := s.db.QueryRow(ctx, `INSERT INTO products (slug, title, short_desc, long_desc, category, subcategory, attributes, tags, published) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`, p.Slug, p.Title, p.ShortDesc, p.LongDesc, p.Category, p.Subcat, attrs, p.Tags, p.Published).Scan(&id)
	return id, err
}

func (s *Store) UpdateProduct(ctx context.Context, id string, p *model.Product) error {
	attrs, _ := json.Marshal(p.Attributes)

	// Fix: Added price and mrp to the UPDATE statement
	_, err := s.db.Exec(ctx, `
		UPDATE products SET
			slug = $1,
			title = $2,
			short_desc = $3,
			long_desc = $4,
			category = $5,
			subcategory = $6,
			attributes = $7,
			tags = $8,
			published = $9,
			price = $10,     -- <--- NEW
			mrp = $11,       -- <--- NEW
			updated_at = now()
		WHERE id = $12
	`,
		p.Slug,
		p.Title,
		p.ShortDesc,
		p.LongDesc,
		p.Category,
		p.Subcat,
		attrs,
		p.Tags,
		p.Published,
		p.Price,
		p.MRP,
		id,
	)

	return err
}

func (s *Store) DeleteProduct(ctx context.Context, id string) error {
	cmd, err := s.db.Exec(ctx, `DELETE FROM products WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return fmt.Errorf("product not found")
	}
	return nil
}

func (s *Store) CreateVariant(ctx context.Context, productID string, v *model.Variant) (string, error) {
	attrs, _ := json.Marshal(v.Attributes)
	var id string
	err := s.db.QueryRow(ctx, `INSERT INTO product_variants (product_id, sku, price, mrp, stock, attributes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, productID, v.SKU, v.Price, v.MRP, v.Stock, attrs).Scan(&id)
	return id, err
}

func (s *Store) UpdateVariant(ctx context.Context, id string, v *model.Variant) error {
	attrs, _ := json.Marshal(v.Attributes)
	_, err := s.db.Exec(ctx, `UPDATE product_variants SET sku=$1, price=$2, mrp=$3, stock=$4, attributes=$5, updated_at=now() WHERE id=$6`, v.SKU, v.Price, v.MRP, v.Stock, attrs, id)
	return err
}

func (s *Store) DeleteVariant(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM product_variants WHERE id=$1`, id)
	return err
}

func (s *Store) CreateMedia(ctx context.Context, productID string, m *model.Media) (string, error) {
	var id string
	err := s.db.QueryRow(ctx, `INSERT INTO product_media (product_id, url, media_type, meta) VALUES ($1, $2, $3, $4) RETURNING id`, productID, m.URL, m.MediaType, m.Meta).Scan(&id)
	if err != nil {
		if pgErr, ok := err.(*pgconn.PgError); ok {
			if pgErr.Code == "23505" {
				return "", fmt.Errorf("media with this URL already exists")
			}
		}
		return "", err
	}
	return id, nil
}

func (s *Store) DeleteMedia(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM product_media WHERE id=$1`, id)
	return err
}

func (s *Store) ReserveVariantStock(ctx context.Context, variantID string, qty int) error {
	if qty <= 0 {
		return fmt.Errorf("invalid quantity")
	}
	res, err := s.db.Exec(ctx, `UPDATE product_variants SET stock = stock - $1, stock_reserved = stock_reserved + $1 WHERE id = $2 AND stock >= $1`, qty, variantID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("insufficient stock")
	}
	return nil
}

func (s *Store) ReleaseVariantStock(ctx context.Context, variantID string, qty int) error {
	if qty <= 0 {
		return fmt.Errorf("invalid quantity")
	}
	res, err := s.db.Exec(ctx, `UPDATE product_variants SET stock = stock + $1, stock_reserved = stock_reserved - $1 WHERE id = $2 AND stock_reserved >= $1`, qty, variantID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("invalid reserved stock")
	}
	return nil
}

func (s *Store) DeductVariantStock(ctx context.Context, variantID string, qty int) error {
	if qty <= 0 {
		return fmt.Errorf("invalid quantity")
	}
	res, err := s.db.Exec(ctx, `UPDATE product_variants SET stock_reserved = stock_reserved - $1 WHERE id = $2 AND stock_reserved >= $1`, qty, variantID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("insufficient reserved stock")
	}
	return nil
}

func (s *Store) GetProductBySlug(ctx context.Context, slug string) (*model.Product, error) {
	var p model.Product
	var attrs []byte
	err := s.db.QueryRow(ctx, `SELECT id, slug, title, short_desc, category, subcategory, attributes, tags, published, created_at, updated_at FROM products WHERE slug = $1 AND published = true AND deleted_at IS NULL`, slug).Scan(&p.ID, &p.Slug, &p.Title, &p.ShortDesc, &p.Category, &p.Subcat, &attrs, &p.Tags, &p.Published, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if len(attrs) > 0 {
		_ = json.Unmarshal(attrs, &p.Attributes)
	} else {
		p.Attributes = map[string]any{}
	}
	return &p, nil
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
