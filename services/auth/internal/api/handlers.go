package api

import (
	"encoding/json"
	"net/http"

	"github.com/devmanishoffl/sabhyatam-auth/internal/store"
)

type AuthHandler struct {
	store *store.UserStore
}

func NewAuthHandler(s *store.UserStore) *AuthHandler {
	return &AuthHandler{store: s}
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	// Access via the same custom key type
	val := r.Context().Value(UserIDKey)
	userID, ok := val.(string)
	if !ok {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"user_id": userID,
		"status":  "authenticated",
	})
}

// func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
// 	var req model.RegisterRequest
// 	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
// 		http.Error(w, "Invalid request", http.StatusBadRequest)
// 		return
// 	}

// 	user, err := h.store.CreateUser(r.Context(), &req)
// 	if err != nil {
// 		http.Error(w, "Registration failed: "+err.Error(), http.StatusConflict)
// 		return
// 	}

// 	// Auto-login after register
// 	token, _ := service.GenerateToken(user)
// 	refreshToken, _ := service.GenerateRefreshToken(user)

// 	if err != nil {
// 		http.Error(w, "Internal server error", http.StatusInternalServerError)
// 		return
// 	}

// 	h.store.SaveRefreshToken(r.Context(), user.ID, refreshToken, 7*24*time.Hour)

// 	json.NewEncoder(w).Encode(model.AuthResponse{
// 		Token:        token,
// 		RefreshToken: refreshToken,
// 		User:         *user,
// 	})
// }

// func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
// 	var req model.LoginRequest
// 	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
// 		http.Error(w, "Invalid request", http.StatusBadRequest)
// 		return
// 	}

// 	user, err := h.store.GetUserByEmail(r.Context(), req.Email)
// 	if err != nil {
// 		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
// 		return
// 	}

// 	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
// 		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
// 		return
// 	}

// 	token, _ := service.GenerateToken(user)
// 	refreshToken, _ := service.GenerateRefreshToken(user)

// 	if err != nil {
// 		http.Error(w, "Internal server error", http.StatusInternalServerError)
// 		return
// 	}

// 	h.store.SaveRefreshToken(r.Context(), user.ID, refreshToken, 7*24*time.Hour)

// 	json.NewEncoder(w).Encode(model.AuthResponse{
// 		Token:        token,
// 		RefreshToken: refreshToken,
// 		User:         *user,
// 	})
// }

// func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
// 	type RefreshRequest struct {
// 		RefreshToken string `json:"refresh_token"`
// 	}

// 	var req RefreshRequest
// 	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
// 		http.Error(w, "Invalid request", http.StatusBadRequest)
// 		return
// 	}

// 	// 1. Check if token exists in DB
// 	userID, err := h.store.ValidateRefreshToken(r.Context(), req.RefreshToken)
// 	if err != nil {
// 		http.Error(w, "Invalid or expired refresh token", http.StatusUnauthorized)
// 		return
// 	}

// 	// 2. Generate NEW Access Token
// 	// You might need a helper in store to GetUserByID to get the role,
// 	// or just assume 'customer' for MVP if you don't want to query user table again.
// 	// Ideally: user, _ := h.store.GetUserByID(ctx, userID)

// 	// Quick MVP fix: Create a user struct with just ID to generate token
// 	// (Note: This token won't have the updated Role/Name until next login unless you fetch User from DB)

// 	dummyUser := &model.User{ID: userID, Role: "customer"}

// 	newToken, _ := service.GenerateToken(dummyUser)

// 	json.NewEncoder(w).Encode(map[string]string{
// 		"token": newToken,
// 	})
// }

// func (h *AuthHandler) CreateAdmin(w http.ResponseWriter, r *http.Request) {
// 	// This endpoint should be protected by a strict middleware (super-admin key)
// 	// Implementation is similar to Register but forces Role = 'admin'
// }
