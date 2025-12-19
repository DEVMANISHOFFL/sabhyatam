package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type ProductClient struct {
	base     string
	adminKey string
	c        *http.Client
}

func NewProductClient() *ProductClient {
	base := os.Getenv("PRODUCT_SVC_BASE")
	if base == "" {
		base = "http://localhost:8080"
	}

	adminKey := os.Getenv("ADMIN_KEY")
	if adminKey == "" {
		adminKey = os.Getenv("PRODUCT_ADMIN_KEY")
	}

	return &ProductClient{
		base:     base,
		adminKey: adminKey,
		c: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

/* -------------------- STOCK APIs -------------------- */

func (p *ProductClient) ReserveStock(ctx context.Context, productID string, quantity int) error {
	return p.postStockAction(ctx, "reserve", productID, quantity)
}

func (p *ProductClient) DeductStock(ctx context.Context, productID string, quantity int) error {
	return p.postStockAction(ctx, "deduct", productID, quantity)
}

func (p *ProductClient) ReleaseStock(ctx context.Context, productID string, quantity int) error {
	return p.postStockAction(ctx, "release", productID, quantity)
}

/* -------------------- INTERNAL HELPER -------------------- */

func (p *ProductClient) postStockAction(ctx context.Context, action string, productID string, quantity int) error {
	// Updated URL structure: /v1/admin/products/{id}/stock/{action}
	url := fmt.Sprintf("%s/v1/admin/products/%s/stock/%s", p.base, productID, action)

	body := map[string]int{"quantity": quantity}
	b, _ := json.Marshal(body)

	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-ADMIN-KEY", p.adminKey)

	resp, err := p.c.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("product %s failed: %d", action, resp.StatusCode)
	}
	return nil
}
