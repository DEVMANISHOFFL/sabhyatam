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

// ✅ FIXED: Smart Cart Lookup (User -> Fallback to Session)
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
		userCartEmpty := (err != nil) || (cart == nil) || (len(cart.Items) == 0)

		// 2. Logic: If User Cart is empty or failed, TRY SESSION CART
		// This fixes the "Guest -> Login" flow where items are still in the session
		if userCartEmpty {
			if sessionID != "" {
				log.Println("User cart empty, falling back to Session Cart:", sessionID)
				sessionCart, sErr := h.cartClient.GetCartForSession(ctx, sessionID)
				// Only switch if session cart actually has items
				if sErr == nil && sessionCart != nil && len(sessionCart.Items) > 0 {
					cart = sessionCart
					err = nil // Clear error because we found a valid cart
				}
			}
		}
	} else {
		// 3. Logic: No User ID, just check Session
		cart, err = h.cartClient.GetCartForSession(ctx, sessionID)
	}

	log.Printf("Final Cart used: %+v", cart)

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
		// log.Printf("Cart item: %+v", it)

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

	if len(orderItems) == 0 {
		http.Error(w, "no valid items in cart", http.StatusBadRequest)
		return
	}

	var uid *string
	if userID != "" {
		uid = &userID
	}

	orderID, err := h.store.CreateDraftOrder(
		ctx,
		uid,
		orderItems,
		totalCents,
	)
	if err != nil {
		http.Error(w, "db error: "+err.Error(), http.StatusInternalServerError)
		return
	}

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

func (h *Handler) ConfirmOrder(w http.ResponseWriter, r *http.Request) {
	var body struct {
		OrderID string `json:"order_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	if !isValidUUID(body.OrderID) {
		http.Error(w, "invalid order id", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	order, err := h.store.GetOrder(ctx, body.OrderID)
	if err != nil {
		http.Error(w, "order not found", http.StatusNotFound)
		return
	}

	if order.Status != string(model.StatusDraft) &&
		order.Status != string(model.StatusPending) {
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

func (h *Handler) RefundOrder(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderID")

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

	if order.Status != string(model.StatusPaid) {
		w.WriteHeader(http.StatusOK)
		return
	}

	for _, it := range order.Items {
		_ = h.pclient.ReleaseStock(ctx, it.ProductID, it.Quantity)
	}

	_ = h.store.UpdateOrderStatus(ctx, orderID, "refunded")
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) CreateOrderFromCart(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID := r.Header.Get("X-USER-ID")
	sessionID := r.Header.Get("X-SESSION-ID")

	if userID == "" && sessionID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var (
		cart *client.CartResponse
		err  error
	)

	if userID != "" {
		cart, err = h.cartClient.GetCartForUser(ctx, userID)
	} else {
		cart, err = h.cartClient.GetCartForSession(ctx, sessionID)
	}

	if err != nil || len(cart.Items) == 0 {
		http.Error(w, "cart empty", http.StatusBadRequest)
		return
	}

	var (
		items []model.OrderItem
		total int64
	)

	for _, it := range cart.Items {
		items = append(items, model.OrderItem{
			ProductID:  it.Product.ID,
			Quantity:   it.Quantity,
			PriceCents: it.UnitPrice,
		})
		total += it.UnitPrice * int64(it.Quantity)
	}

	orderID, err := h.store.CreateDraftOrder(ctx, nil, items, total)
	if err != nil {
		http.Error(w, "order create failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"order_id": orderID,
	})
}

func (h *Handler) MarkOrderPaid(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderID")

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
		http.Error(w, "order not found", http.StatusNotFound)
		return
	}

	if order.Status == string(model.StatusPaid) {
		w.WriteHeader(http.StatusOK)
		return
	}

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

func (h *Handler) GetOrderInternal(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderID")

	if !isValidUUID(orderID) {
		http.Error(w, "invalid order id", http.StatusBadRequest)
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

	_ = json.NewEncoder(w).Encode(order)
}

func (h *Handler) GetOrderPublic(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderID")

	if !isValidUUID(orderID) {
		http.Error(w, "invalid order id", http.StatusBadRequest)
		return
	}

	order, err := h.store.GetOrder(r.Context(), orderID)
	if err != nil {
		http.Error(w, "order not found", http.StatusNotFound)
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]any{
		"id":        order.ID,
		"status":    order.Status,
		"subtotal":  order.Subtotal,
		"currency":  order.Currency,
		"items":     order.Items,
		"createdAt": order.CreatedAt,
	})
}

func (h *Handler) AdminListOrders(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	status := r.URL.Query().Get("status") // Read ?status=paid

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 15
	}

	orders, total, err := h.store.ListOrders(r.Context(), page, limit, status)
	if err != nil {
		http.Error(w, "failed to fetch orders: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return response matching your frontend's expected format (items + total)
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

	orders, err := h.store.GetOrdersByUserID(r.Context(), userID)
	if err != nil {
		log.Printf("Failed to fetch user orders: %v", err)
		http.Error(w, "failed to fetch orders", http.StatusInternalServerError)
		return
	}

	if orders == nil {
		orders = []model.Order{}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(orders); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
}
