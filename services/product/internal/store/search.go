package store

import (
	"context"
	"fmt"
	"strings"

	"github.com/devmanishoffl/sabhyatam-product/internal/model"
)

func (s *Store) SearchProducts(
	ctx context.Context,
	p model.SearchParams,
) ([]model.ProductCard, int, model.Facets, error) {

	where := []string{
		"p.deleted_at IS NULL",
		"p.published = true",
	}
	args := []any{}
	arg := 1

	if p.Query != "" {
		where = append(where, fmt.Sprintf("(p.title ILIKE $%d OR p.tags::text ILIKE $%d)", arg, arg))
		args = append(args, "%"+p.Query+"%")
		arg++
	}

	if p.Category != "" {
		where = append(where, fmt.Sprintf("p.category = $%d", arg))
		args = append(args, p.Category)
		arg++
	}

	// Price Filters (Direct on Product)
	if p.MinPrice > 0 {
		where = append(where, fmt.Sprintf("p.price >= $%d", arg))
		args = append(args, p.MinPrice)
		arg++
	}
	if p.MaxPrice > 0 {
		where = append(where, fmt.Sprintf("p.price <= $%d", arg))
		args = append(args, p.MaxPrice)
		arg++
	}

	// --- Execute Query ---
	offset := (p.Page - 1) * p.Limit

	query := fmt.Sprintf(`
		SELECT
			p.id, p.title, p.slug, p.category, p.price,
			COALESCE((SELECT url FROM product_media WHERE product_id = p.id ORDER BY (meta->>'order')::int LIMIT 1), '') AS image_url,
			p.attributes
		FROM products p
		WHERE %s
		ORDER BY p.created_at DESC
		LIMIT $%d OFFSET $%d
	`, strings.Join(where, " AND "), arg, arg+1)

	rows, err := s.db.Query(ctx, query, append(args, p.Limit, offset)...)
	if err != nil {
		return nil, 0, nil, err
	}
	defer rows.Close()

	var items []model.ProductCard
	for rows.Next() {
		var pc model.ProductCard
		if err := rows.Scan(&pc.ID, &pc.Title, &pc.Slug, &pc.Category, &pc.Price, &pc.ImageURL, &pc.Attrs); err != nil {
			return nil, 0, nil, err
		}
		items = append(items, pc)
	}

	// Count
	var total int
	s.db.QueryRow(ctx, fmt.Sprintf("SELECT COUNT(*) FROM products p WHERE %s", strings.Join(where, " AND ")), args...).Scan(&total)

	// Facets (Simplified)
	facets, _ := s.SearchFacets(ctx, where, args)

	return items, total, facets, nil
}
