package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

const (
	productBase  = "http://localhost:8080"
	cartBase     = "http://localhost:8081"
	ordersBase   = "http://localhost:8082"
	paymentsBase = "http://localhost:8083"
)

type OrderPrepareResp struct {
	OrderID     string `json:"order_id"`
	AmountCents int64  `json:"amount_cents"`
	Currency    string `json:"currency"`
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic("missing env: " + key)
	}
	return v
}

func main() {
	// 🔥 YOU ONLY CHANGE THESE TWO
	productID := "15f66f2e-49f3-4c87-8f58-3bf7c0a46471"
	variantID := "35dce073-fe16-476d-a53c-0dc9d015cffb"

	sessionID := "e2e_test_guest_001"

	fmt.Println("🚀 Starting E2E Checkout Test")
	fmt.Println("Product:", productID)
	fmt.Println("Variant:", variantID)
	fmt.Println("Session:", sessionID)

	// 1️⃣ Add to cart
	fmt.Println("\n➜ Adding to cart")
	addToCart(productID, variantID, sessionID)

	// 2️⃣ Prepare order
	fmt.Println("\n➜ Preparing order")
	order := prepareOrder(sessionID)

	// 3️⃣ Initiate payment
	fmt.Println("\n➜ Initiating payment")
	initiatePayment(order.OrderID)

	fmt.Println("\n✅ CHECKOUT FLOW PASSED")
	fmt.Println("Order ID:", order.OrderID)
	fmt.Println("Amount:", order.AmountCents, order.Currency)
}

func addToCart(productID, variantID, sessionID string) {
	body := map[string]any{
		"product_id": productID,
		"variant_id": variantID,
		"quantity":   1,
	}

	b, _ := json.Marshal(body)

	req, _ := http.NewRequest(
		"POST",
		cartBase+"/v1/cart/add",
		bytes.NewReader(b),
	)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-SESSION-ID", sessionID)

	do(req)
}

func prepareOrder(sessionID string) OrderPrepareResp {
	req, _ := http.NewRequest(
		"POST",
		ordersBase+"/v1/orders/prepare",
		nil,
	)
	req.Header.Set("X-SESSION-ID", sessionID)

	resp := do(req)

	var out OrderPrepareResp
	mustDecode(resp, &out)
	return out
}

func initiatePayment(orderID string) {
	req, _ := http.NewRequest(
		"POST",
		paymentsBase+"/v1/payments/initiate",
		nil,
	)
	req.Header.Set("X-ORDER-ID", orderID)
	req.Header.Set("Idempotency-Key", fmt.Sprintf("e2e_%d", time.Now().Unix()))

	do(req)
}

func do(req *http.Request) *http.Response {
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}

	if resp.StatusCode >= 300 {
		var buf bytes.Buffer
		buf.ReadFrom(resp.Body)
		panic(fmt.Sprintf(
			"%s %s failed (%d): %s",
			req.Method,
			req.URL,
			resp.StatusCode,
			buf.String(),
		))
	}

	return resp
}

func mustDecode(resp *http.Response, v any) {
	defer resp.Body.Close()
	if err := json.NewDecoder(resp.Body).Decode(v); err != nil {
		panic(err)
	}
}
