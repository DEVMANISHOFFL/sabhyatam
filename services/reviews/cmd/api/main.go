package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/devmanishoffl/sabhyatam-reviews/internal/client/orders"
	reviewMiddleware "github.com/devmanishoffl/sabhyatam-reviews/internal/middleware"
	"github.com/devmanishoffl/sabhyatam-reviews/internal/repository"
	"github.com/devmanishoffl/sabhyatam-reviews/internal/service"
	transport "github.com/devmanishoffl/sabhyatam-reviews/internal/transport/http"
)

func main() {
	// ---------- Config ----------
	databaseURL := os.Getenv("DATABASE_URL")
	ordersBaseURL := os.Getenv("ORDERS_SERVICE_URL")
	adminKey := os.Getenv("ADMIN_KEY")

	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseAnonKey := os.Getenv("SUPABASE_ANON_KEY")

	if databaseURL == "" ||
		ordersBaseURL == "" ||
		adminKey == "" ||
		supabaseURL == "" ||
		supabaseAnonKey == "" {
		log.Fatal("missing required environment variables")
	}

	// ---------- DB ----------
	db, err := pgxpool.New(context.Background(), databaseURL)

	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// ---------- Dependencies ----------
	repo := repository.New(db)
	ordersClient := orders.New(ordersBaseURL)
	reviewSvc := service.New(repo, ordersClient)
	handler := transport.New(reviewSvc)

	// ---------- Router ----------
	r := chi.NewRouter()

	// Global middlewares
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(15 * time.Second))

	// ---------- Public routes ----------
	r.Get(
		"/v1/products/{productID}/reviews",
		handler.ListReviews,
	)

	r.Get(
		"/v1/products/{productID}/rating-summary",
		handler.RatingSummary,
	)

	// ---------- Authenticated user routes ----------
	r.Group(func(r chi.Router) {
		r.Use(reviewMiddleware.SupabaseAuth)

		r.Post(
			"/reviews",
			handler.Create,
		)
	})

	// ---------- Admin routes ----------
	r.Group(func(r chi.Router) {
		r.Use(reviewMiddleware.AdminOnly)
		
		r.Get("/v1/admin/reviews/pending", handler.ListPendingReviews)
		r.Post(
			"/v1/admin/reviews/{id}/approve",
			handler.ApproveReview,
		)
	})

	// ---------- Start server ----------
	addr := ":8085"

	row := db.QueryRow(context.Background(), `
  select current_database(), current_schema(), inet_server_addr(), inet_server_port()
`)
	var dbName, schema string
	var port int
	row.Scan(&dbName, &schema, &addr, &port)
	log.Println("DB INFO:", dbName, schema, addr, port)

	log.Println("reviews service running on", addr)

	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatal(err)
	}
}
