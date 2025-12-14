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
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
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
	r.Use(middleware.Logger)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-USER-ID", "X-SESSION-ID"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	api.RegisterRoutes(r, h)

	addr := ":" + strconv.Itoa(port)
	log.Println("cart service listening on", addr)
	log.Fatal(http.ListenAndServe(addr, r))
}
