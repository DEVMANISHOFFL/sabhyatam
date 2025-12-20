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

// Order represents the data we need from the Orders Service
type Order struct {
	ID     string `json:"id"`
	UserID string `json:"user_id"`
	Status string `json:"status"`
	// ✅ FIX: Map 'subtotal' (incoming from Orders Svc) to 'AmountCents' (used here)
	AmountCents int64  `json:"subtotal"`
	Currency    string `json:"currency"`
}

type OrdersClient struct {
	baseURL string
	key     string
	client  *http.Client
}

func NewOrdersClient() *OrdersClient {
	base := os.Getenv("ORDERS_SVC_BASE")
	if base == "" {
		base = "http://localhost:8082" // Default for local dev
	}

	return &OrdersClient{
		baseURL: base,
		key:     os.Getenv("INTERNAL_SERVICE_KEY"),
		// Use a custom client with timeout for stability
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

// GetOrder fetches order details using the internal API key
// It returns (AmountCents, Currency, Status, error)
func (o *OrdersClient) GetOrder(ctx context.Context, orderID string) (int64, string, string, error) {
	// ✅ FIX: Use the standard endpoint.
	// The internal key in the header authorizes us to see private details.
	url := fmt.Sprintf("%s/v1/orders/%s", o.baseURL, orderID)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return 0, "", "", err
	}

	// Authenticate as an internal service
	req.Header.Set("X-INTERNAL-KEY", o.key)

	log.Printf("Fetching order from: %s", url) // Debug log

	resp, err := o.client.Do(req)
	if err != nil {
		return 0, "", "", fmt.Errorf("failed to call orders service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, "", "", fmt.Errorf("orders service returned status %d", resp.StatusCode)
	}

	var out Order
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return 0, "", "", fmt.Errorf("failed to decode order json: %w", err)
	}

	if out.AmountCents == 0 {
		log.Printf("WARNING: Order %s has 0 amount. Check Orders Service JSON response.", orderID)
	}

	return out.AmountCents, out.Currency, out.Status, nil
}

func (o *OrdersClient) ReleaseOrder(ctx context.Context, orderID string) error {
	url := fmt.Sprintf("%s/v1/orders/%s/release", o.baseURL, orderID)

	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return err
	}

	req.Header.Set("X-INTERNAL-KEY", o.key)

	resp, err := o.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("release order failed with status %d", resp.StatusCode)
	}

	return nil
}

// MarkOrderPaid tells the Order Service that payment was successful
func (o *OrdersClient) MarkOrderPaid(ctx context.Context, orderID string) error {
	url := fmt.Sprintf("%s/v1/orders/%s/paid", o.baseURL, orderID)

	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return err
	}

	req.Header.Set("X-INTERNAL-KEY", o.key)

	// ✅ FIX: Use o.client (with timeout) instead of http.DefaultClient
	resp, err := o.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("mark paid failed with status %d", resp.StatusCode)
	}

	return nil
}
