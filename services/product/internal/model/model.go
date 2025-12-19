package model

import "time"

type Product struct {
	ID        string `json:"id"`
	Slug      string `json:"slug"`
	Title     string `json:"title"`
	ShortDesc string `json:"short_desc"`
	LongDesc  string `json:"long_desc"`
	Category  string `json:"category"`
	Subcat    string `json:"subcategory"`

	// Core Commerce Fields (Moved from Variants)
	Price         int    `json:"price"`
	MRP           *int   `json:"mrp,omitempty"`
	Stock         int    `json:"stock"`
	SKU           string `json:"sku"`
	StockReserved int    `json:"stock_reserved"`
	InStock       bool   `json:"in_stock"` // Computed field

	Attributes map[string]interface{} `json:"attributes"`
	Tags       []string               `json:"tags"`

	Published bool      `json:"published"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// ImageURL is often the first image from Media
	ImageURL string  `json:"image_url"`
	Media    []Media `json:"media,omitempty"`
}

type Media struct {
	ID        string                 `json:"id"`
	ProductID string                 `json:"product_id"`
	URL       string                 `json:"url"`
	MediaType string                 `json:"media_type"`
	Meta      map[string]interface{} `json:"meta"`
	CreatedAt time.Time              `json:"created_at"`
}
