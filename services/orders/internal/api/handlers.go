package api

import (
	"encoding/json"
	"net/http"

	"github.com/devmanishoffl/sabhyatam-orders/internal/client"
	"github.com/devmanishoffl/sabhyatam-orders/internal/model"
	"github.com/devmanishoffl/sabhyatam-orders/internal/store"
)

type Handler struct {
	store      *store.PGStore
	pclient    *client.ProductClient
	cartClient *client.CartClient
}

func NewHandler(s *store.PGStore, pc *client.ProductClient, cc *client.CartClient) *Handler {
	return &Handler{store: s, pclient: pc, cartClient: cc}
}

// PrepareOrder: POST /v1/orders/prepare
// expects authenticated user via X-USER-ID
func (h *Handler) PrepareOrder(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-USER-ID")
	if userID == "" {
		http.Error(w, "authentication required", http.StatusUnauthorized)
		return
	}

	ctx := r.Context()
	cart, err := h.cartClient.GetCartForUser(ctx, userID)
	if err != nil {
		http.Error(w, "failed to fetch cart: "+err.Error(), http.StatusBadGateway)
		return
	}

	// cart format: { items: [ { product: {...}, variant: {...}, quantity, line_total }, cart_total }]
	itemsAny, _ := cart["items"].([]any)
	if len(itemsAny) == 0 {
		http.Error(w, "cart empty", http.StatusBadRequest)
		return
	}

	var orderItems []model.OrderItem
	var totalCents int64 = 0
	for _, v := range itemsAny {
		m, ok := v.(map[string]any)
		if !ok {
			continue
		}
		// variant must be present
		variant, _ := m["variant"].(map[string]any)
		product, _ := m["product"].(map[string]any)
		qty := 0
		if q, ok := m["quantity"].(float64); ok {
			qty = int(q)
		}
		// extract ids and price
		variantID := ""
		productID := ""
		if id, ok := variant["id"].(string); ok {
			variantID = id
		}
		if pid, ok := product["id"].(string); ok {
			productID = pid
		}

		// price in variant.price (float)
		var priceCents int64 = 0
		if p, ok := variant["price"]; ok {
			switch t := p.(type) {
			case float64:
				priceCents = int64(t * 100)
			case int:
				priceCents = int64(t * 100)
			}
		}

		if variantID == "" || productID == "" || qty <= 0 {
			continue
		}

		oi := model.OrderItem{
			ProductID:  productID,
			VariantID:  variantID,
			Quantity:   qty,
			PriceCents: priceCents,
		}
		orderItems = append(orderItems, oi)
		totalCents += priceCents * int64(qty)
	}

	if len(orderItems) == 0 {
		http.Error(w, "no valid items", http.StatusBadRequest)
		return
	}

	// create draft order in DB
	orderID, err := h.store.CreateDraftOrder(ctx, &userID, orderItems, totalCents)
	if err != nil {
		http.Error(w, "db error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
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
