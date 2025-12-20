package store

import (
	"context"
	"fmt"
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
			// Fallback for local development
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
	// 1. Insert Order
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

	// 2. Insert Items
	// Note: We omit 'variant_id' here. Ensure your DB column is nullable!
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

	// 1. Fetch Order Details (Including total_amount_cents)
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
		&o.Subtotal, // ✅ FIXED: Maps to model.Subtotal (was TotalAmountCents)
		&o.CreatedAt,
		&o.UpdatedAt,
	); err != nil {
		return nil, err
	}

	// 2. Fetch Items
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

	o.Items = []model.OrderItem{} // Initialize as empty array
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

func (s *PGStore) ListOrders(ctx context.Context, page, limit int, status string) ([]model.Order, int, error) {
	offset := (page - 1) * limit

	whereClause := ""
	args := []any{}
	argId := 1

	if status != "" {
		whereClause = fmt.Sprintf("WHERE status = $%d", argId)
		args = append(args, status)
		argId++
	}

	// 1. Count
	var total int
	countQuery := "SELECT COUNT(*) FROM orders " + whereClause
	if err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// 2. Select
	query := fmt.Sprintf(`
		SELECT id, user_id, status, currency, total_amount_cents, created_at, updated_at
		FROM orders
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argId, argId+1)

	args = append(args, limit, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	orders := []model.Order{}

	for rows.Next() {
		var o model.Order
		if err := rows.Scan(
			&o.ID,
			&o.UserID,
			&o.Status,
			&o.Currency,
			&o.Subtotal, // ✅ FIXED: Maps to model.Subtotal
			&o.CreatedAt,
			&o.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		o.Items = []model.OrderItem{} // Ensure items is not nil
		orders = append(orders, o)
	}

	return orders, total, nil
}

func (s *PGStore) GetOrdersByUserID(ctx context.Context, userID string) ([]model.Order, error) {
	// 1. Fetch Orders
	rows, err := s.db.Query(ctx, `
		SELECT id, user_id, status, currency, total_amount_cents, created_at, updated_at
		FROM orders
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []model.Order
	orderMap := make(map[string]*model.Order)
	var orderIDs []string

	for rows.Next() {
		var o model.Order
		o.Items = []model.OrderItem{}

		if err := rows.Scan(
			&o.ID, &o.UserID, &o.Status, &o.Currency,
			&o.Subtotal, // ✅ FIXED: Maps to model.Subtotal
			&o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			return nil, err
		}

		orders = append(orders, o)
		orderIDs = append(orderIDs, o.ID)
	}
	rows.Close()

	if len(orders) == 0 {
		return []model.Order{}, nil
	}

	// Re-map pointers after appending to slice
	for i := range orders {
		orderMap[orders[i].ID] = &orders[i]
	}

	// 2. Fetch Items (Bulk)
	itemRows, err := s.db.Query(ctx, `
		SELECT id, order_id, product_id, quantity, price_cents
		FROM order_items
		WHERE order_id = ANY($1)
	`, orderIDs)
	if err != nil {
		return nil, err
	}
	defer itemRows.Close()

	for itemRows.Next() {
		var it model.OrderItem
		var oID string

		if err := itemRows.Scan(
			&it.ID, &oID, &it.ProductID, &it.Quantity, &it.PriceCents,
		); err != nil {
			return nil, err
		}

		if order, exists := orderMap[oID]; exists {
			order.Items = append(order.Items, it)
		}
	}

	return orders, nil
}
