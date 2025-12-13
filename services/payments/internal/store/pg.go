package store

import (
	"context"
	"os"

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

func (s *PGStore) MarkPaymentCaptured(
	ctx context.Context,
	paymentID string,
	gatewayPaymentID string,
) error {

	_, err := s.db.Exec(ctx, `
		UPDATE payments
		SET status='captured',
		    gateway_payment_id=$1,
		    updated_at=now()
		WHERE id=$2
	`,
		gatewayPaymentID,
		paymentID,
	)

	return err
}
