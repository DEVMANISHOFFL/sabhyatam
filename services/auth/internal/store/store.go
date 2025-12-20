package store

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/devmanishoffl/sabhyatam-auth/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type UserStore struct {
	db *pgxpool.Pool
}

func NewUserStore(db *pgxpool.Pool) *UserStore {
	return &UserStore{db: db}
}

func (s *UserStore) CreateUser(ctx context.Context, req *model.RegisterRequest) (*model.User, error) {
	// 1. Hash Password
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 2. Insert into DB
	var user model.User
	query := `
		INSERT INTO users (email, password_hash, full_name, phone, role)
		VALUES ($1, $2, $3, $4, 'customer')
		RETURNING id, email, full_name, role, created_at
	`

	// Handle null phone
	var phone *string
	if req.Phone != "" {
		phone = &req.Phone
	}

	err = s.db.QueryRow(ctx, query, req.Email, string(hashedBytes), req.FullName, phone).Scan(
		&user.ID, &user.Email, &user.FullName, &user.Role, &user.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *UserStore) GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	var user model.User
	query := `SELECT id, email, password_hash, full_name, role, created_at FROM users WHERE email=$1`

	err := s.db.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FullName, &user.Role, &user.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, errors.New("user not found")
	}
	return &user, err
}

// Add this to your imports: "crypto/sha256", "encoding/hex"

func (s *UserStore) SaveRefreshToken(ctx context.Context, userID uuid.UUID, token string, expiresIn time.Duration) error {
	// Hash the token so if DB is leaked, tokens are safe
	hash := sha256.Sum256([]byte(token))
	hashString := hex.EncodeToString(hash[:])

	query := `
        INSERT INTO refresh_tokens (token_hash, user_id, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (token_hash) DO NOTHING
    `
	_, err := s.db.Exec(ctx, query, hashString, userID, time.Now().Add(expiresIn))
	return err
}

func (s *UserStore) ValidateRefreshToken(ctx context.Context, token string) (uuid.UUID, error) {
	hash := sha256.Sum256([]byte(token))
	hashString := hex.EncodeToString(hash[:])

	var userID uuid.UUID
	var expiresAt time.Time

	query := `SELECT user_id, expires_at FROM refresh_tokens WHERE token_hash=$1`
	err := s.db.QueryRow(ctx, query, hashString).Scan(&userID, &expiresAt)

	if err != nil {
		return uuid.Nil, errors.New("invalid token")
	}

	if time.Now().After(expiresAt) {
		// Optional: Delete expired token here
		return uuid.Nil, errors.New("token expired")
	}

	return userID, nil
}
