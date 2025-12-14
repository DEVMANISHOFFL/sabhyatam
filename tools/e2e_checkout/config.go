package main

import "os"

var (
	productBase  = getenv("PRODUCT_BASE", "http://localhost:8080")
	cartBase     = getenv("CART_BASE", "http://localhost:8081")
	ordersBase   = getenv("ORDERS_BASE", "http://localhost:8082")
	paymentsBase = getenv("PAYMENTS_BASE", "http://localhost:8083")

	internalKey = getenv("INTERNAL_SERVICE_KEY", "sabhyatam-internal-2025")

	e2eProductID = mustEnv("E2E_PRODUCT_ID")
	e2eVariantID = mustEnv("E2E_VARIANT_ID")
	e2eSessionID = getenv("E2E_SESSION_ID", "e2e-session-001")
)

func getenv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func mustEnv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		panic("missing required env: " + k)
	}
	return v
}
