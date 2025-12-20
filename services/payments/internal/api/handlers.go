package api

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/devmanishoffl/sabhyatam-payments/internal/client"
	"github.com/devmanishoffl/sabhyatam-payments/internal/gateway"
	"github.com/devmanishoffl/sabhyatam-payments/internal/store"
	"github.com/google/uuid"
)

type Handler struct {
	store   *store.PGStore
	gateway gateway.Gateway
	orders  *client.OrdersClient
}

func NewHandler(
	s *store.PGStore,
	g gateway.Gateway,
	o *client.OrdersClient,
) *Handler {
	return &Handler{store: s, gateway: g, orders: o}
}

func (h *Handler) InitiatePayment(w http.ResponseWriter, r *http.Request) {
	orderID := r.Header.Get("X-ORDER-ID")
	userID := r.Header.Get("X-USER-ID")

	idempotencyKey := r.Header.Get("Idempotency-Key")

	missing := []string{}

	if orderID == "" {
		missing = append(missing, "X-ORDER-ID")
	}
	if idempotencyKey == "" {
		missing = append(missing, "Idempotency-Key")
	}

	if len(missing) > 0 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"error":           "missing required headers",
			"missing_headers": missing,
		})
		return
	}

	var uid *string
	if userID != "" {
		uid = &userID
	}

	// ✅ STEP 2: fetch order from orders service
	amount, currency, status, err := h.orders.GetOrder(r.Context(), orderID)
	if err != nil {
		http.Error(w, "failed to fetch order", http.StatusBadGateway)
		return
	}

	if status != "pending_payment" {
		http.Error(w, "order not payable", http.StatusBadRequest)
		return
	}

	if amount <= 0 {
		http.Error(w, "invalid order amount", http.StatusBadRequest)
		return
	}

	// ✅ create payment with authoritative amount
	payment, err := h.store.CreateInitiatedPayment(
		r.Context(),
		orderID,
		uid,
		amount,
		idempotencyKey,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// ✅ create gateway order with same amount
	resp, err := h.gateway.CreatePayment(r.Context(), gateway.CreatePaymentRequest{
		OrderID:     orderID,
		AmountCents: amount,
		Currency:    currency,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}

	if err := h.store.AttachGatewayOrder(
		r.Context(),
		payment.ID,
		resp.GatewayOrderID,
	); err != nil {
		http.Error(w, "failed to persist gateway order", http.StatusInternalServerError)
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]any{
		"payment_id":       payment.ID,
		"gateway_order_id": resp.GatewayOrderID,
		"amount_cents":     amount,
		"currency":         currency,
		"status":           payment.Status,
	})
}

func (h *Handler) RazorpayWebhook(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)
	signature := r.Header.Get("X-Razorpay-Signature")

	if err := h.gateway.VerifyWebhook(body, signature); err != nil {
		http.Error(w, "invalid signature", http.StatusUnauthorized)
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

	if err := json.Unmarshal(body, &event); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}

	if event.Event != "payment.captured" {
		w.WriteHeader(http.StatusOK)
		return
	}

	gatewayPaymentID := event.Payload.Payment.Entity.ID
	gatewayOrderID := event.Payload.Payment.Entity.OrderID

	_, err := h.store.MarkCapturedByGatewayOrder(
		r.Context(),
		gatewayOrderID,
		gatewayPaymentID,
	)
	if err != nil {
		w.WriteHeader(http.StatusOK)
		return
	}

	req, err := http.NewRequest(
		"POST",
		"http://orders:8082/v1/orders/"+gatewayOrderID+"/paid",
		nil,
	)
	if err == nil {
		req.Header.Set("X-INTERNAL-KEY", os.Getenv("INTERNAL_SERVICE_KEY"))
		http.DefaultClient.Do(req)
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) CreatePaymentIntent(w http.ResponseWriter, r *http.Request) {
	var body struct {
		OrderID     string `json:"order_id"`
		AmountCents int64  `json:"amount_cents"`
		Currency    string `json:"currency"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	if body.OrderID == "" || body.AmountCents <= 0 {
		http.Error(w, "invalid payment request", http.StatusBadRequest)
		return
	}

	// mock gateway payload for now
	intentID := uuid.NewString()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"payment_id": intentID,
		"order_id":   body.OrderID,
		"amount":     body.AmountCents,
		"currency":   body.Currency,
		"gateway": map[string]any{
			"type": "mock",
			"id":   intentID,
		},
	})
}

func (h *Handler) MockPaymentSuccess(w http.ResponseWriter, r *http.Request) {
	log.Println("payments: server booting")

	var body struct {
		OrderID string `json:"order_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	err := h.orders.MarkOrderPaid(r.Context(), body.OrderID)
	if err != nil {
		http.Error(w, "failed to mark order paid", http.StatusBadGateway)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// payments/internal/api/handlers.go

// ... existing code ...

func (h *Handler) VerifyPayment(w http.ResponseWriter, r *http.Request) {
	var body struct {
		OrderID        string `json:"order_id"`
		PaymentID      string `json:"payment_id"`       // razorpay_payment_id
		GatewayOrderID string `json:"gateway_order_id"` // razorpay_order_id
		Signature      string `json:"signature"`        // razorpay_signature
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	// 1. Verify Signature
	// The signature is generated using "order_id|payment_id"
	data := body.GatewayOrderID + "|" + body.PaymentID
	err := h.gateway.VerifyWebhook([]byte(data), body.Signature)
	if err != nil {
		http.Error(w, "payment verification failed", http.StatusUnauthorized)
		return
	}

	// 2. Mark Payment as Captured in DB
	_, err = h.store.MarkCapturedByGatewayOrder(r.Context(), body.GatewayOrderID, body.PaymentID)
	if err != nil {
		log.Printf("Failed to mark captured: %v", err)
		// Don't fail the request if it's already captured, just proceed to notify orders
	}

	// 3. Notify Orders Service to Mark Paid
	err = h.orders.MarkOrderPaid(r.Context(), body.OrderID)
	if err != nil {
		log.Printf("Failed to notify orders service: %v", err)
		http.Error(w, "payment verified but order update failed", http.StatusBadGateway)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}
