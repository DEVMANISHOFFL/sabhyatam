package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r *chi.Mux, h *Handler) {
	r.Route("/v1/orders", func(r chi.Router) {
		r.Use(UserSessionMiddleware)
		r.Post("/prepare", h.PrepareOrder)
		r.Post("/confirm", h.ConfirmOrder)
		r.Post("/{orderID}/refund", h.RefundOrder)
		r.Post("/orders/from-cart", h.CreateOrderFromCart)
		r.Get("/{orderID}/public", h.GetOrderPublic)

		r.Get("/internal/orders/{orderID}", h.GetOrderInternal)

		r.Post("/{orderID}/paid", h.MarkOrderPaid)
		r.Post("/{orderID}/release", h.ReleaseOrder)
	})

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write([]byte("ok"))
	})
}
