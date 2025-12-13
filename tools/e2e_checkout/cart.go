package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

func addToCart(productID, variantID, sessionID string) {
	body := map[string]any{
		"product_id": productID,
		"variant_id": variantID,
		"quantity":   1,
	}

	b, _ := json.Marshal(body)

	var lastErr error

	for i := 1; i <= 10; i++ {
		req, _ := http.NewRequest(
			"POST",
			cartBase+"/v1/cart/add",
			bytes.NewReader(b),
		)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-SESSION-ID", sessionID)

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			lastErr = err
		} else {
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
				return // ✅ success
			}
			lastErr = fmt.Errorf("status %d", resp.StatusCode)
		}

		time.Sleep(2 * time.Second)
	}

	panic(fmt.Errorf("addToCart failed after retries: %v", lastErr))
}
