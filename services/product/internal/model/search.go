package model

type SearchParams struct {
	Query    string
	Category string
	Fabric   string
	Weave    string
	Color    string
	Occasion string
	MinPrice int
	MaxPrice int
	Sort     string
	Page     int
	Limit    int
}

type ProductCard struct {
	ID        string         `json:"id"`
	Title     string         `json:"title"`
	Slug      string         `json:"slug"`
	Category  string         `json:"category"`
	Price     int            `json:"price"`
	ImageURL  string         `json:"image_url"`
	Attrs     map[string]any `json:"attributes"`
	VariantID string         `json:"variant_id"`
	InStock   bool           `json:"in_stock"`
}

type FacetCounts map[string]map[string]int

type Facets map[string]map[string]int
