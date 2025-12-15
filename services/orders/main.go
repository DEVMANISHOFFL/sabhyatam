package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/devmanishoffl/sabhyatam-orders/internal/api"
	"github.com/devmanishoffl/sabhyatam-orders/internal/client"
	"github.com/devmanishoffl/sabhyatam-orders/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		fmt.Println("error parsing env: order-svc")
	}

	port := 8082
	if p := os.Getenv("ORDERSVC_PORT"); p != "" {
		if v, err := strconv.Atoi(p); err == nil {
			port = v
		}
	}

	dbURL := os.Getenv("DATABASE_URL")
	log.Println("DATABASE_URL:", dbURL)

	ps, err := store.NewPG(dbURL)
	if err != nil {
		log.Fatal("pg:", err)
	}
	pc := client.NewProductClient()
	cc := client.NewCartClient()
	h := api.NewHandler(ps, pc, cc)

	r := chi.NewRouter()
	r.Use(api.CORSMiddleware)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-SESSION-ID", "X-USER-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	api.RegisterRoutes(r, h)

	addr := ":" + strconv.Itoa(port)
	log.Println("order service listening on", addr)
	log.Fatal(http.ListenAndServe(addr, r))
}
