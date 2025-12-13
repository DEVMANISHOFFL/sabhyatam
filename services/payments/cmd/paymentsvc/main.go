package main

import (
	"log"
	"net/http"
	"os"

	"github.com/devmanishoffl/sabhyatam-payments/internal/api"
	"github.com/devmanishoffl/sabhyatam-payments/internal/client"
	"github.com/devmanishoffl/sabhyatam-payments/internal/gateway"
	"github.com/devmanishoffl/sabhyatam-payments/internal/store"
	"github.com/go-chi/chi/v5"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set for payments service")
	}

	// DB
	pgStore, err := store.NewPG(dbURL)
	if err != nil {
		log.Fatal(err)
	}

	// Gateway
	gw := gateway.NewRazorpay()

	// Orders client
	ordersClient := client.NewOrdersClient()

	handler := api.NewHandler(pgStore, gw, ordersClient)

	r := chi.NewRouter()
	api.RegisterRoutes(r, handler)

	log.Println("paymentsvc listening on :8083")
	log.Fatal(http.ListenAndServe(":8083", r))
}
