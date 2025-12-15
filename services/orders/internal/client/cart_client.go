package client

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type CartResponse struct {
	Items    []CartItem `json:"items"`
	Subtotal int64      `json:"subtotal"`
}

type CartItem struct {
	Product struct {
		ID    string `json:"id"`
		Title string `json:"title"`
		Slug  string `json:"slug"`
		Image string `json:"image"`
	} `json:"product"`

	Variant struct {
		ID    string `json:"id"`
		Price int64  `json:"price"`
		MRP   int64  `json:"mrp"`
	} `json:"variant"`

	Quantity  int   `json:"quantity"`
	LineTotal int64 `json:"line_total"`
}

type CartClient struct {
	base string
	c    *http.Client
}

func NewCartClient() *CartClient {
	base := os.Getenv("CART_SVC_BASE")
	if base == "" {
		base = "http://localhost:8081"
	}
	return &CartClient{base: base, c: &http.Client{Timeout: 5 * time.Second}}
}

func (c *CartClient) GetCartForUser(ctx context.Context, userID string) (*CartResponse, error) {
	req, _ := http.NewRequestWithContext(ctx, "GET", c.base+"/v1/cart/", nil)

	req.Header.Set("X-USER-ID", userID)

	resp, err := c.c.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("cart returned %d", resp.StatusCode)
	}

	var out CartResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}

	return &out, nil
}

func (c *CartClient) GetCartForSession(ctx context.Context, sessionID string) (*CartResponse, error) {
	req, _ := http.NewRequestWithContext(ctx, "GET", c.base+"/v1/cart/", nil)

	// ✅ CRITICAL: forward session identity
	req.Header.Set("X-SESSION-ID", sessionID)
	resp, err := c.c.Do(req)
	req.AddCookie(&http.Cookie{
		Name:  "sabhyatam_session",
		Value: sessionID,
	})

	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("cart returned %d", resp.StatusCode)
	}

	var out CartResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}

	return &out, nil
}
