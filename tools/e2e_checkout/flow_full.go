package main

import "log"

func runFullFlow() {
	log.Println("🚀 Starting E2E Checkout Flow")

	addToCart()

	orderID := prepareOrder()
	log.Println("🧾 Order ID:", orderID)

	initiatePayment(orderID)
	markOrderPaid(orderID)
	refundOrder(orderID)

	log.Println("✅ E2E Checkout Flow PASSED")
}
