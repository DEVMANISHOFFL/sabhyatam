package api

import (
	"context"
	"encoding/json"
	"log"
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

// AddItem expects: { "product_id": "...", "quantity": 1 }
func (h *Handler) AddItem(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	key := resolveKey(ctx)
	if key == "" {
		http.Error(w, "no user/session", http.StatusBadRequest)
		return
	}

	var req struct {
		ProductID string `json:"product_id"`
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
	existing, _ := h.store.GetItem(ctx, key, req.ProductID)
	newQty := req.Quantity
	if existing != nil {
		newQty += existing.Quantity
	}

	// validate product
	prodResp, err := h.pclient.GetProductDetail(ctx, req.ProductID)
	if err != nil {
		http.Error(w, "product validation failed", http.StatusBadGateway)
		return
	}

	// Extract product object
	product, ok := prodResp["product"].(map[string]any)
	if !ok {
		// Fallback: If product service returns raw product (no wrapper)
		product = prodResp
	}

	// stock check
	if stockRaw, ok := product["stock"]; ok {
		if stock := asInt(stockRaw); stock >= 0 && stock < newQty {
			http.Error(w, "insufficient stock", http.StatusConflict)
			return
		}
	}

	// snapshot price (Product service returns Integer Rupee, Cart needs Integer Paise for logic)
	price := int64(0)
	if p, ok := product["price"]; ok {
		price = asMoney(p)
	}

	item := model.CartItem{
		ProductID: req.ProductID,
		Quantity:  newQty,
		UnitPrice: price,
		Currency:  "INR",
	}

	if err := h.store.SetItem(ctx, key, req.ProductID, item); err != nil {
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
		_ = h.store.DeleteItem(ctx, key, req.ProductID)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
		return
	}

	existing, err := h.store.GetItem(ctx, key, req.ProductID)
	if err != nil || existing == nil {
		http.Error(w, "item not found", http.StatusNotFound)
		return
	}

	existing.Quantity = req.Quantity

	if err := h.store.SetItem(ctx, key, req.ProductID, *existing); err != nil {
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
		ProductID string `json:"product_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	_ = h.store.DeleteItem(ctx, key, req.ProductID)
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

	resp := model.CartResponse{
		Currency: "INR",
	}

	for _, it := range items {
		prodResp, err := h.pclient.GetProductDetail(ctx, it.ProductID)
		if err != nil {
			continue
		}

		productRaw, ok := prodResp["product"].(map[string]any)
		if !ok {
			// Fallback: If product service returns raw product
			productRaw = prodResp
		}

		// unpublished product → auto remove
		if pub, ok := productRaw["published"].(bool); ok && !pub {
			_ = h.store.DeleteItem(ctx, key, it.ProductID)
			continue
		}

		// 2. Normalize price (ALWAYS paise)
		var unitPrice int64
		if v, ok := productRaw["price"]; ok {
			unitPrice = asMoney(v)
		}

		// 3. Enforce stock limits
		if s, ok := productRaw["stock"]; ok {
			maxQty := asInt(s)
			if it.Quantity > maxQty {
				it.Quantity = maxQty
				if it.Quantity <= 0 {
					_ = h.store.DeleteItem(ctx, key, it.ProductID)
					continue
				}
				_ = h.store.SetItem(ctx, key, it.ProductID, it)
			}
		}

		lineTotal := unitPrice * int64(it.Quantity)

		// 4. Extract hero image
		// FIX: Check INSIDE productRaw["media"] first, then siblings
		image := ""

		// Helper to find image in a list
		findImage := func(list []any) string {
			if len(list) > 0 {
				if m, ok := list[0].(map[string]any); ok {
					if u, ok := m["url"].(string); ok {
						return u
					}
				}
			}
			return ""
		}

		// Check nested media (Standard)
		if media, ok := productRaw["media"].([]any); ok {
			image = findImage(media)
		}

		// If not found, check root media (Legacy/Wrapper)
		if image == "" {
			if media, ok := prodResp["media"].([]any); ok {
				image = findImage(media)
			}
		}

		resp.Items = append(resp.Items, model.HydratedItem{
			Product: map[string]any{
				"id":    productRaw["id"],
				"title": productRaw["title"],
				"slug":  productRaw["slug"],
				"image": image,
			},
			Quantity:  it.Quantity,
			UnitPrice: unitPrice,
			LineTotal: lineTotal,
		})

		resp.Subtotal += lineTotal
		resp.ItemCount += it.Quantity
	}
	log.Println("CART SESSION:", ctx.Value(CtxSessionID))

	w.Header().Set("Content-Type", "application/json")
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
	if sid := ctx.Value(CtxSessionID); sid != nil && sid.(string) != "" {
		return "session:" + sid.(string)
	}
	if uid := ctx.Value(CtxUserID); uid != nil && uid.(string) != "" {
		return "user:" + uid.(string)
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

func (h *Handler) ClearCart(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	key := resolveKey(ctx)
	if key == "" {
		http.Error(w, "no user/session", http.StatusBadRequest)
		return
	}

	if err := h.store.DeleteAll(ctx, key); err != nil {
		http.Error(w, "failed to clear cart", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "cleared",
	})
}
