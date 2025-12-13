package gateway

type CreateOrderRequest struct {
	AmountCents int64
	Currency    string
	Receipt     string
}

type CreateOrderResponse struct {
	ID       string
	Amount   int64
	Currency string
}

type PaymentGateway interface {
	CreateOrder(req CreateOrderRequest) (*CreateOrderResponse, error)
}
