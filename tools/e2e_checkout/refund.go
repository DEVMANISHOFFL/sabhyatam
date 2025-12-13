package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const (
	productBase  = "http://localhost:8080"
	cartBase     = "http://localhost:8081"
	ordersBase   = "http://localhost:8082"
	paymentsBase = "http://localhost:8083"
	internalKey  = "sabhyatam-internal-2025"
)

func main() {
	// 🔥 CHANGE ONLY THESE
	productID := "15f66f2e-49f3-4c87-8f58-3bf7c0a46471"
	variantID := "35dce073-fe16-476d-a53c-0dc9d015cffb"
	sessionID := "e2e_refund_001"

	fmt.Println("🚀 E2E REFUND TEST")

	addToCart(productID, variantID, sessionID)
	orderID := prepareOrder(sessionID)
	initiatePayment(orderID)
	markOrderPaid(orderID)

	fmt.Println("➜ issuing refund")
	refundOrder(orderID)

	fmt.Println("\n✅ REFUND FLOW PASSED")
	fmt.Println("Order:", orderID)
}

/* -------------------- STEPS -------------------- */

func addToCart(productID, variantID, sessionID string) {
	fmt.Println("➜ add to cart")

	body := map[string]any{
		"product_id": productID,
		"variant_id": variantID,
		"quantity":   1,
	}

	doPost(
		cartBase+"/v1/cart/add",
		body,
		map[string]string{
			"X-SESSION-ID": sessionID,
		},
	)
}

func prepareOrder(sessionID string) string {
	fmt.Println("➜ prepare order")

	resp := doPost(
		ordersBase+"/v1/orders/prepare",
		nil,
		map[string]string{
			"X-SESSION-ID": sessionID,
		},
	)

	return resp["order_id"].(string)
}

func initiatePayment(orderID string) {
	fmt.Println("➜ initiate payment")

	doPost(
		paymentsBase+"/v1/payments/initiate",
		nil,
		map[string]string{
			"X-ORDER-ID":      orderID,
			"Idempotency-Key": fmt.Sprintf("e2e_refund_%d", time.Now().Unix()),
		},
	)
}

func markOrderPaid(orderID string) {
	fmt.Println("➜ simulate payment success")

	req, _ := http.NewRequest(
		"POST",
		ordersBase+"/v1/orders/"+orderID+"/paid",
		nil,
	)
	req.Header.Set("X-INTERNAL-KEY", internalKey)

	doReq(req)
}

func refundOrder(orderID string) {
	req, _ := http.NewRequest(
		"POST",
		ordersBase+"/v1/orders/"+orderID+"/refund",
		nil,
	)
	req.Header.Set("X-INTERNAL-KEY", internalKey)

	doReq(req)
}

/* -------------------- HELPERS -------------------- */

func doPost(
	url string,
	body map[string]any,
	headers map[string]string,
) map[string]any {

	var b []byte
	if body != nil {
		b, _ = json.Marshal(body)
	}

	req, _ := http.NewRequest(
		"POST",
		url,
		bytes.NewReader(b),
	)

	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp := doReq(req)

	if resp.Body == nil {
		return map[string]any{}
	}

	var out map[string]any
	json.NewDecoder(resp.Body).Decode(&out)
	resp.Body.Close()
	return out
}

func doReq(req *http.Request) *http.Response {
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}

	if resp.StatusCode >= 300 {
		buf := new(bytes.Buffer)
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
