package store

import "context"

type PaymentIntent struct {
	ID             string
	OrderID        string
	Gateway        string
	GatewayOrderID string
	AmountCents    int64
	Currency       string
	Status         string
}

func (s *PGStore) CreatePaymentIntent(
	ctx context.Context,
	pi *PaymentIntent,
) error {
	return s.db.QueryRow(ctx, `
		INSERT INTO payment_intents
		(order_id, gateway, gateway_order_id, amount_cents, currency, status)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING id
	`,
		pi.OrderID,
		pi.Gateway,
		pi.GatewayOrderID,
		pi.AmountCents,
		pi.Currency,
		pi.Status,
	).Scan(&pi.ID)
}
