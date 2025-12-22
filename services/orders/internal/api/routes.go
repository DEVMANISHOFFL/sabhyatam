package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r *chi.Mux, h *Handler) {
	r.Route("/v1/orders", func(r chi.Router) {
		// Middleware to extract X-USER-ID / X-SESSION-ID headers
		r.Use(UserSessionMiddleware)

		// 1. List/Create Routes
		r.Get("/me", h.GetMyOrders)
		r.Post("/prepare", h.PrepareOrder)
		r.Post("/confirm", h.ConfirmOrder)
		r.Post("/from-cart", h.CreateOrderFromCart)

		r.Get(
			"/internal/order-items/{orderItemID}/review-eligibility",
			h.CheckReviewEligibility,
		)
		// 2. Single Order Routes
		// IMPORTANT: We use {id} here because handlers.go uses chi.URLParam(r, "id")
		r.Route("/{id}", func(r chi.Router) {
			// Unified GET: Handles both User (My Order) and Internal (Payments Svc) access
			r.Get("/", h.GetOrder)
			r.Get("/public", h.GetOrderPublic)
			// Internal / System Actions
			r.Post("/paid", h.MarkOrderPaid)
			r.Post("/release", h.ReleaseOrder)
			r.Post("/refund", h.RefundOrder)
		})
	})

	// Admin Routes
	r.Route("/v1/admin", func(r chi.Router) {
		r.Use(AdminMiddleware)
		r.Get("/orders", h.AdminListOrders)
	})

	// Health Check
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write([]byte("ok"))
	})

	r.Get("/internal/order-items/{id}/review-eligibility", func(w http.ResponseWriter, r *http.Request) {
		orderItemID := chi.URLParam(r, "id")

		eligible, err := h.store.IsOrderItemReviewEligible(r.Context(), orderItemID)
		if err != nil {
			http.Error(w, "not eligible", http.StatusForbidden)
			return
		}

		json.NewEncoder(w).Encode(map[string]bool{
			"eligible": eligible,
		})
	})

}
