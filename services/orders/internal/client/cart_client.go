package client

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type CartClient struct {
	base string
	c    *http.Client
}

func NewCartClientFromEnv() *CartClient {
	base := os.Getenv("CART_SVC_BASE")
	if base == "" {
		base = "http://localhost:8081"
	}
	return &CartClient{base: base, c: &http.Client{Timeout: 5 * time.Second}}
}

func (cc *CartClient) GetCartForUser(ctx context.Context, userID string) (map[string]any, error) {
	url := fmt.Sprintf("%s/v1/cart", cc.base)
	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	req.Header.Set("X-USER-ID", userID)
	resp, err := cc.c.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("cart service returned %d", resp.StatusCode)
	}
	var out map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return out, nil
}

func (c *CartClient) GetCartForSession(ctx context.Context, sessionID string) (map[string]any, error) {
	req, _ := http.NewRequestWithContext(ctx, "GET", c.base+"/v1/cart", nil)
	req.Header.Set("X-SESSION-ID", sessionID)

	resp, err := c.c.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("cart returned %d", resp.StatusCode)
	}

	var out map[string]any
	return out, json.NewDecoder(resp.Body).Decode(&out)
}
