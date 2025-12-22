package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) CheckReviewEligibility(w http.ResponseWriter, r *http.Request) {
	orderItemID := chi.URLParam(r, "orderItemID")
	userID := r.Header.Get("X-USER-ID")

	if orderItemID == "" || userID == "" {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	ok, err := h.store.IsOrderItemReviewEligible(
		r.Context(),
		orderItemID,
	)
	if err != nil {
		http.Error(w, "error checking eligibility", http.StatusInternalServerError)
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]bool{
		"eligible": ok,
	})
}
