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

	where := []string{"p.published = true"}
	args := []any{}
	argPos := 1

	// Keyword search (title + tags)
	if p.Query != "" {
		where = append(where,
			fmt.Sprintf("(p.title ILIKE $%d OR p.tags::text ILIKE $%d)", argPos, argPos),
		)
		args = append(args, "%"+p.Query+"%")
		argPos++
	}

	if p.Category != "" {
		where = append(where, fmt.Sprintf("LOWER(p.category) = LOWER($%d)", argPos))
		args = append(args, p.Category)
		argPos++
	}

	if p.Fabric != "" {
		where = append(where, fmt.Sprintf("p.attributes->>'fabric' = $%d", argPos))
		args = append(args, p.Fabric)
		argPos++
	}

	if p.Color != "" {
		where = append(where,
			fmt.Sprintf("LOWER(v.attributes->>'color') = LOWER($%d)", argPos),
		)
		args = append(args, p.Color)
		argPos++
	}

	if p.Occasion != "" {
		where = append(where,
			fmt.Sprintf("p.attributes->'occasion' ? $%d", argPos),
		)
		args = append(args, p.Occasion)
		argPos++
	}

	if p.MinPrice > 0 {
		where = append(where, fmt.Sprintf("v.price >= $%d", argPos))
		args = append(args, p.MinPrice)
		argPos++
	}

	if p.MaxPrice > 0 {
		where = append(where, fmt.Sprintf("v.price <= $%d", argPos))
		args = append(args, p.MaxPrice)
		argPos++
	}

	// 🔑 FACETS — after ALL filters
	facets, err := s.SearchFacets(ctx, where, args)
	if err != nil {
		return nil, 0, nil, err
	}

	order := "price ASC"
	switch p.Sort {
	case "price_desc":
		order = "price DESC"
	case "newest":
		order = "created_at DESC"
	}

	offset := (p.Page - 1) * p.Limit

	query := fmt.Sprintf(`
WITH ranked_variants AS (
	SELECT
		p.id,
		p.title,
		p.slug,
		p.category,
		v.id AS variant_id,
		v.price,
		p.attributes,
		p.created_at,
		(
			SELECT url
			FROM product_media
			WHERE product_id = p.id
			ORDER BY meta->>'order'
			LIMIT 1
		) AS image_url,
		(v.stock > 0) AS in_stock,
		ROW_NUMBER() OVER (
			PARTITION BY p.id
			ORDER BY v.price ASC
		) AS rn
	FROM products p
	JOIN product_variants v ON v.product_id = p.id
	WHERE %s
	  AND v.stock > 0
)
SELECT
	id,
	title,
	slug,
	category,
	variant_id,
	price,
	image_url,
	attributes,
	in_stock
FROM ranked_variants
WHERE rn = 1
ORDER BY %s
LIMIT $%d OFFSET $%d
`,
		strings.Join(where, " AND "),
		order,
		argPos,
		argPos+1,
	)

	rows, err := s.db.Query(
		ctx,
		query,
		append(args, p.Limit, offset)...,
	)
	if err != nil {
		return nil, 0, nil, err
	}
	defer rows.Close()

	var products []model.ProductCard
	for rows.Next() {
		var prod model.ProductCard
		if err := rows.Scan(
			&prod.ID,
			&prod.Title,
			&prod.Slug,
			&prod.Category,
			&prod.VariantID,
			&prod.Price,
			&prod.ImageURL,
			&prod.Attrs,
			&prod.InStock,
		); err != nil {
			return nil, 0, nil, err
		}
		products = append(products, prod)
	}

	// ---- COUNT QUERY ----
	countQuery := fmt.Sprintf(`
	SELECT COUNT(DISTINCT p.id)
	FROM products p
	JOIN product_variants v ON v.product_id = p.id
	WHERE %s
	  AND v.stock > 0
`, strings.Join(where, " AND "))

	var total int
	if err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, nil, err
	}

	return products, total, facets, nil
}
