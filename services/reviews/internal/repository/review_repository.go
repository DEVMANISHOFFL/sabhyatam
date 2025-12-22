package repository

import (
	"context"
	"errors"

	"github.com/devmanishoffl/sabhyatam-reviews/internal/domain"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrDuplicateReview = errors.New("review already exists")

type ReviewRepository struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *ReviewRepository {
	return &ReviewRepository{db: db}
}

func (r *ReviewRepository) Create(ctx context.Context, review *domain.Review) error {
	query := `
	insert into public.reviews
	(user_id, order_item_id, product_id, rating, title, body)
	values ($1, $2, $3, $4, $5, $6)
	`

	_, err := r.db.Exec(
		ctx,
		query,
		review.UserID,
		review.OrderItemID,
		review.ProductID,
		review.Rating,
		review.Title,
		review.Body,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrDuplicateReview
		}
		return err // ← surface REAL errors
	}
	return nil
}

func (r *ReviewRepository) ListByProduct(
	ctx context.Context,
	productID string,
	limit int,
	offset int,
) ([]domain.Review, error) {

	rows, err := r.db.Query(ctx, `
		select id, user_id, order_item_id, product_id,
		       rating, title, body, status,
		       created_at, updated_at
		from reviews
		where product_id = $1
		  and status = 'approved'
		order by created_at desc
		limit $2 offset $3
	`, productID, limit, offset)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []domain.Review
	for rows.Next() {
		var r domain.Review
		if err := rows.Scan(
			&r.ID,
			&r.UserID,
			&r.OrderItemID,
			&r.ProductID,
			&r.Rating,
			&r.Title,
			&r.Body,
			&r.Status,
			&r.CreatedAt,
			&r.UpdatedAt,
		); err != nil {
			return nil, err
		}
		reviews = append(reviews, r)
	}

	return reviews, nil
}

func (r *ReviewRepository) RatingSummary(
	ctx context.Context,
	productID string,
) (avg float64, count int, err error) {

	err = r.db.QueryRow(ctx, `
		select
			coalesce(avg(rating), 0),
			count(*)
		from public.reviews
		where product_id = $1
		  and status = 'approved'
	`, productID).Scan(&avg, &count)

	return
}
func (r *ReviewRepository) Approve(
	ctx context.Context,
	reviewID string,
) error {
	cmd, err := r.db.Exec(ctx, `
	update public.reviews
	set status = 'approved', updated_at = now()
	where id = $1
`, reviewID)

	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return errors.New("review not found")
	}
	return nil

}

func (r *ReviewRepository) ListPending(ctx context.Context) ([]domain.Review, error) {
	query := `
        SELECT id, user_id, order_item_id, product_id,
               rating, title, body, status,
               created_at, updated_at
        FROM reviews
        WHERE status = 'pending'
        ORDER BY created_at ASC
    `
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []domain.Review
	for rows.Next() {
		var rv domain.Review
		if err := rows.Scan(
			&rv.ID, &rv.UserID, &rv.OrderItemID, &rv.ProductID,
			&rv.Rating, &rv.Title, &rv.Body, &rv.Status,
			&rv.CreatedAt, &rv.UpdatedAt,
		); err != nil {
			return nil, err
		}
		reviews = append(reviews, rv)
	}
	return reviews, nil
}
