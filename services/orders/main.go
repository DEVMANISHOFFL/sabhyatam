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
	"github.com/go-chi/chi/v5/middleware" // Import standard middleware
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	// 1. Load Environment
	if err := godotenv.Load(); err != nil {
		fmt.Println("Warning: .env file not found")
	}

	port := 8082
	if p := os.Getenv("ORDERSVC_PORT"); p != "" {
		if v, err := strconv.Atoi(p); err == nil {
			port = v
		}
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	// 2. Initialize Dependencies
	ps, err := store.NewPG(dbURL)
	if err != nil {
		log.Fatal("Failed to connect to db:", err)
	}
	defer ps.Close() // Good practice to close pool on exit

	pc := client.NewProductClient()
	cc := client.NewCartClient()
	h := api.NewHandler(ps, pc, cc)

	// 3. Setup Router
	r := chi.NewRouter()

	// 4. Register Middleware
	r.Use(middleware.Logger)    // Log requests
	r.Use(middleware.Recoverer) // Prevent crashes

	// --- FIX: Unified CORS Configuration ---
	r.Use(cors.Handler(cors.Options{
		// Allow specific origin (localhost:3000) or use "*" for development
		AllowedOrigins: []string{"http://localhost:3000", "https://sabhyatam.com"},

		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},

		// Crucial: "Authorization" is needed for JWT, custom headers for your internal logic
		AllowedHeaders: []string{
			"Accept",
			"Authorization",
			"Content-Type",
			"X-CSRF-Token",
			"X-SESSION-ID",
			"X-USER-ID",
			"X-INTERNAL-KEY",
		},

		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// 5. Register Routes
	api.RegisterRoutes(r, h)

	// 6. Start Server
	addr := ":" + strconv.Itoa(port)
	log.Printf("🚀 Order Service running on http://localhost%s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatal(err)
	}
}
