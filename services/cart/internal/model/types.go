package model

type CartItem struct {
	ProductID string `json:"product_id"`
	VariantID string `json:"variant_id"`
	Quantity  int    `json:"quantity"`
	UnitPrice int64  `json:"unit_price"`
	Currency  string `json:"currency"`
}

type HydratedItem struct {
	ProductID string `json:"product_id"`
	VariantID string `json:"variant_id"`
	Quantity  int    `json:"quantity"`
	UnitPrice int64  `json:"unit_price"`
	LineTotal int64  `json:"line_total"`
}

type CartResponse struct {
	Items     []HydratedItem `json:"items"`
	Subtotal  int64          `json:"subtotal"`
	ItemCount int            `json:"item_count"`
	Currency  string         `json:"currency"`
}
