package model

import "time"

type Payment struct {
	ID      string
	OrderID string
	UserID  *string

	Gateway          string
	GatewayPaymentID *string
	GatewayOrderID   *string

	AmountCents    int64
	Currency       string
	Status         string
	IdempotencyKey string

	CreatedAt time.Time
	UpdatedAt time.Time
}
