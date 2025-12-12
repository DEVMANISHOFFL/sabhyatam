package store

import (
	"context"
	"encoding/json"

	"github.com/devmanishoffl/sabhyatam-product/internal/model"
)

func (s *Store) GetMediaByProductID(ctx context.Context, productID string) ([]model.Media, error) {
	rows, err := s.db.Query(ctx, `
        SELECT 
            id, 
            product_id, 
            sku,              -- scan this even if it's empty
            url, 
            type, 
            attributes,
            created_at
        FROM product_media
        WHERE product_id = $1
        ORDER BY (attributes->>'order')::int ASC
    `, productID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []model.Media

	for rows.Next() {
		var (
			m     model.Media
			attrs []byte
			sku   *string // placeholder for sku column; ignore its value
		)

		if err := rows.Scan(
			&m.ID,
			&m.ProductID,
			&sku, // sku column
			&m.URL,
			&m.Type,
			&attrs,
			&m.CreatedAt,
		); err != nil {
			return nil, err
		}

		// parse JSON attributes
		if len(attrs) > 0 {
			var meta map[string]any
			_ = json.Unmarshal(attrs, &meta)
			m.Attributes = meta
		} else {
			m.Attributes = map[string]any{}
		}

		out = append(out, m)
	}

	return out, nil
}
