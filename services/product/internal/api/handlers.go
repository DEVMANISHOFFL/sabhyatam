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
