package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/devmanishoffl/sabhyatam-payments/internal/api"
	"github.com/devmanishoffl/sabhyatam-payments/internal/client"
	"github.com/devmanishoffl/sabhyatam-payments/internal/gateway"
	"github.com/devmanishoffl/sabhyatam-payments/internal/store"
	"github.com/devmanishoffl/sabhyatam-payments/internal/worker"
	"github.com/go-chi/chi/v5"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set for payments service")
	}

	// Context for background workers
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// DB
	pgStore, err := store.NewPG(dbURL)
	if err != nil {
		log.Fatal(err)
	}

	// Orders client
	ordersClient := client.NewOrdersClient()

	// Start payment timeout worker
	timeoutWorker := worker.NewPaymentTimeoutWorker(
		pgStore,
		ordersClient,
		15*time.Minute,
	)
	go timeoutWorker.Run(ctx)

	// Payment gateway
	gw := gateway.NewRazorpay()

	// HTTP handler
	handler := api.NewHandler(pgStore, gw, ordersClient)

	r := chi.NewRouter()
	api.RegisterRoutes(r, handler)

	log.Println("paymentsvc listening on :8083")
	log.Fatal(http.ListenAndServe(":8083", r))
}
