package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/devmanishoffl/sabhyatam-product/internal/api"
	"github.com/devmanishoffl/sabhyatam-product/internal/config"
	"github.com/devmanishoffl/sabhyatam-product/internal/store"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load(".env") // optional

	cfg := config.LoadFromEnv()
	db, err := store.NewPG(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db conn error: %v", err)
	}
	defer db.Close(context.Background())

	r := chi.NewRouter()
	r.Use(middleware.Logger)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000",
		},
		AllowedMethods: []string{
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"OPTIONS",
		},
		AllowedHeaders: []string{
			"Accept",
			"Authorization",
			"Content-Type",
			"X-SESSION-ID",
			"X-ADMIN-KEY",
		},
		ExposedHeaders: []string{
			"Link",
		},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		_, _ = w.Write([]byte("ok"))
	})

	api.RegisterRoutes(r, db)

	addr := fmt.Sprintf(":%d", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("productsvc listening on %s", addr)
	log.Fatal(srv.ListenAndServe())
}
