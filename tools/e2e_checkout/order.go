package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func prepareOrder() string {
	req, _ := http.NewRequest(
		http.MethodPost,
		ordersBase+"/v1/orders/prepare",
		bytes.NewReader([]byte(`{}`)),
	)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-SESSION-ID", e2eSessionID)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		panic(fmt.Errorf("prepareOrder failed: %d", resp.StatusCode))
	}

	var out struct {
		OrderID string `json:"order_id"`
	}
	json.NewDecoder(resp.Body).Decode(&out)

	return out.OrderID
}

func markOrderPaid(orderID string) {
	req, _ := http.NewRequest(
		"POST",
		ordersBase+"/v1/orders/"+orderID+"/paid",
		nil,
	)
	req.Header.Set("X-INTERNAL-KEY", internalKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		panic(fmt.Errorf("markOrderPaid failed: %d", resp.StatusCode))
	}
}
