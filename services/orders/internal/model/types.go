package model

import "time"

type OrderStatus string

const (
	StatusDraft   OrderStatus = "draft"
	StatusPending OrderStatus = "pending_payment"
	StatusPaid    OrderStatus = "paid"
	StatusProc    OrderStatus = "processing"
)

type Order struct {
	ID               string      `json:"id"`
	UserID           *string     `json:"user_id,omitempty"`
	Status           string      `json:"status"`
	Currency         string      `json:"currency"`
	TotalAmountCents int64       `json:"total_amount_cents"`
	CreatedAt        time.Time   `json:"created_at"`
	UpdatedAt        time.Time   `json:"updated_at"`
	Items            []OrderItem `json:"items,omitempty"`
	Subtotal         int64       `json:"subtotal"`
}

type OrderItem struct {
	ID        string `json:"id"`
	OrderID   string `json:"order_id"`
	ProductID string `json:"product_id"`
	Quantity   int   `json:"quantity"`
	PriceCents int64 `json:"price_cents"`
}
