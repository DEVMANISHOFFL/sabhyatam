package main

import (
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/devmanishoffl/sabhyatam-cart/internal/api"
	"github.com/devmanishoffl/sabhyatam-cart/internal/client"
	"github.com/devmanishoffl/sabhyatam-cart/internal/store"
	"github.com/go-chi/chi/v5"
)

func main() {
	port := 8081
	if p := os.Getenv("CART_SERVICE_PORT"); p != "" {
		if v, err := strconv.Atoi(p); err == nil {
			port = v
		}
	}

	rs, err := store.NewRedisFromEnv()
	if err != nil {
		log.Fatal("redis:", err)
	}
	pc := client.NewProductClientFromEnv()
	h := api.NewHandler(rs, pc)

	r := chi.NewRouter()
	api.RegisterRoutes(r, h)

	addr := ":" + strconv.Itoa(port)
	log.Println("cart service listening on", addr)
	log.Fatal(http.ListenAndServe(addr, r))
}
