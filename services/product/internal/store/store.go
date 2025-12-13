package store

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/devmanishoffl/sabhyatam-product/internal/model"
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

func (s *Store) ListProducts(ctx context.Context, limit, offset int) ([]model.Product, error) {
	rows, err := s.db.Query(ctx, `SELECT id, slug, title, short_desc, category, subcategory, attributes, tags, published, created_at, updated_at FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
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
        SELECT id, slug, title, short_desc, category, subcategory, attributes, tags, published, created_at, updated_at
        FROM products
        WHERE 1=1
    `
	args := []interface{}{}
	argIndex := 1

	// --- FILTERS ---
	if v, ok := filters["category"]; ok && v != "" {
		query += fmt.Sprintf(" AND category = $%d", argIndex)
		args = append(args, v)
		argIndex++
	}

	if v, ok := filters["subcategory"]; ok && v != "" {
		query += fmt.Sprintf(" AND subcategory = $%d", argIndex)
		args = append(args, v)
		argIndex++
	}

	if v, ok := filters["fabric"]; ok && v != "" {
		query += fmt.Sprintf(" AND attributes->>'fabric' = $%d", argIndex)
		args = append(args, v)
		argIndex++
	}

	if v, ok := filters["weave"]; ok && v != "" {
		query += fmt.Sprintf(" AND attributes->>'weave' = $%d", argIndex)
		args = append(args, v)
		argIndex++
	}

	if v, ok := filters["color"]; ok && v != "" {
		query += fmt.Sprintf(" AND attributes->>'color' = $%d", argIndex)
		args = append(args, v)
		argIndex++
	}

	if v, ok := filters["origin"]; ok && v != "" {
		query += fmt.Sprintf(" AND attributes->>'origin' = $%d", argIndex)
		args = append(args, v)
		argIndex++
	}

	if v, ok := filters["q"]; ok && v != "" {
		query += fmt.Sprintf(" AND (title ILIKE $%d OR short_desc ILIKE $%d)", argIndex, argIndex)
		args = append(args, "%"+v+"%")
		argIndex++
	}

	// --- SORTING ---
	switch sort {
	case "price_asc":
		query += " ORDER BY (SELECT MIN(price) FROM product_variants pv WHERE pv.product_id = products.id) ASC"
	case "price_desc":
		query += " ORDER BY (SELECT MIN(price) FROM product_variants pv WHERE pv.product_id = products.id) DESC"
	case "created_at":
		query += " ORDER BY created_at DESC"
	default:
		query += " ORDER BY created_at DESC"
	}

	// --- PAGINATION ---
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

	err := s.db.QueryRow(ctx, `
		INSERT INTO products 
		(slug, title, short_desc, long_desc, category, subcategory, attributes, tags, published)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		RETURNING id
	`, p.Slug, p.Title, p.ShortDesc, p.LongDesc, p.Category, p.Subcat, attrs, p.Tags, p.Published).Scan(&id)

	if err != nil {
		return "", err
	}

	return id, nil
}

func (s *Store) UpdateProduct(ctx context.Context, id string, p *model.Product) error {
	attrs, _ := json.Marshal(p.Attributes)

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
			updated_at = now()
		WHERE id = $10
	`, p.Slug, p.Title, p.ShortDesc, p.LongDesc, p.Category,
		p.Subcat, attrs, p.Tags, p.Published, id)

	return err
}

func (s *Store) DeleteProduct(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM products WHERE id=$1`, id)
	return err
}

func (s *Store) CreateVariant(ctx context.Context, productID string, v *model.Variant) (string, error) {
	attrs, _ := json.Marshal(v.Attributes)

	var id string
	err := s.db.QueryRow(ctx, `
		INSERT INTO product_variants (product_id, sku, price, mrp, stock, attributes)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING id
	`, productID, v.SKU, v.Price, v.MRP, v.Stock, attrs).Scan(&id)

	return id, err
}

func (s *Store) UpdateVariant(ctx context.Context, id string, v *model.Variant) error {
	attrs, _ := json.Marshal(v.Attributes)

	_, err := s.db.Exec(ctx, `
		UPDATE product_variants
		SET sku=$1, price=$2, mrp=$3, stock=$4, attributes=$5, updated_at=now()
		WHERE id=$6
	`, v.SKU, v.Price, v.MRP, v.Stock, attrs, id)

	return err
}

func (s *Store) DeleteVariant(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM product_variants WHERE id=$1`, id)
	return err
}

func (s *Store) CreateMedia(ctx context.Context, productID string, m *model.Media) (string, error) {
	metaBytes, _ := json.Marshal(m.Meta)

	var id string
	err := s.db.QueryRow(ctx, `
		INSERT INTO product_media (product_id, url, media_type, meta)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`,
		productID,
		m.URL,
		m.MediaType,
		metaBytes,
	).Scan(&id)

	return id, err
}

func (s *Store) DeleteMedia(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM product_media WHERE id=$1`, id)
	return err
}

// ReserveVariantStock reserves stock atomically (decrement on available)
func (s *Store) ReserveVariantStock(ctx context.Context, variantID string, qty int) error {
	if qty <= 0 {
		return fmt.Errorf("invalid quantity")
	}
	res, err := s.db.Exec(ctx,
		`UPDATE product_variants SET stock = stock - $1 WHERE id = $2 AND stock >= $1`,
		qty, variantID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("insufficient stock")
	}
	return nil
}

// ReleaseVariantStock increases stock (used to un-reserve)
func (s *Store) ReleaseVariantStock(ctx context.Context, variantID string, qty int) error {
	if qty <= 0 {
		return fmt.Errorf("invalid quantity")
	}
	_, err := s.db.Exec(ctx,
		`UPDATE product_variants SET stock = stock + $1 WHERE id = $2`,
		qty, variantID)
	return err
}

// DeductVariantStock permanently deducts stock (same as reserve->commit)
func (s *Store) DeductVariantStock(ctx context.Context, variantID string, qty int) error {
	if qty <= 0 {
		return fmt.Errorf("invalid quantity")
	}
	res, err := s.db.Exec(ctx,
		`UPDATE product_variants SET stock = stock - $1 WHERE id = $2 AND stock >= $1`,
		qty, variantID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("insufficient stock")
	}
	return nil
}
