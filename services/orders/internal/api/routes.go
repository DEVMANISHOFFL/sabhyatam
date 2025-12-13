package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r *chi.Mux, h *Handler) {
	r.Route("/v1/orders", func(r chi.Router) {
		r.Post("/prepare", h.PrepareOrder)
		r.Post("/confirm", h.ConfirmOrder)
		r.Get("/internal/orders/{orderID}", h.GetOrderInternal)

		r.Post("/{orderID}/paid", h.MarkOrderPaid)

	})
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write([]byte("ok"))
	})
}
