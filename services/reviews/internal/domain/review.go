package domain

import "time"

type ReviewStatus string

const (
	Pending  ReviewStatus = "pending"
	Approved ReviewStatus = "approved"
	Rejected ReviewStatus = "rejected"
)

type Review struct {
	ID          string
	UserID      string
	OrderItemID string
	ProductID   string

	Rating int
	Title  string
	Body   string

	Status ReviewStatus

	CreatedAt time.Time
	UpdatedAt time.Time
}
