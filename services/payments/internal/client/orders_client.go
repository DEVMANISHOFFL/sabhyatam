package client

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

type OrdersClient struct {
	base string
	key  string
	c    *http.Client
}

func NewOrdersClient() *OrdersClient {
	base := os.Getenv("ORDERS_SVC_BASE")
	if base == "" {
		base = "http://localhost:8082" // since you're running locally
	}

	return &OrdersClient{
		base: base,
		key:  os.Getenv("INTERNAL_SERVICE_KEY"),
		c:    &http.Client{Timeout: 5 * time.Second},
	}
}

func (o *OrdersClient) GetOrder(
	ctx context.Context,
	orderID string,
) (int64, string, string, error) {

	req, _ := http.NewRequestWithContext(
		ctx,
		"GET",
		o.base+"/v1/orders/internal/orders/"+orderID,
		nil,
	)

	log.Println("orders base:", o.base)

	req.Header.Set("X-INTERNAL-KEY", o.key)

	resp, err := o.c.Do(req)
	if err != nil {
		return 0, "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, "", "", fmt.Errorf("orders returned %d", resp.StatusCode)
	}

	var out struct {
		AmountCents int64  `json:"amount_cents"`
		Currency    string `json:"currency"`
		Status      string `json:"status"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return 0, "", "", err
	}

	return out.AmountCents, out.Currency, out.Status, nil
}
