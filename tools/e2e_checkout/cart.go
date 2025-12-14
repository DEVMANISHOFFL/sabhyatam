package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func addToCart() {
	body := map[string]any{
		"product_id": e2eProductID,
		"variant_id": e2eVariantID,
		"quantity":   1,
	}

	b, _ := json.Marshal(body)

	req, _ := http.NewRequest(
		http.MethodPost,
		cartBase+"/v1/cart/add",
		bytes.NewReader(b),
	)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-SESSION-ID", e2eSessionID)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		panic(fmt.Errorf("addToCart failed: %d", resp.StatusCode))
	}
}
