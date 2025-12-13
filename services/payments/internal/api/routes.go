package api

import "github.com/go-chi/chi/v5"

func RegisterRoutes(r chi.Router, h *Handler) {
	r.Post("/v1/payments/initiate", h.InitiatePayment)
	r.Post("/v1/payments/webhook/razorpay", h.RazorpayWebhook)
}
