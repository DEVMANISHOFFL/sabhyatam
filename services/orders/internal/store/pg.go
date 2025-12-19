package store

import (
	"context"
	"os"

	"github.com/devmanishoffl/sabhyatam-orders/internal/client"
	"github.com/devmanishoffl/sabhyatam-orders/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGStore struct {
	db            *pgxpool.Pool
	productClient *client.ProductClient
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

	return &PGStore{
		db:            pool,
		productClient: client.NewProductClient(),
	}, nil
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
		model.StatusPending,
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
        quantity,
        price_cents
      )
      VALUES ($1, $2, $3, $4)
    `,
			orderID,
			it.ProductID,
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
           quantity, price_cents
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
			&it.Quantity,
			&it.PriceCents,
		); err != nil {
			return nil, err
		}
		o.Items = append(o.Items, it)
	}

	return &o, nil
}

func (s *PGStore) ReleaseOrder(ctx context.Context, orderID string) error {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var status string
	err = tx.QueryRow(ctx,
		`SELECT status FROM orders WHERE id = $1`,
		orderID,
	).Scan(&status)

	if err != nil {
		return err
	}

	if status != "pending_payment" {
		return nil
	}

	rows, err := tx.Query(ctx,
		`SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
		orderID,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	// FIX: Updated struct to use ProductID instead of VariantID
	type item struct {
		ProductID string
		Qty       int
	}

	var items []item
	for rows.Next() {
		var i item
		if err := rows.Scan(&i.ProductID, &i.Qty); err != nil {
			return err
		}
		items = append(items, i)
	}

	for _, it := range items {
		if err := s.productClient.ReleaseStock(ctx, it.ProductID, it.Qty); err != nil {
			return err
		}
	}

	_, err = tx.Exec(ctx,
		`UPDATE orders SET status = 'cancelled', updated_at = now()
     WHERE id = $1`,
		orderID,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *PGStore) RefundOrder(ctx context.Context, orderID string) error {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var status string
	err = tx.QueryRow(
		ctx,
		`SELECT status FROM orders WHERE id = $1`,
		orderID,
	).Scan(&status)
	if err != nil {
		return err
	}

	if status != "paid" {
		return nil
	}

	rows, err := tx.Query(ctx,
		`SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
		orderID,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	type item struct {
		ProductID string
		Qty       int
	}

	var items []item
	for rows.Next() {
		var it item
		if err := rows.Scan(&it.ProductID, &it.Qty); err != nil {
			return err
		}
		items = append(items, it)
	}

	for _, it := range items {
		if err := s.productClient.ReleaseStock(ctx, it.ProductID, it.Qty); err != nil {
			return err
		}
	}

	_, err = tx.Exec(
		ctx,
		`UPDATE orders
     SET status = 'refunded', updated_at = now()
     WHERE id = $1`,
		orderID,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
