package service

import (
	"context"
	"errors"

	"github.com/devmanishoffl/sabhyatam-reviews/internal/domain"
	"github.com/devmanishoffl/sabhyatam-reviews/internal/repository"
)

var ErrNotEligible = errors.New("not eligible to review")

type ReviewService struct {
	repo   *repository.ReviewRepository
	orders OrderReader
}

func New(repo *repository.ReviewRepository, orders OrderReader) *ReviewService {
	return &ReviewService{repo: repo, orders: orders}
}

func (s *ReviewService) Create(
	ctx context.Context,
	userID string,
	review domain.Review,
) error {

	ok, err := s.orders.IsOrderItemDelivered(ctx, review.OrderItemID, userID)
	if err != nil {
		return err
	}
	if !ok {
		return ErrNotEligible
	}

	review.UserID = userID
	return s.repo.Create(ctx, &review)
}

func (s *ReviewService) ListProductReviews(
	ctx context.Context,
	productID string,
	page int,
	limit int,
) ([]domain.Review, error) {

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	return s.repo.ListByProduct(ctx, productID, limit, offset)
}

func (s *ReviewService) GetRatingSummary(
	ctx context.Context,
	productID string,
) (float64, int, error) {
	return s.repo.RatingSummary(ctx, productID)
}

func (s *ReviewService) Approve(
	ctx context.Context,
	reviewID string,
) error {
	return s.repo.Approve(ctx, reviewID)
}

func (s *ReviewService) ListPendingReviews(ctx context.Context) ([]domain.Review, error) {
	return s.repo.ListPending(ctx)
}
