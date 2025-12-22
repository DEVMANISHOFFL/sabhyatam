package http

import (
	"encoding/json"
	"net/http"

	"github.com/devmanishoffl/sabhyatam-reviews/internal/domain"
	"github.com/devmanishoffl/sabhyatam-reviews/internal/middleware"
	"github.com/devmanishoffl/sabhyatam-reviews/internal/service"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	reviews *service.ReviewService
}

func New(reviews *service.ReviewService) *Handler {
	return &Handler{reviews: reviews}
}

type createRequest struct {
	OrderItemID string `json:"order_item_id"`
	ProductID   string `json:"product_id"`
	Rating      int    `json:"rating"`
	Title       string `json:"title"`
	Body        string `json:"body"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)

	var req createRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	err := h.reviews.Create(
		r.Context(),
		userID,
		domain.Review{
			OrderItemID: req.OrderItemID,
			ProductID:   req.ProductID,
			Rating:      req.Rating,
			Title:       req.Title,
			Body:        req.Body,
		},
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *Handler) ListReviews(w http.ResponseWriter, r *http.Request) {
	productID := chi.URLParam(r, "productID")

	page := 1
	limit := 10

	reviews, err := h.reviews.ListProductReviews(
		r.Context(),
		productID,
		page,
		limit,
	)
	if err != nil {
		http.Error(w, "failed to fetch reviews", http.StatusInternalServerError)
		return
	}

	// ✅ FIX: Ensure we never send 'null' for an empty list
	if reviews == nil {
		reviews = []domain.Review{}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(reviews)
}

func (h *Handler) RatingSummary(w http.ResponseWriter, r *http.Request) {
	productID := chi.URLParam(r, "productID")

	avg, count, err := h.reviews.GetRatingSummary(
		r.Context(),
		productID,
	)
	if err != nil {
		http.Error(w, "failed to fetch summary", http.StatusInternalServerError)
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]any{
		"average": avg,
		"count":   count,
	})
}

func (h *Handler) ApproveReview(w http.ResponseWriter, r *http.Request) {
	reviewID := chi.URLParam(r, "id")

	if err := h.reviews.Approve(r.Context(), reviewID); err != nil {
		http.Error(w, "failed to approve", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) ListPendingReviews(w http.ResponseWriter, r *http.Request) {
	// Call the service method
	reviews, err := h.reviews.ListPendingReviews(r.Context())
	if err != nil {
		http.Error(w, "failed to fetch pending reviews", http.StatusInternalServerError)
		return
	}

	// Return empty list [] instead of null if nil
	if reviews == nil {
		reviews = []domain.Review{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(reviews)
}
