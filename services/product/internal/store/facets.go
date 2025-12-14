package store

import (
	"context"
	"fmt"
	"strings"

	"github.com/devmanishoffl/sabhyatam-product/internal/model"
)

func (s *Store) FetchFacets(ctx context.Context) (model.FacetCounts, error) {
	facets := model.FacetCounts{}

	queries := map[string]string{
		"fabric": `
			SELECT attributes->>'fabric', COUNT(*)
			FROM products
			WHERE published = true
			GROUP BY 1
		`,
		"occasion": `
			SELECT jsonb_array_elements_text(attributes->'occasion'), COUNT(*)
			FROM products
			WHERE published = true
			GROUP BY 1
		`,
	}

	for name, q := range queries {
		rows, err := s.db.Query(ctx, q)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		facets[name] = map[string]int{}
		for rows.Next() {
			var key string
			var count int
			rows.Scan(&key, &count)
			facets[name][key] = count
		}
	}

	return facets, nil
}

func (s *Store) SearchFacets(
	ctx context.Context,
	where []string,
	args []any,
) (model.Facets, error) {

	baseWhere := strings.Join(where, " AND ")

	facets := model.Facets{
		"fabric":   {},
		"weave":    {},
		"occasion": {},
	}

	queries := map[string]string{
		"fabric": fmt.Sprintf(`
			SELECT p.attributes->>'fabric' AS key, COUNT(DISTINCT p.id)
			FROM products p
			JOIN product_variants v ON v.product_id = p.id
			WHERE %s AND p.attributes ? 'fabric'
			GROUP BY key
		`, baseWhere),

		"weave": fmt.Sprintf(`
			SELECT p.attributes->>'weave' AS key, COUNT(DISTINCT p.id)
			FROM products p
			JOIN product_variants v ON v.product_id = p.id
			WHERE %s AND p.attributes ? 'weave'
			GROUP BY key
		`, baseWhere),

		"occasion": fmt.Sprintf(`
			SELECT jsonb_array_elements_text(p.attributes->'occasion') AS key,
			       COUNT(DISTINCT p.id)
			FROM products p
			JOIN product_variants v ON v.product_id = p.id
			WHERE %s AND p.attributes ? 'occasion'
			GROUP BY key
		`, baseWhere),
	}

	for facet, q := range queries {
		rows, err := s.db.Query(ctx, q, args...)
		if err != nil {
			return nil, err
		}

		for rows.Next() {
			var key string
			var count int
			if err := rows.Scan(&key, &count); err != nil {
				rows.Close()
				return nil, err
			}
			facets[facet][key] = count
		}
		rows.Close()
	}

	return facets, nil
}
