package api

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/devmanishoffl/sabhyatam-cart/internal/client"
	"github.com/devmanishoffl/sabhyatam-cart/internal/model"
	"github.com/devmanishoffl/sabhyatam-cart/internal/store"
)

type Handler struct {
	store   *store.RedisStore
	pclient *client.ProductClient
}

func NewHandler(s *store.RedisStore, pc *client.ProductClient) *Handler {
	return &Handler{
		store:   s,
		pclient: pc,
	}
}

// AddItem expects:
// { "product_id": "...", "variant_id":"...", "quantity": 1 }
func (h *Handler) AddItem(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	key := resolveKey(ctx)
	if key == "" {
		http.Error(w, "no user/session", http.StatusBadRequest)
		return
	}

	var req struct {
		ProductID string `json:"product_id"`
		VariantID string `json:"variant_id"`
		Quantity  int    `json:"quantity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	if req.Quantity <= 0 {
		http.Error(w, "quantity must be > 0", http.StatusBadRequest)
		return
	}

	// fetch existing item (merge quantity)
	existing, _ := h.store.GetItem(ctx, key, req.VariantID)
	newQty := req.Quantity
	if existing != nil {
		newQty += existing.Quantity
	}

	// validate product + variant
	prod, err := h.pclient.GetProductDetail(ctx, req.ProductID)
	if err != nil {
		http.Error(w, "product validation failed", http.StatusBadGateway)
		return
	}

	variant, ok := client.VariantFromProduct(prod, req.VariantID)
	if !ok {
		http.Error(w, "variant not found", http.StatusBadRequest)
		return
	}

	// stock check (best effort)
	if stockRaw, ok := variant["stock"]; ok {
		if stock := asInt(stockRaw); stock >= 0 && stock < newQty {
			http.Error(w, "insufficient stock", http.StatusConflict)
			return
		}
	}

	// snapshot price
	price := int64(0)
	if p, ok := variant["price"]; ok {
		price = asMoney(p)
	}

	item := model.CartItem{
		ProductID: req.ProductID,
		VariantID: req.VariantID,
		Quantity:  newQty,
		UnitPrice: price,
		Currency:  "INR",
	}

	if err := h.store.SetItem(ctx, key, req.VariantID, item); err != nil {
		http.Error(w, "redis error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(item)
}

func (h *Handler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	key := resolveKey(ctx)
	if key == "" {
		http.Error(w, "no user/session", http.StatusBadRequest)
		return
	}

	var req struct {
		ProductID string `json:"product_id"`
		VariantID string `json:"variant_id"`
		Quantity  int    `json:"quantity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	if req.Quantity < 0 {
		http.Error(w, "quantity must be >= 0", http.StatusBadRequest)
		return
	}

	if req.Quantity == 0 {
		_ = h.store.DeleteItem(ctx, key, req.VariantID)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
		return
	}

	existing, err := h.store.GetItem(ctx, key, req.VariantID)
	if err != nil || existing == nil {
		http.Error(w, "item not found", http.StatusNotFound)
		return
	}

	existing.Quantity = req.Quantity

	if err := h.store.SetItem(ctx, key, req.VariantID, *existing); err != nil {
		http.Error(w, "redis error", http.StatusInternalServerError)
		return
	}

	_ = json.NewEncoder(w).Encode(existing)
}

func (h *Handler) RemoveItem(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	key := resolveKey(ctx)
	if key == "" {
		http.Error(w, "no user/session", http.StatusBadRequest)
		return
	}

	var req struct {
		VariantID string `json:"variant_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	_ = h.store.DeleteItem(ctx, key, req.VariantID)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

func (h *Handler) GetCart(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	key := resolveKey(ctx)
	if key == "" {
		http.Error(w, "no user/session", http.StatusBadRequest)
		return
	}

	items, err := h.store.GetAll(ctx, key)
	if err != nil {
		http.Error(w, "redis error", http.StatusInternalServerError)
		return
	}

	var resp model.CartResponse
	var subtotal int64
	var count int

	for _, it := range items {
		lineTotal := it.UnitPrice * int64(it.Quantity)
		subtotal += lineTotal
		count += it.Quantity

		resp.Items = append(resp.Items, model.HydratedItem{
			ProductID: it.ProductID,
			VariantID: it.VariantID,
			Quantity:  it.Quantity,
			UnitPrice: it.UnitPrice,
			LineTotal: lineTotal,
		})
	}

	resp.Subtotal = subtotal
	resp.ItemCount = count
	resp.Currency = "INR"

	_ = json.NewEncoder(w).Encode(resp)
}

func (h *Handler) MergeCarts(w http.ResponseWriter, r *http.Request) {
	var req struct {
		GuestID string `json:"guest_id"`
		UserID  string `json:"user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	src := "cart:guest:" + req.GuestID
	dst := "cart:user:" + req.UserID

	if err := h.store.Merge(r.Context(), dst, src); err != nil {
		http.Error(w, "merge failed", http.StatusInternalServerError)
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]string{"status": "merged"})
}

// ---------- helpers ----------

func resolveKey(ctx context.Context) string {
	if v := ctx.Value(CtxUserID); v != nil {
		if s, ok := v.(string); ok && s != "" {
			return "cart:user:" + s
		}
	}
	if v := ctx.Value(CtxSessionID); v != nil {
		if s, ok := v.(string); ok && s != "" {
			return "cart:guest:" + s
		}
	}
	return ""
}

func asInt(v any) int {
	switch x := v.(type) {
	case int:
		return x
	case float64:
		return int(x)
	case json.Number:
		i, _ := x.Int64()
		return int(i)
	default:
		return -1
	}
}

func asMoney(v any) int64 {
	switch x := v.(type) {
	case float64:
		return int64(x * 100)
	case int:
		return int64(x * 100)
	case json.Number:
		f, _ := x.Float64()
		return int64(f * 100)
	default:
		return 0
	}
}
