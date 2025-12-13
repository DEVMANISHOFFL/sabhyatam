package store

import (
	"context"
	"os"

	"github.com/devmanishoffl/sabhyatam-orders/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGStore struct {
	db *pgxpool.Pool
}

func NewPG(databaseURL string) (*PGStore, error) {
	if databaseURL == "" {
		databaseURL = os.Getenv("DATABASE_URL")
		if databaseURL == "" {
			databaseURL = "postgres://postgres:postgres@localhost:5432/sabhyatam?sslmode=disable"
		}
	}

	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		return nil, err
	}

	return &PGStore{db: pool}, nil
}

func (s *PGStore) Close() {
	s.db.Close()
}

func (s *PGStore) CreateDraftOrder(
	ctx context.Context,
	userID *string,
	items []model.OrderItem,
	totalCents int64,
) (string, error) {

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return "", err
	}

	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback(ctx)
		}
	}()

	var orderID string
	err = tx.QueryRow(ctx, `
		INSERT INTO orders (user_id, status, currency, total_amount_cents)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`,
		userID,
		model.StatusDraft,
		"INR",
		totalCents,
	).Scan(&orderID)

	if err != nil {
		return "", err
	}

	for _, it := range items {
		_, err = tx.Exec(ctx, `
			INSERT INTO order_items (
				order_id,
				product_id,
				variant_id,
				quantity,
				price_cents
			)
			VALUES ($1, $2, $3, $4, $5)
		`,
			orderID,
			it.ProductID,
			it.VariantID,
			it.Quantity,
			it.PriceCents,
		)

		if err != nil {
			return "", err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return "", err
	}
	committed = true

	return orderID, nil
}

func (s *PGStore) UpdateOrderStatus(
	ctx context.Context,
	orderID string,
	status string,
) error {
	_, err := s.db.Exec(
		ctx,
		`UPDATE orders SET status=$1, updated_at=now() WHERE id=$2`,
		status,
		orderID,
	)
	return err
}

func (s *PGStore) GetOrder(ctx context.Context, orderID string) (*model.Order, error) {
	var o model.Order

	row := s.db.QueryRow(ctx, `
		SELECT id, user_id, status, currency,
		       total_amount_cents, created_at, updated_at
		FROM orders
		WHERE id=$1
	`, orderID)

	if err := row.Scan(
		&o.ID,
		&o.UserID,
		&o.Status,
		&o.Currency,
		&o.TotalAmountCents,
		&o.CreatedAt,
		&o.UpdatedAt,
	); err != nil {
		return nil, err
	}

	rows, err := s.db.Query(ctx, `
		SELECT id, order_id, product_id,
		       variant_id, quantity, price_cents
		FROM order_items
		WHERE order_id=$1
	`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var it model.OrderItem
		if err := rows.Scan(
			&it.ID,
			&it.OrderID,
			&it.ProductID,
			&it.VariantID,
			&it.Quantity,
			&it.PriceCents,
		); err != nil {
			return nil, err
		}
		o.Items = append(o.Items, it)
	}

	return &o, nil
}
