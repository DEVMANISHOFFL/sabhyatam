package client

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type ProductClient struct {
	base string
	c    *http.Client
}

func NewProductClientFromEnv() *ProductClient {
	base := os.Getenv("PRODUCT_SVC_BASE")
	if base == "" {
		base = "http://localhost:8080"
	}
	return &ProductClient{
		base: base,
		c:    &http.Client{Timeout: 5 * time.Second},
	}
}

// GetProductDetail calls product service GET /v1/products/{id}
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

// Helper to find variant inside product response
func VariantFromProduct(product map[string]any, variantID string) (map[string]any, bool) {
	if v, ok := product["variants"]; ok {
		if arr, ok := v.([]any); ok {
			for _, x := range arr {
				if m, ok := x.(map[string]any); ok {
					if id, ok := m["id"].(string); ok && id == variantID {
						return m, true
					}
				}
			}
		}
	}
	return nil, false
}
