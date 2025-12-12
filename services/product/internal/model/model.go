package model

import "time"

type Product struct {
	ID         string                 `json:"id"`
	Slug       string                 `json:"slug"`
	Title      string                 `json:"title"`
	ShortDesc  string                 `json:"short_desc"`
	LongDesc   string                 `json:"long_desc"`
	Category   string                 `json:"category"`
	Subcat     string                 `json:"subcategory"`
	Attributes map[string]interface{} `json:"attributes"`
	Tags       []string               `json:"tags"`
	Published  bool                   `json:"published"`
	CreatedAt  time.Time              `json:"created_at"`
	UpdatedAt  time.Time              `json:"updated_at"`
}

type Variant struct {
	ID         string         `json:"id"`
	ProductID  string         `json:"product_id"`
	SKU        string         `json:"sku"`
	Price      float64        `json:"price"`
	MRP        float64        `json:"mrp"`
	Stock      int            `json:"stock"`
	Attributes map[string]any `json:"attributes"`
}

type Media struct {
	ID        string                 `json:"id"`
	ProductID string                 `json:"product_id"`
	VariantID *string                `json:"variant_id,omitempty"`
	URL       string                 `json:"url"`
	MediaType string                 `json:"media_type"`
	Meta      map[string]interface{} `json:"meta"`
	CreatedAt time.Time              `json:"created_at"`
}
