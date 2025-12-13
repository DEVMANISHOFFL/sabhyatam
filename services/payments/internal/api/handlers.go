package api

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/devmanishoffl/sabhyatam-payments/internal/gateway"
	"github.com/devmanishoffl/sabhyatam-payments/internal/store"
)

type Handler struct {
	store   *store.PGStore
	gateway gateway.Gateway
}

func NewHandler(s *store.PGStore, g gateway.Gateway) *Handler {
	return &Handler{store: s, gateway: g}
}

func (h *Handler) InitiatePayment(w http.ResponseWriter, r *http.Request) {
	orderID := r.Header.Get("X-ORDER-ID")
	userID := r.Header.Get("X-USER-ID")
	idempotencyKey := r.Header.Get("Idempotency-Key")

	if orderID == "" || idempotencyKey == "" {
		http.Error(w, "missing headers", http.StatusBadRequest)
		return
	}

	var uid *string
	if userID != "" {
		uid = &userID
	}

	payment, err := h.store.CreateInitiatedPayment(
		r.Context(),
		orderID,
		uid,
		0, // amount will be fetched from orders later
		idempotencyKey,
	)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	resp, err := h.gateway.CreatePayment(r.Context(), gateway.CreatePaymentRequest{
		OrderID:     orderID,
		AmountCents: payment.AmountCents,
		Currency:    "INR",
	})
	if err != nil {
		http.Error(w, err.Error(), 502)
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]any{
		"payment_id":       payment.ID,
		"gateway_order_id": resp.GatewayOrderID,
		"status":           payment.Status,
	})
}

func (h *Handler) RazorpayWebhook(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)
	signature := r.Header.Get("X-Razorpay-Signature")

	if err := h.gateway.VerifyWebhook(body, signature); err != nil {
		http.Error(w, "invalid signature", 401)
		return
	}

	w.WriteHeader(http.StatusOK)
}
