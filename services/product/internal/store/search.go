package store

import (
	"context"
	"database/sql"
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
		where = append(where,
			fmt.Sprintf("(p.title ILIKE $%d OR p.tags::text ILIKE $%d)", arg, arg),
		)
		args = append(args, "%"+p.Query+"%")
		arg++
	}

	if p.Category != "" {
		where = append(where, fmt.Sprintf("p.category = $%d", arg))
		args = append(args, p.Category)
		arg++
	}

	if p.Fabric != "" {
		where = append(where, fmt.Sprintf("p.attributes->>'fabric' = $%d", arg))
		args = append(args, p.Fabric)
		arg++
	}

	if p.Occasion != "" {
		where = append(where,
			fmt.Sprintf("p.attributes->'occasion' ? $%d", arg),
		)
		args = append(args, p.Occasion)
		arg++
	}

	// --- PRICE FILTERS (variant-level) ---
	if p.MinPrice > 0 {
		where = append(where, fmt.Sprintf(`
			EXISTS (
				SELECT 1
				FROM product_variants v
				WHERE v.product_id = p.id
				AND v.price >= $%d
			)
		`, arg))
		args = append(args, p.MinPrice)
		arg++
	}

	if p.MaxPrice > 0 {
		where = append(where, fmt.Sprintf(`
			EXISTS (
				SELECT 1
				FROM product_variants v
				WHERE v.product_id = p.id
				AND v.price <= $%d
			)
		`, arg))
		args = append(args, p.MaxPrice)
		arg++
	}

	offset := (p.Page - 1) * p.Limit

	query := fmt.Sprintf(`
SELECT
	p.id,
	p.title,
	p.slug,
	p.category,
	(
		SELECT v.id
		FROM product_variants v
		WHERE v.product_id = p.id
		ORDER BY v.price ASC
		LIMIT 1
	) AS variant_id,
	COALESCE((
    SELECT (v.price)::INT
    FROM product_variants v
    WHERE v.product_id = p.id
    ORDER BY v.price ASC
    LIMIT 1
), 0) AS price,
		COALESCE((
    SELECT url
    FROM product_media
    WHERE product_id = p.id
    ORDER BY (meta->>'order')::int
    LIMIT 1
), '') AS image_url,
	p.attributes
FROM products p
WHERE %s
ORDER BY p.created_at DESC
LIMIT $%d OFFSET $%d
`,
		strings.Join(where, " AND "),
		arg,
		arg+1,
	)

	rows, err := s.db.Query(ctx, query, append(args, p.Limit, offset)...)
	if err != nil {
		return nil, 0, nil, err
	}
	defer rows.Close()

	var items []model.ProductCard
	for rows.Next() {
		var pc model.ProductCard
		var variantID sql.NullString

		if err := rows.Scan(
			&pc.ID,
			&pc.Title,
			&pc.Slug,
			&pc.Category,
			&variantID,
			&pc.Price,
			&pc.ImageURL,
			&pc.Attrs,
		); err != nil {
			return nil, 0, nil, err
		}

		if variantID.Valid {
			pc.VariantID = variantID.String
		}

		items = append(items, pc)
	}

	countQuery := fmt.Sprintf(`
SELECT COUNT(*)
FROM products p
WHERE %s
`, strings.Join(where, " AND "))

	var total int
	if err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, nil, err
	}

	return items, total, nil, nil
}
