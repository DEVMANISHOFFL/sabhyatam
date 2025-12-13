package api

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/devmanishoffl/sabhyatam-product/internal/model"
	"github.com/devmanishoffl/sabhyatam-product/internal/store"
	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r *chi.Mux, s *store.Store) {
	r.Route("/v1", func(r chi.Router) {
		r.Get("/products", listProductsHandler(s))
		r.Get("/products/{id}", getProductDetailHandler(s))

		r.Route("/admin", func(r chi.Router) {
			r.Use(AdminOnly)

			r.Post("/products", createProductHandler(s))
			r.Put("/products/{id}", updateProductHandler(s))
			r.Delete("/products/{id}", deleteProductHandler(s))

			r.Route("/variants", func(r chi.Router) {
				r.Post("/{id}/reserve", reserveStockHandler(s))
				r.Post("/{id}/release", releaseStockHandler(s))
				r.Post("/{id}/deduct", deductStockHandler(s))
			})

			r.Post("/products/{id}/variants", createVariantHandler(s))
			r.Put("/variants/{variant_id}", updateVariantHandler(s))
			r.Delete("/variants/{variant_id}", deleteVariantHandler(s))

			r.Post("/products/{id}/media", createMediaHandler(s))
			r.Delete("/media/{media_id}", deleteMediaHandler(s))
		})

	})

}

func listProductsHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()

		filters := map[string]string{
			"category":    q.Get("category"),
			"subcategory": q.Get("subcategory"),
			"fabric":      q.Get("fabric"),
			"weave":       q.Get("weave"),
			"color":       q.Get("color"),
			"origin":      q.Get("origin"),
			"q":           q.Get("q"),
		}

		sortParam := q.Get("sort")
		page := 1
		size := 20
		if v := q.Get("page"); v != "" {
			page, _ = strconv.Atoi(v)
		}
		if v := q.Get("size"); v != "" {
			size, _ = strconv.Atoi(v)
		}

		offset := (page - 1) * size
		items, err := s.ListProductsFiltered(r.Context(), filters, sortParam, size, offset)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		resp := map[string]interface{}{
			"page":  page,
			"size":  size,
			"items": items,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}
}

func getProductHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		p, err := s.GetProductByID(context.Background(), id)
		if err != nil {
			http.Error(w, err.Error(), 404)
			return
		}
		variants, _ := s.GetVariantsByProductID(context.Background(), id)
		out := map[string]interface{}{"product": p, "variants": variants}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(out)
	}
}

func getProductDetailHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")

		product, err := s.GetProductByID(r.Context(), id)
		if err != nil {
			http.Error(w, "not found", 404)
			return
		}

		variants, err := s.GetVariantsByProductID(r.Context(), product.ID)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		media, err := s.GetMediaByProductID(r.Context(), product.ID)
		if err != nil {
			media = []model.Media{}
		}
		similar, err := s.GetSimilarProducts(r.Context(), product, 6)
		if err != nil {
			similar = []model.Product{}
		}

		resp := map[string]any{
			"product":  product,
			"variants": variants,
			"media":    media,
			"similar":  similar,
			"seo": map[string]any{
				"title":       product.Title + " | Sabhyatam",
				"description": product.ShortDesc,
				"canonical":   "https://sabhyatam.com/products/" + product.Slug,
			},
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}
}

func createProductHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req model.Product
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}

		id, err := s.CreateProduct(r.Context(), &req)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		w.WriteHeader(201)
		_ = json.NewEncoder(w).Encode(map[string]string{"id": id})
	}
}

func updateProductHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")

		var req model.Product
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}

		err := s.UpdateProduct(r.Context(), id, &req)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		w.WriteHeader(200)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
	}
}

func deleteProductHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")

		err := s.DeleteProduct(r.Context(), id)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		w.WriteHeader(200)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
	}
}

func createVariantHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		productID := chi.URLParam(r, "id")

		var req model.Variant
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}

		id, err := s.CreateVariant(r.Context(), productID, &req)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		w.WriteHeader(201)
		_ = json.NewEncoder(w).Encode(map[string]string{"id": id})
	}
}

func updateVariantHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "variant_id")

		var req model.Variant
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}

		err := s.UpdateVariant(r.Context(), id, &req)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		w.WriteHeader(200)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
	}
}

func deleteVariantHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "variant_id")

		err := s.DeleteVariant(r.Context(), id)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		_ = json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
	}
}

func createMediaHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		productID := chi.URLParam(r, "id")

		var req model.Media
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}

		id, err := s.CreateMedia(r.Context(), productID, &req)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		w.WriteHeader(201)
		_ = json.NewEncoder(w).Encode(map[string]string{"id": id})
	}
}

func deleteMediaHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "media_id")

		err := s.DeleteMedia(r.Context(), id)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		_ = json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
	}
}

// ReserveStock: POST /v1/admin/variants/{id}/reserve
func reserveStockHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var body struct {
			Quantity int `json:"quantity"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "invalid body", http.StatusBadRequest)
			return
		}
		if body.Quantity <= 0 {
			http.Error(w, "quantity must be > 0", http.StatusBadRequest)
			return
		}
		if err := s.ReserveVariantStock(r.Context(), id, body.Quantity); err != nil {
			// 409 for insufficient stock or other domain error
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "reserved"})
	}
}

// ReleaseStock: POST /v1/admin/variants/{id}/release
func releaseStockHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var body struct {
			Quantity int `json:"quantity"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "invalid body", http.StatusBadRequest)
			return
		}
		if body.Quantity <= 0 {
			http.Error(w, "quantity must be > 0", http.StatusBadRequest)
			return
		}
		if err := s.ReleaseVariantStock(r.Context(), id, body.Quantity); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "released"})
	}
}

// DeductStock: POST /v1/admin/variants/{id}/deduct
func deductStockHandler(s *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		var body struct {
			Quantity int `json:"quantity"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "invalid body", http.StatusBadRequest)
			return
		}
		if body.Quantity <= 0 {
			http.Error(w, "quantity must be > 0", http.StatusBadRequest)
			return
		}
		if err := s.DeductVariantStock(r.Context(), id, body.Quantity); err != nil {
			// if insufficient stock -> return 409 so callers know it's a stock problem
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "deducted"})
	}
}
