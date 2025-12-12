package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type ProductClient struct {
	base     string
	c        *http.Client
	adminKey string
}

func NewProductClientFromEnv() *ProductClient {
	godotenv.Load()
	base := os.Getenv("PRODUCT_SVC_BASE")
	if base == "" {
		base = "http://localhost:8080"
	}

	adminKey := os.Getenv("PRODUCT_ADMIN_KEY")
	if adminKey == "" {
		fmt.Println("WARNING: PRODUCT_ADMIN_KEY is not set")
	}

	return &ProductClient{
		base:     base,
		c:        &http.Client{Timeout: 5 * time.Second},
		adminKey: adminKey,
	}
}

func (p *ProductClient) GetProductDetail(ctx context.Context, productID string) (map[string]any, error) {
	url := fmt.Sprintf("%s/v1/products/%s", p.base, productID)
	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	resp, err := p.c.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("product service returned %d", resp.StatusCode)
	}
	var out map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return out, nil
}

func (p *ProductClient) DeductStock(ctx context.Context, variantID string, quantity int) error {
	url := fmt.Sprintf("%s/v1/admin/variants/%s/deduct", p.base, variantID)
	body := map[string]any{"quantity": quantity}
	b, _ := json.Marshal(body)

	req, _ := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")

	// 💥 THE FIX: FORWARD ADMIN KEY
	req.Header.Set("X-ADMIN-KEY", p.adminKey)

	resp, err := p.c.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("deduct returned %d", resp.StatusCode)
	}
	return nil
}

func (p *ProductClient) ReserveStock(ctx context.Context, variantID string, quantity int) error {
	url := fmt.Sprintf("%s/v1/admin/variants/%s/reserve", p.base, variantID)
	body := map[string]any{"quantity": quantity}
	b, _ := json.Marshal(body)

	req, _ := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")

	// 💥 THE FIX AGAIN
	req.Header.Set("X-ADMIN-KEY", p.adminKey)

	resp, err := p.c.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("reserve returned %d", resp.StatusCode)
	}
	return nil
}
