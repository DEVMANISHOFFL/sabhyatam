package middleware

import (
	"net/http"
	"os"
)

func AdminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		adminKey := os.Getenv("ADMIN_KEY")
		if adminKey == "" {
			http.Error(w, "admin key not configured", http.StatusInternalServerError)
			return
		}

		if r.Header.Get("X-ADMIN-KEY") != adminKey {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}
