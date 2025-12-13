package gateway

import "context"

type CreatePaymentRequest struct {
	OrderID     string
	AmountCents int64
	Currency    string
}

type CreatePaymentResponse struct {
	GatewayOrderID string
}

type Gateway interface {
	CreatePayment(ctx context.Context, req CreatePaymentRequest) (*CreatePaymentResponse, error)
	VerifyWebhook(body []byte, signature string) error
}
