package model

type CartItem struct {
	ProductID string `json:"product_id"`
	VariantID string `json:"variant_id"`
	Quantity  int    `json:"quantity"`
}

type HydratedItem struct {
	Product   any   `json:"product"`
	Variant   any   `json:"variant"`
	Quantity  int   `json:"quantity"`
	LineTotal int64 `json:"line_total"` // price * qty in paisa (or smallest unit)
}

type CartResponse struct {
	Items     []HydratedItem `json:"items"`
	CartTotal int64          `json:"cart_total"`
}
