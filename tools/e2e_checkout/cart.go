package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func addToCart(productID, variantID, sessionID string) {
	if productID == "" || variantID == "" {
		panic("productID or variantID is empty")
	}

	body := map[string]any{
		"product_id": productID,
		"variant_id": variantID,
		"quantity":   1,
	}

	b, _ := json.Marshal(body)

	req, err := http.NewRequest(
		http.MethodPost,
		cartBase+"/v1/cart/add",
		bytes.NewReader(b),
	)
	if err != nil {
		panic(err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-SESSION-ID", sessionID)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		panic(fmt.Errorf("addToCart failed: %d", resp.StatusCode))
	}

}
