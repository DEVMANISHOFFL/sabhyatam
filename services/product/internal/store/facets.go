package store

import (
	"context"
	"fmt"
	"strings"

	"github.com/devmanishoffl/sabhyatam-product/internal/model"
)

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
			SELECT p.attributes->>'fabric' AS key, COUNT(p.id)
			FROM products p
			WHERE %s AND p.attributes ? 'fabric'
			GROUP BY key
		`, baseWhere),

		"weave": fmt.Sprintf(`
			SELECT p.attributes->>'weave' AS key, COUNT(p.id)
			FROM products p
			WHERE %s AND p.attributes ? 'weave'
			GROUP BY key
		`, baseWhere),

		"occasion": fmt.Sprintf(`
			SELECT jsonb_array_elements_text(p.attributes->'occasion') AS key, COUNT(p.id)
			FROM products p
			WHERE %s AND p.attributes ? 'occasion'
			GROUP BY key
		`, baseWhere),
	}

	for facet, q := range queries {
		rows, err := s.db.Query(ctx, q, args...)
		if err != nil {
			continue
		}
		for rows.Next() {
			var key string
			var count int
			rows.Scan(&key, &count)
			facets[facet][key] = count
		}
		rows.Close()
	}

	return facets, nil
}
