package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func prepareOrder(sessionID string) string {
	req, err := http.NewRequest(
		"POST",
		ordersBase+"/v1/orders/prepare",
		nil,
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

	if resp.StatusCode != http.StatusOK {
		panic(fmt.Errorf("prepareOrder failed: %d", resp.StatusCode))
	}

	var out struct {
		OrderID string `json:"order_id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		panic(err)
	}

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
