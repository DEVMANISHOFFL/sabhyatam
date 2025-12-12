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
