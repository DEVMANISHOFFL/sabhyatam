package store

import (
	"context"
	"os"
	"time"

	"github.com/devmanishoffl/sabhyatam-payments/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGStore struct {
	db *pgxpool.Pool
}

func NewPG(databaseURL string) (*PGStore, error) {
	if databaseURL == "" {
		databaseURL = os.Getenv("DATABASE_URL")
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

func (s *PGStore) CreateInitiatedPayment(
	ctx context.Context,
	orderID string,
	userID *string,
	amount int64,
	idempotencyKey string,
) (*model.Payment, error) {

	var p model.Payment

	err := s.db.QueryRow(ctx, `
		INSERT INTO payments (
			order_id,
			user_id,
			gateway,
			amount_cents,
			currency,
			status,
			idempotency_key
		)
		VALUES ($1,$2,'razorpay',$3,'INR','initiated',$4)
		ON CONFLICT (idempotency_key)
		DO UPDATE SET updated_at = now()
		RETURNING id, status
	`,
		orderID,
		userID,
		amount,
		idempotencyKey,
	).Scan(&p.ID, &p.Status)

	if err != nil {
		return nil, err
	}

	p.OrderID = orderID
	p.UserID = userID
	p.AmountCents = amount
	p.Currency = "INR"
	p.IdempotencyKey = idempotencyKey
	p.Gateway = "razorpay"

	return &p, nil
}

func (s *PGStore) AttachGatewayOrder(
	ctx context.Context,
	paymentID string,
	gatewayOrderID string,
) error {

	_, err := s.db.Exec(ctx, `
		UPDATE payments
		SET gateway_order_id = $1,
		    updated_at = now()
		WHERE id = $2
	`,
		gatewayOrderID,
		paymentID,
	)

	return err
}

func (s *PGStore) MarkCapturedByGatewayOrder(
	ctx context.Context,
	gatewayOrderID string,
	gatewayPaymentID string,
) (string, error) {

	var paymentID string

	err := s.db.QueryRow(ctx, `
		UPDATE payments
		SET status = 'captured',
		    gateway_payment_id = $1,
		    updated_at = now()
		WHERE gateway_order_id = $2
		  AND status != 'captured'
		RETURNING id
	`,
		gatewayPaymentID,
		gatewayOrderID,
	).Scan(&paymentID)

	if err != nil {
		return "", err
	}

	return paymentID, nil
}

func (s *PGStore) GetPaymentAmountByGatewayOrder(
	ctx context.Context,
	gatewayOrderID string,
) (int64, error) {

	var amt int64
	err := s.db.QueryRow(ctx, `
		SELECT amount_cents
		FROM payments
		WHERE gateway_order_id = $1
	`, gatewayOrderID).Scan(&amt)

	return amt, err
}

func (s *PGStore) FindStalePayments(
	ctx context.Context,
	olderThan time.Duration,
) ([]struct {
	PaymentID string
	OrderID   string
}, error) {

	rows, err := s.db.Query(ctx, `
		SELECT id, order_id
		FROM payments
		WHERE status = 'initiated'
		  AND created_at < now() - $1::interval
	`, olderThan.String())
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []struct {
		PaymentID string
		OrderID   string
	}

	for rows.Next() {
		var p struct {
			PaymentID string
			OrderID   string
		}
		if err := rows.Scan(&p.PaymentID, &p.OrderID); err != nil {
			return nil, err
		}
		out = append(out, p)
	}

	return out, nil
}

func (s *PGStore) MarkPaymentFailed(
	ctx context.Context,
	paymentID string,
) error {
	_, err := s.db.Exec(ctx, `
		UPDATE payments
		SET status = 'failed', updated_at = now()
		WHERE id = $1
		  AND status = 'initiated'
	`, paymentID)
	return err
}
