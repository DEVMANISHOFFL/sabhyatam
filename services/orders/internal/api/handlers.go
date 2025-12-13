package api

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/devmanishoffl/sabhyatam-orders/internal/client"
	"github.com/devmanishoffl/sabhyatam-orders/internal/model"
	"github.com/devmanishoffl/sabhyatam-orders/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handler struct {
	store      *store.PGStore
	pclient    *client.ProductClient
	cartClient *client.CartClient
}

func isValidUUID(id string) bool {
	_, err := uuid.Parse(id)
	return err == nil
}

func NewHandler(s *store.PGStore, pc *client.ProductClient, cc *client.CartClient) *Handler {
	return &Handler{store: s, pclient: pc, cartClient: cc}
}

// PrepareOrder: POST /v1/orders/prepare
// expects authenticated user via X-USER-ID
func (h *Handler) PrepareOrder(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-USER-ID")
	sessionID := r.Header.Get("X-SESSION-ID")

	if userID == "" && sessionID == "" {
		http.Error(w, "authentication required", http.StatusUnauthorized)
		return
	}

	ctx := r.Context()

	var (
		cart map[string]any
		err  error
	)

	// fetch cart correctly
	if sessionID != "" {
		cart, err = h.cartClient.GetCartForSession(ctx, sessionID)
	} else {
		cart, err = h.cartClient.GetCartForUser(ctx, userID)
	}

	if err != nil {
		http.Error(w, "failed to fetch cart: "+err.Error(), http.StatusBadGateway)
		return
	}

	itemsAny, _ := cart["items"].([]any)
	if len(itemsAny) == 0 {
		http.Error(w, "cart empty", http.StatusBadRequest)
		return
	}

	var (
		orderItems []model.OrderItem
		totalCents int64
	)

	for _, v := range itemsAny {
		m, ok := v.(map[string]any)
		if !ok {
			continue
		}

		variant, _ := m["variant"].(map[string]any)
		product, _ := m["product"].(map[string]any)

		qty := int(m["quantity"].(float64))
		variantID, _ := variant["id"].(string)
		productID, _ := product["id"].(string)

		price := int64(variant["price"].(float64) * 100)

		if variantID == "" || productID == "" || qty <= 0 {
			continue
		}

		orderItems = append(orderItems, model.OrderItem{
			ProductID:  productID,
			VariantID:  variantID,
			Quantity:   qty,
			PriceCents: price,
		})

		totalCents += price * int64(qty)
	}

	if len(orderItems) == 0 {
		http.Error(w, "no valid items", http.StatusBadRequest)
		return
	}

	// user is optional
	var uid *string
	if userID != "" {
		uid = &userID
	}

	orderID, err := h.store.CreateDraftOrder(ctx, uid, orderItems, totalCents)
	if err != nil {
		http.Error(w, "db error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	for _, it := range orderItems {
		if err := h.pclient.ReserveStock(ctx, it.VariantID, it.Quantity); err != nil {
			http.Error(w, "stock reservation failed", http.StatusConflict)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"order_id":     orderID,
		"amount_cents": totalCents,
		"currency":     "INR",
	})
}

// ConfirmOrder: POST /v1/orders/confirm
// body: { "order_id": "..." }
// It will mark order paid and deduct stock by calling product-svc deduct API
func (h *Handler) ConfirmOrder(w http.ResponseWriter, r *http.Request) {
	var body struct {
		OrderID string `json:"order_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if body.OrderID == "" {
		http.Error(w, "order_id required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	order, err := h.store.GetOrder(ctx, body.OrderID)
	if err != nil {
		http.Error(w, "order not found", http.StatusNotFound)
		return
	}
	if order.Status != string(model.StatusDraft) && order.Status != string(model.StatusPending) {
		http.Error(w, "order not in confirmable state", http.StatusBadRequest)
		return
	}

	// call DeductStock for each item
	for _, it := range order.Items {
		if err := h.pclient.DeductStock(ctx, it.VariantID, it.Quantity); err != nil {
			http.Error(w, "stock deduction failed: "+err.Error(), http.StatusBadGateway)
			return
		}
	}

	if err := h.store.UpdateOrderStatus(ctx, order.ID, string(model.StatusPaid)); err != nil {
		http.Error(w, "failed to update order status", http.StatusInternalServerError)
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]string{"status": "paid"})
}

// POST /v1/orders/{orderID}/paid
// called ONLY by payments service
func (h *Handler) MarkOrderPaid(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderID")

	if !isValidUUID(orderID) {
		http.Error(w, "invalid order id", http.StatusBadRequest)
		return
	}

	if orderID == "" {
		http.Error(w, "order id required", http.StatusBadRequest)
		return
	}

	adminKey := r.Header.Get("X-INTERNAL-KEY")
	if adminKey != os.Getenv("INTERNAL_SERVICE_KEY") {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	ctx := r.Context()

	order, err := h.store.GetOrder(ctx, orderID)
	if err != nil {
		http.Error(w, "order not found", http.StatusNotFound)
		return
	}

	if order.Status == "paid" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// deduct stock
	for _, it := range order.Items {
		if err := h.pclient.DeductStock(ctx, it.VariantID, it.Quantity); err != nil {
			http.Error(w, "stock deduction failed", http.StatusBadGateway)
			return
		}
	}

	if err := h.store.UpdateOrderStatus(ctx, orderID, "paid"); err != nil {
		http.Error(w, "failed to update order", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) GetOrderInternal(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderID")
	if orderID == "" {
		http.Error(w, "order id required", http.StatusBadRequest)
		return
	}

	if r.Header.Get("X-INTERNAL-KEY") != os.Getenv("INTERNAL_SERVICE_KEY") {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	order, err := h.store.GetOrder(r.Context(), orderID)
	if err != nil {
		http.Error(w, "order not found", http.StatusNotFound)
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]any{
		"order_id":     order.ID,
		"status":       order.Status,
		"amount_cents": order.TotalAmountCents,
		"currency":     order.Currency,
	})
}

func (h *Handler) ReleaseOrder(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderID")

	if !isValidUUID(orderID) {
		http.Error(w, "invalid order id", http.StatusBadRequest)
		return
	}

	if r.Header.Get("X-INTERNAL-KEY") != os.Getenv("INTERNAL_SERVICE_KEY") {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.store.ReleaseOrder(r.Context(), orderID); err != nil {
		// idempotent: already released / already paid
		w.WriteHeader(http.StatusOK)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) RefundOrder(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderID")

	// Internal auth
	if r.Header.Get("X-INTERNAL-KEY") != os.Getenv("INTERNAL_SERVICE_KEY") {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Business logic
	if err := h.store.RefundOrder(r.Context(), orderID); err != nil {
		// Idempotent: already refunded / not refundable
		w.WriteHeader(http.StatusOK)
		return
	}

	w.WriteHeader(http.StatusOK)
}
