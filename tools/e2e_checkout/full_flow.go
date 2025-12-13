package e2echeckout
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
	productID := "15f66f2e-49f3-4c87-8f58-3bf7c0a46471"
	variantID := "35dce073-fe16-476d-a53c-0dc9d015cffb"
	sessionID := fmt.Sprintf("e2e_%d", time.Now().Unix())

	fmt.Println("🚀 FULL E2E CHECKOUT FLOW")

	addToCart(productID, variantID, sessionID)
	orderID := prepareOrder(sessionID)
	initiatePayment(orderID)
	markOrderPaid(orderID)
	refundOrder(orderID)

	fmt.Println("✅ FULL FLOW PASSED")
	fmt.Println("Order:", orderID)
}
