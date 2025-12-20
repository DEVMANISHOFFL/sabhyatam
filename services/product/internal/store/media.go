package store

import (
	"context"
	"encoding/json"

	"github.com/devmanishoffl/sabhyatam-product/internal/model"
)

func (s *Store) GetMediaByProductID(ctx context.Context, productID string) ([]model.Media, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, product_id, variant_id, url, media_type, meta, created_at
		FROM product_media
		WHERE product_id = $1
		ORDER BY (meta->>'order')::int ASC
	`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]model.Media, 0)
	for rows.Next() {
		var m model.Media
		var metaBytes []byte
		var variantID *string // Add this variable to catch the variant_id

		// FIX: Added &variantID to the Scan arguments
		if err := rows.Scan(
			&m.ID,
			&m.ProductID,
			&variantID, // Added this to match the SQL query
			&m.URL,
			&m.MediaType,
			&metaBytes,
			&m.CreatedAt,
		); err != nil {
			return nil, err
		}
		if len(metaBytes) > 0 {
			_ = json.Unmarshal(metaBytes, &m.Meta)
		} else {
			m.Meta = map[string]any{}
		}

		out = append(out, m)
	}

	return out, nil
}
