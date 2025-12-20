package api

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"

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

func NewHandler(
	s *store.PGStore,
	pc *client.ProductClient,
	cc *client.CartClient,
) *Handler {
	return &Handler{
		store:      s,
		pclient:    pc,
		cartClient: cc,
	}
}

func isValidUUID(id string) bool {
	_, err := uuid.Parse(id)
	return err == nil
}

// PrepareOrder reserves stock and creates a pending order from the user's cart
func (h *Handler) PrepareOrder(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID := r.Header.Get("X-USER-ID")
	sessionID := r.Header.Get("X-SESSION-ID")
	log.Printf("PrepareOrder headers: user=%s session=%s", userID, sessionID)

	if userID == "" && sessionID == "" {
		http.Error(w, "authentication required", http.StatusUnauthorized)
		return
	}

	var (
		cart *client.CartResponse
		err  error
	)

	// 1. Logic: Try User Cart First
	if userID != "" {
		cart, err = h.cartClient.GetCartForUser(ctx, userID)
		// 2. Logic: If User Cart is empty, TRY SESSION CART
		if err != nil || cart == nil || len(cart.Items) == 0 {
			if sessionID != "" {
				log.Println("User cart empty, falling back to Session Cart:", sessionID)
				sessionCart, sErr := h.cartClient.GetCartForSession(ctx, sessionID)
				if sErr == nil && sessionCart != nil && len(sessionCart.Items) > 0 {
					cart = sessionCart
					err = nil
				}
			}
		}
	} else {
		// 3. Logic: No User ID, just check Session
		cart, err = h.cartClient.GetCartForSession(ctx, sessionID)
	}

	if err != nil {
		http.Error(w, "failed to fetch cart: "+err.Error(), http.StatusBadGateway)
		return
	}

	if cart == nil || len(cart.Items) == 0 {
		http.Error(w, "cart is empty", http.StatusBadRequest)
		return
	}

	var (
		orderItems []model.OrderItem
		totalCents int64
	)

	for _, it := range cart.Items {
		if it.Quantity <= 0 {
			continue
		}
		orderItems = append(orderItems, model.OrderItem{
			ProductID:  it.Product.ID,
			Quantity:   it.Quantity,
			PriceCents: it.UnitPrice,
		})
		totalCents += it.UnitPrice * int64(it.Quantity)
	}

	if totalCents <= 0 {
		http.Error(w, "invalid order total", http.StatusBadRequest)
		return
	}

	var uid *string
	if userID != "" {
		uid = &userID
	}

	orderID, err := h.store.CreateDraftOrder(ctx, uid, orderItems, totalCents)
	if err != nil {
		http.Error(w, "db error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 3. Reserve Stock
	for _, it := range orderItems {
		if err := h.pclient.ReserveStock(ctx, it.ProductID, it.Quantity); err != nil {
			http.Error(w, "stock reservation failed", http.StatusConflict)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"order_id":     orderID,
		"amount_cents": totalCents,
		"currency":     "INR",
	})
}

// GetOrder is the MAIN handler used by Payments Service
func (h *Handler) GetOrder(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "id") // Standardized to "id"

	if !isValidUUID(orderID) {
		http.Error(w, "invalid order id", http.StatusBadRequest)
		return
	}

	order, err := h.store.GetOrder(r.Context(), orderID)
	if err != nil {
		http.Error(w, "order not found", http.StatusNotFound)
		return
	}

	// SECURITY CHECK
	userID := r.Header.Get("X-USER-ID")
	internalKey := r.Header.Get("X-INTERNAL-KEY")
	expectedKey := os.Getenv("INTERNAL_SERVICE_KEY")

	// ✅ FIXED: Safe pointer dereference comparison
	isOwner := userID != "" && order.UserID != nil && *order.UserID == userID
	
	isInternal := expectedKey != "" && internalKey == expectedKey

	// Reject if neither owner nor internal service
	if !isOwner && !isInternal {
		http.Error(w, "order not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"id":           order.ID,
		"user_id":      order.UserID,
		"status":       order.Status,
		"amount_cents": order.Subtotal, // Vital for Payments Service
		"subtotal":     order.Subtotal,
		"currency":     order.Currency,
		"items":        order.Items,
		"created_at":   order.CreatedAt,
	})
}

// MarkOrderPaid is called by Payments Service
func (h *Handler) MarkOrderPaid(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "id") 

	if !isValidUUID(orderID) {
		http.Error(w, "invalid order id", http.StatusBadRequest)
		return
	}

	// Security: Only internal services can call this
	if r.Header.Get("X-INTERNAL-KEY") != os.Getenv("INTERNAL_SERVICE_KEY") {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	ctx := r.Context()
	order, err := h.store.GetOrder(ctx, orderID)
	if err != nil {
		http.Error(w, "order not found", http.StatusNotFound)
		return
	}

	if order.Status == string(model.StatusPaid) {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Deduct stock permanently
	for _, it := range order.Items {
		if err := h.pclient.DeductStock(ctx, it.ProductID, it.Quantity); err != nil {
			http.Error(w, "stock deduction failed", http.StatusBadGateway)
			return
		}
	}

	if err := h.store.UpdateOrderStatus(ctx, orderID, string(model.StatusPaid)); err != nil {
		http.Error(w, "failed to update order", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// ReleaseOrder releases stock (Internal Only)
func (h *Handler) ReleaseOrder(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "id")

	if !isValidUUID(orderID) {
		http.Error(w, "invalid order id", http.StatusBadRequest)
		return
	}

	if r.Header.Get("X-INTERNAL-KEY") != os.Getenv("INTERNAL_SERVICE_KEY") {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	ctx := r.Context()
	order, err := h.store.GetOrder(ctx, orderID)
	if err != nil {
		w.WriteHeader(http.StatusOK)
		return
	}

	if order.Status == string(model.StatusPaid) {
		w.WriteHeader(http.StatusOK)
		return
	}

	for _, it := range order.Items {
		_ = h.pclient.ReleaseStock(ctx, it.ProductID, it.Quantity)
	}

	_ = h.store.UpdateOrderStatus(ctx, orderID, "cancelled")
	w.WriteHeader(http.StatusOK)
}

// RefundOrder (Internal Only)
func (h *Handler) RefundOrder(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "id")

	if !isValidUUID(orderID) {
		http.Error(w, "invalid order id", http.StatusBadRequest)
		return
	}

	if r.Header.Get("X-INTERNAL-KEY") != os.Getenv("INTERNAL_SERVICE_KEY") {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	_ = h.store.UpdateOrderStatus(r.Context(), orderID, "refunded")
	// Logic to release stock could be added here if needed
	w.WriteHeader(http.StatusOK)
}

// ConfirmOrder legacy alias
func (h *Handler) ConfirmOrder(w http.ResponseWriter, r *http.Request) {
	var body struct {
		OrderID string `json:"order_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	// We can reuse the logic via a direct call or duplicate it. 
	// Simplest is to delegate, but requires changing signature or request context.
	// For now, implementing basic Confirm logic directly:
	
	if !isValidUUID(body.OrderID) {
		http.Error(w, "invalid order id", http.StatusBadRequest)
		return
	}
	
	// Delegate to MarkOrderPaid via internal call simulation or code duplication
	// Duplicating for safety and independence:
	ctx := r.Context()
	order, err := h.store.GetOrder(ctx, body.OrderID)
	if err != nil {
		http.Error(w, "order not found", http.StatusNotFound)
		return
	}
	
	if order.Status != string(model.StatusDraft) && order.Status != string(model.StatusPending) {
		http.Error(w, "order not confirmable", http.StatusBadRequest)
		return
	}

	for _, it := range order.Items {
		if err := h.pclient.DeductStock(ctx, it.ProductID, it.Quantity); err != nil {
			http.Error(w, "stock deduction failed", http.StatusBadGateway)
			return
		}
	}

	if err := h.store.UpdateOrderStatus(ctx, order.ID, string(model.StatusPaid)); err != nil {
		http.Error(w, "failed to update order", http.StatusInternalServerError)
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]string{"status": "paid"})
}

func (h *Handler) CreateOrderFromCart(w http.ResponseWriter, r *http.Request) {
	h.PrepareOrder(w, r)
}

// Aliases for GetOrder
func (h *Handler) GetOrderInternal(w http.ResponseWriter, r *http.Request) {
	h.GetOrder(w, r)
}
func (h *Handler) GetOrderPublic(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "id")

	if !isValidUUID(orderID) {
		http.Error(w, "invalid order id", http.StatusBadRequest)
		return
	}

	order, err := h.store.GetOrder(r.Context(), orderID)
	if err != nil {
		// Return 404 if not found (or if DB error)
		http.Error(w, "order not found", http.StatusNotFound)
		return
	}

	// We return a limited view safe for public display (no internal fields)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"id":           order.ID,
		"status":       order.Status,
		"amount_cents": order.Subtotal,
		"currency":     order.Currency,
		"items":        order.Items,
		"created_at":   order.CreatedAt,
	})
}

func (h *Handler) AdminListOrders(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	status := q.Get("status")
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 { page = 1 }
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 || limit > 100 { limit = 15 }

	orders, total, err := h.store.ListOrders(r.Context(), page, limit, status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"items": orders,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *Handler) GetMyOrders(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-USER-ID")
	if userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	orders, _ := h.store.GetOrdersByUserID(r.Context(), userID)
	if orders == nil { orders = []model.Order{} }
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}


