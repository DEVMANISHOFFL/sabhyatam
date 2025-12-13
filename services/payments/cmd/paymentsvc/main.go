package main

import (
	"log"
	"net/http"

	"github.com/devmanishoffl/sabhyatam-payments/internal/api"
	"github.com/devmanishoffl/sabhyatam-payments/internal/gateway"
	"github.com/devmanishoffl/sabhyatam-payments/internal/store"
	"github.com/go-chi/chi/v5"
)

func main() {
	store, err := store.NewPG("")
	if err != nil {
		log.Fatal(err)
	}

	gw := gateway.NewRazorpay()
	handler := api.NewHandler(store, gw)

	r := chi.NewRouter()
	api.RegisterRoutes(r, handler)

	log.Println("paymentsvc listening on :8083")
	log.Fatal(http.ListenAndServe(":8083", r))
}
