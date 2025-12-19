package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/devmanishoffl/sabhyatam-product/internal/gateway"
	"github.com/devmanishoffl/sabhyatam-product/internal/model"
	"github.com/devmanishoffl/sabhyatam-product/internal/store"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	store     *store.Store
	s3gateway *gateway.S3Gateway
}

func NewHandler(s *store.Store, s3gw *gateway.S3Gateway) *Handler {
	return &Handler{
		store:     s,
		s3gateway: s3gw,
	}
}

func (h *Handler) RegisterRoutes(r *chi.Mux) {
	r.Route("/v1", func(r chi.Router) {
		r.Use(middleware.StripSlashes)

		// Public Routes
		r.Get("/products/search", h.searchProductsHandler)
		r.Get("/products/slug/{slug}", h.getProductBySlugHandler)
		r.Get("/products/{id}", h.getProductDetailHandler)
		r.Get("/products", h.listProductsHandler)

		// Admin Routes
		r.Route("/admin", func(r chi.Router) {
			r.Use(AdminOnly)

			// Media Upload (Presigned URL)
			r.Get("/media/upload-url", h.GetUploadURL)

			// Products
			r.Get("/products", h.adminListProductsHandler)
			r.Post("/products", h.createProductHandler)
			r.Put("/products/{id}", h.updateProductHandler)
			r.Delete("/products/{id}", h.deleteProductHandler)

			// Stock Management
			r.Route("/variants", func(r chi.Router) {
				r.Post("/{variant_id}/reserve", h.reserveStockHandler)
				r.Post("/{variant_id}/release", h.releaseStockHandler)
				r.Post("/{variant_id}/deduct", h.deductStockHandler)
			})

			// Media Data
			r.Post("/products/{id}/media", h.createMediaHandler)
			r.Delete("/media/{media_id}", h.deleteMediaHandler)
		})
	})
}

func (h *Handler) adminListProductsHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 {
		limit = 10
	}
	searchQuery := q.Get("q")

	items, total, err := h.store.ListAdminProducts(r.Context(), page, limit, searchQuery)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// 2. Get Dashboard Stats
	activeCount, lowStockCount, _ := h.store.GetDashboardStats(r.Context())

	// 3. Return JSON matching frontend interface
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"items":           items,
		"total":           total,
		"active_count":    activeCount,
		"low_stock_count": lowStockCount,
	})
}

func (h *Handler) GetUploadURL(w http.ResponseWriter, r *http.Request) {
	filename := r.URL.Query().Get("filename")
	fileType := r.URL.Query().Get("content_type")

	if filename == "" || fileType == "" {
		http.Error(w, "filename and content_type are required", http.StatusBadRequest)
		return
	}

	ext := filepath.Ext(filename)
	uniqueName := fmt.Sprintf("%d-%s%s", time.Now().Unix(), "img", ext)
	key := fmt.Sprintf("products/%d/%s", time.Now().Year(), uniqueName)

	// Generate Presigned URL
	uploadURL, err := h.s3gateway.GenerateUploadURL(key, fileType)
	if err != nil {
		http.Error(w, "failed to generate url: "+err.Error(), http.StatusInternalServerError)
		return
	}

	publicURL := fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s",
		h.s3gateway.Bucket,
		"us-east-1",
		key,
	)

	writeJSON(w, http.StatusOK, map[string]string{
		"upload_url": uploadURL,
		"public_url": publicURL,
	})
}

func (h *Handler) listProductsHandler(w http.ResponseWriter, r *http.Request) {
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
	limit := 12
	if v := q.Get("page"); v != "" {
		page, _ = strconv.Atoi(v)
	}
	if page < 1 {
		page = 1
	}
	if v := q.Get("limit"); v != "" {
		limit, _ = strconv.Atoi(v)
	}

	offset := (page - 1) * limit

	items, err := h.store.ListProductsFiltered(r.Context(), filters, sortParam, limit, offset)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	total, err := h.store.CountProductsFiltered(r.Context(), filters)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	activeCount, lowStockCount, _ := h.store.GetDashboardStats(r.Context())

	resp := map[string]interface{}{
		"page":            page,
		"limit":           limit,
		"items":           items,
		"total":           total,
		"active_count":    activeCount,
		"low_stock_count": lowStockCount,
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) getProductDetailHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	product, err := h.store.GetProductByID(r.Context(), id)
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	media, _ := h.store.GetMediaByProductID(r.Context(), product.ID)

	writeJSON(w, http.StatusOK, map[string]any{
		"product": product,
		"media":   media,
		"seo": map[string]any{
			"title":       product.Title + " | Sabhyatam",
			"description": product.ShortDesc,
			"canonical":   "https://sabhyatam.com/products/" + product.Slug,
		},
	})
}

func (h *Handler) createProductHandler(w http.ResponseWriter, r *http.Request) {
	var req model.Product
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	id, err := h.store.CreateProduct(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"id": id})
}

func (h *Handler) updateProductHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req model.Product
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	err := h.store.UpdateProduct(r.Context(), id, &req)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

func (h *Handler) deleteProductHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := h.store.DeleteProduct(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (h *Handler) createMediaHandler(w http.ResponseWriter, r *http.Request) {
	productID := chi.URLParam(r, "id")

	var req model.Media
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 1. Check Hero Image Uniqueness
	if role, ok := req.Meta["role"]; ok && role == "hero" {
		exists, err := h.store.HasHeroImage(r.Context(), productID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if exists {
			http.Error(w, "product already has a hero image", http.StatusBadRequest)
			return
		}
	}

	if rawOrder, ok := req.Meta["order"]; ok {
		order, err := strconv.Atoi(fmt.Sprint(rawOrder))
		if err != nil {
			http.Error(w, "invalid media order", http.StatusBadRequest)
			return
		}
		exists, err := h.store.HasMediaOrder(r.Context(), productID, order)
		if err != nil {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		if exists {
			http.Error(w, "media order already exists for product", http.StatusBadRequest)
			return
		}
	}

	id, err := h.store.CreateMedia(r.Context(), productID, &req)
	if err != nil {
		if strings.Contains(err.Error(), "already exists") {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"id": id})
}

func (h *Handler) deleteMediaHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "media_id")

	err := h.store.DeleteMedia(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (h *Handler) reserveStockHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Quantity int `json:"quantity"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	if err := h.store.ReserveStock(r.Context(), id, body.Quantity); err != nil {
		http.Error(w, err.Error(), 409)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "reserved"})
}
func (h *Handler) releaseStockHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Quantity int `json:"quantity"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	if err := h.store.ReleaseStock(r.Context(), id, body.Quantity); err != nil {
		http.Error(w, err.Error(), 409)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "released"})
}

func (h *Handler) deductStockHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Quantity int `json:"quantity"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	if err := h.store.DeductStock(r.Context(), id, body.Quantity); err != nil {
		http.Error(w, err.Error(), 409)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deducted"})
}
func (h *Handler) searchProductsHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))

	if page <= 0 {
		page = 1
	}
	if limit <= 0 || limit > 50 {
		limit = 12
	}

	params := model.SearchParams{
		Query:    q.Get("q"),
		Category: q.Get("category"),
		Fabric:   q.Get("fabric"),
		Color:    q.Get("color"),
		Occasion: q.Get("occasion"),
		Sort:     q.Get("sort"),
		Page:     page,
		Limit:    limit,
	}

	if v := q.Get("min_price"); v != "" {
		params.MinPrice, _ = strconv.Atoi(v)
	}
	if v := q.Get("max_price"); v != "" {
		params.MaxPrice, _ = strconv.Atoi(v)
	}

	items, total, facets, err := h.store.SearchProducts(r.Context(), params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if items == nil {
		items = []model.ProductCard{}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"items":  items,
		"facets": facets,
		"page":   page,
		"limit":  limit,
		"total":  total,
	})
}

func (h *Handler) getProductBySlugHandler(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	product, err := h.store.GetProductBySlug(r.Context(), slug)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	media, _ := h.store.GetMediaByProductID(r.Context(), product.ID)

	writeJSON(w, http.StatusOK, map[string]any{
		"product": product,
		"media":   media,
	})
}
