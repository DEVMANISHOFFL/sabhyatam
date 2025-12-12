package api

import (
	"fmt"
	"net/http"
	"os"
)

func AdminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("ADMIN_KEY is:", os.Getenv("ADMIN_KEY"))
		fmt.Println("REQUEST KEY:", r.Header.Get("X-ADMIN-KEY"))

		adminKey := os.Getenv("ADMIN_KEY")
		if adminKey == "" {
			http.Error(w, "admin key not configured", http.StatusInternalServerError)
			return
		}

		reqKey := r.Header.Get("X-ADMIN-KEY")
		if reqKey == "" || reqKey != adminKey {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}
