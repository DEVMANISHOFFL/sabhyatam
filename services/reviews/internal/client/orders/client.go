package orders

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Client struct {
	baseURL string
	http    *http.Client
}

func New(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		http: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

type eligibilityResponse struct {
	Eligible bool `json:"eligible"`
}

func (c *Client) IsOrderItemDelivered(
	ctx context.Context,
	orderItemID string,
	userID string,
) (bool, error) {

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		fmt.Sprintf(
			"%s/internal/order-items/%s/review-eligibility",
			c.baseURL,
			orderItemID,
		),
		nil,
	)
	if err != nil {
		return false, err
	}

	req.Header.Set("X-USER-ID", userID)

	resp, err := c.http.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, nil
	}

	var out eligibilityResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return false, err
	}

	return out.Eligible, nil
}
