package api

import (
	"encoding/json"
	"io"
	"net/http"
	"os"

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

	var event struct {
		Event   string `json:"event"`
		Payload struct {
			Payment struct {
				Entity struct {
					ID      string `json:"id"`
					OrderID string `json:"order_id"`
				} `json:"entity"`
			} `json:"payment"`
		} `json:"payload"`
	}

	_ = json.Unmarshal(body, &event)

	if event.Event != "payment.captured" {
		w.WriteHeader(http.StatusOK)
		return
	}

	paymentID := event.Payload.Payment.Entity.ID
	orderID := event.Payload.Payment.Entity.OrderID

	// mark payment captured
	_ = h.store.MarkPaymentCaptured(
		r.Context(),
		paymentID,
		paymentID,
	)

	// call orders service
	req, _ := http.NewRequest(
		"POST",
		"http://orders:8082/v1/orders/"+orderID+"/paid",
		nil,
	)
	req.Header.Set("X-INTERNAL-KEY", os.Getenv("INTERNAL_SERVICE_KEY"))

	http.DefaultClient.Do(req)

	w.WriteHeader(http.StatusOK)
}
