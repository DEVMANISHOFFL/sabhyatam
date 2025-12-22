package service

import "context"

type OrderReader interface {
	IsOrderItemDelivered(
		ctx context.Context,
		orderItemID string,
		userID string,
	) (bool, error)
}
