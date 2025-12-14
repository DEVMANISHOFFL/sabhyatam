package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r *chi.Mux, h *Handler) {
	r.Route("/v1/cart", func(r chi.Router) {

		r.Use(UserSessionMiddleware)
		r.Get("/", h.GetCart)
		r.Post("/add", h.AddItem)
		r.Post("/update", h.UpdateItem)
		r.Post("/remove", h.RemoveItem)
		r.Post("/merge", h.MergeCarts) // expects {guest_id, user_id}
	})
	// health
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write([]byte("ok"))
	})
}
