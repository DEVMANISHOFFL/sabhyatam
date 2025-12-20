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
	"github.com/go-chi/cors" // Ensure you have this import
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

	// Payment gateway (FIXED: Handles both return values)
	gw, err := gateway.NewRazorpay()
	if err != nil {
		log.Fatalf("Failed to initialize Gateway: %v. Check RAZORPAY_KEY_ID in .env", err)
	}

	// HTTP handler
	handler := api.NewHandler(pgStore, gw, ordersClient)

	r := chi.NewRouter()

	// Add CORS (Vital for frontend communication)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-USER-ID", "X-ORDER-ID", "Idempotency-Key"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	api.RegisterRoutes(r, handler)

	log.Println("paymentsvc listening on :8083")
	if err := http.ListenAndServe(":8083", r); err != nil {
		log.Fatal(err)
	}
}
