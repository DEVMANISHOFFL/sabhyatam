package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"
)

type ctxKey string

const UserIDKey ctxKey = "user_id"

func SupabaseAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			http.Error(w, "missing auth", http.StatusUnauthorized)
			return
		}

		token := strings.TrimPrefix(auth, "Bearer ")

		req, _ := http.NewRequest(
			"GET",
			os.Getenv("SUPABASE_URL")+"/auth/v1/user",
			nil,
		)
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("apikey", os.Getenv("SUPABASE_ANON_KEY"))

		resp, err := http.DefaultClient.Do(req)
		if err != nil || resp.StatusCode != 200 {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}
		defer resp.Body.Close()

		var body struct {
			ID string `json:"id"`
		}
		json.NewDecoder(resp.Body).Decode(&body)

		if body.ID == "" {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, body.ID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
