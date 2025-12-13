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
		// Docker DNS default
		base = "http://product:8080"
	}

	adminKey := os.Getenv("ADMIN_KEY")
	if adminKey == "" {
		adminKey = os.Getenv("PRODUCT_ADMIN_KEY")
	}

	if adminKey == "" {
		fmt.Println("WARNING: ADMIN_KEY not set for ProductClient")
	}

	return &ProductClient{
		base:     base,
		adminKey: adminKey,
		c: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

/* -------------------- READ APIs -------------------- */

func (p *ProductClient) GetProductDetail(
	ctx context.Context,
	productID string,
) (map[string]any, error) {

	url := fmt.Sprintf("%s/v1/products/%s", p.base, productID)

	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)

	resp, err := p.c.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("product service returned %d", resp.StatusCode)
	}

	var out map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}

	return out, nil
}

/* -------------------- STOCK APIs -------------------- */

func (p *ProductClient) ReserveStock(
	ctx context.Context,
	variantID string,
	quantity int,
) error {
	return p.postStockAction(ctx, "reserve", variantID, quantity)
}

func (p *ProductClient) DeductStock(
	ctx context.Context,
	variantID string,
	quantity int,
) error {
	return p.postStockAction(ctx, "deduct", variantID, quantity)
}

func (p *ProductClient) ReleaseStock(
	ctx context.Context,
	variantID string,
	quantity int,
) error {
	return p.postStockAction(ctx, "release", variantID, quantity)
}

/* -------------------- INTERNAL HELPER -------------------- */

func (p *ProductClient) postStockAction(
	ctx context.Context,
	action string,
	variantID string,
	quantity int,
) error {

	url := fmt.Sprintf(
		"%s/v1/admin/variants/%s/%s",
		p.base,
		variantID,
		action,
	)

	body := map[string]int{
		"quantity": quantity,
	}
	b, _ := json.Marshal(body)

	req, _ := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		url,
		bytes.NewReader(b),
	)

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-ADMIN-KEY", p.adminKey)

	resp, err := p.c.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf(
			"product %s failed: %d",
			action,
			resp.StatusCode,
		)
	}

	return nil
}
