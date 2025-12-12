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
	return &Handler{store: s, pclient: pc}
}

// AddItem expects { "product_id": "...", "variant_id":"...", "quantity": 1 }
func (h *Handler) AddItem(w http.ResponseWriter, r *http.Request) {
	var item model.CartItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if item.Quantity <= 0 {
		http.Error(w, "quantity must be > 0", http.StatusBadRequest)
		return
	}
	ctx := r.Context()
	key := resolveKey(ctx)
	if key == "" {
		http.Error(w, "no user/session", http.StatusBadRequest)
		return
	}

	// validate product + variant + stock via product service
	prod, err := h.pclient.GetProductDetail(ctx, item.ProductID)
	if err != nil {
		http.Error(w, "product validation failed: "+err.Error(), http.StatusBadGateway)
		return
	}
	variant, ok := client.VariantFromProduct(prod, item.VariantID)
	if !ok {
		http.Error(w, "variant not found", http.StatusBadRequest)
		return
	}
	// check stock if present
	if stockRaw, ok := variant["stock"]; ok {
		// json numbers may be float64
		switch v := stockRaw.(type) {
		case float64:
			if int(v) < item.Quantity {
				http.Error(w, "insufficient stock", http.StatusConflict)
				return
			}
		case int:
			if v < item.Quantity {
				http.Error(w, "insufficient stock", http.StatusConflict)
				return
			}
		}
	}

	if err := h.store.SetItem(ctx, key, item.VariantID, item); err != nil {
		http.Error(w, "redis error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(201)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (h *Handler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	var item model.CartItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if item.Quantity < 0 {
		http.Error(w, "quantity must be >= 0", http.StatusBadRequest)
		return
	}
	ctx := r.Context()
	key := resolveKey(ctx)
	if key == "" {
		http.Error(w, "no user/session", http.StatusBadRequest)
		return
	}

	if item.Quantity == 0 {
		if err := h.store.DeleteItem(ctx, key, item.VariantID); err != nil {
			http.Error(w, "redis error", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
		return
	}

	// Validate variant exists (optional but good)
	prod, err := h.pclient.GetProductDetail(ctx, item.ProductID)
	if err != nil {
		http.Error(w, "product validation failed", http.StatusBadGateway)
		return
	}
	_, ok := client.VariantFromProduct(prod, item.VariantID)
	if !ok {
		http.Error(w, "variant not found", http.StatusBadRequest)
		return
	}

	if err := h.store.SetItem(ctx, key, item.VariantID, item); err != nil {
		http.Error(w, "redis error", http.StatusInternalServerError)
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}

func (h *Handler) RemoveItem(w http.ResponseWriter, r *http.Request) {
	var body struct {
		VariantID string `json:"variant_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	ctx := r.Context()
	key := resolveKey(ctx)
	if key == "" {
		http.Error(w, "no user/session", http.StatusBadRequest)
		return
	}

	if err := h.store.DeleteItem(ctx, key, body.VariantID); err != nil {
		http.Error(w, "redis error", http.StatusInternalServerError)
		return
	}
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
	// hydrate
	var resp model.CartResponse
	var total int64
	for _, it := range items {
		prod, err := h.pclient.GetProductDetail(ctx, it.ProductID)
		if err != nil {
			// if product not found, skip
			continue
		}
		variant, ok := client.VariantFromProduct(prod, it.VariantID)
		if !ok {
			continue
		}
		// price read from variant.price (float)
		var priceInt int64 = 0
		if p, ok := variant["price"]; ok {
			switch v := p.(type) {
			case float64:
				// convert to paisa: assume price is rupees float
				priceInt = int64(v * 100)
			case int:
				priceInt = int64(v * 100)
			case json.Number:
				if f, err := v.Float64(); err == nil {
					priceInt = int64(f * 100)
				}
			}
		}
		line := model.HydratedItem{
			Product:   prod["product"],
			Variant:   variant,
			Quantity:  it.Quantity,
			LineTotal: priceInt * int64(it.Quantity),
		}
		total += line.LineTotal
		resp.Items = append(resp.Items, line)
	}
	resp.CartTotal = total
	_ = json.NewEncoder(w).Encode(resp)
}

func (h *Handler) MergeCarts(w http.ResponseWriter, r *http.Request) {
	var body struct {
		GuestID string `json:"guest_id"`
		UserID  string `json:"user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if body.GuestID == "" || body.UserID == "" {
		http.Error(w, "missing ids", http.StatusBadRequest)
		return
	}
	src := "cart:guest:" + body.GuestID
	dest := "cart:user:" + body.UserID
	if err := h.store.Merge(r.Context(), dest, src); err != nil {
		http.Error(w, "merge failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "merged"})
}

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
