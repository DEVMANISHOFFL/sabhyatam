package middleware

import "net/http"

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// Allow frontend origin
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")

		// Allow methods
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

		// Allow headers used by frontend + admin
		w.Header().Set(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization, X-ADMIN-KEY, X-SESSION-ID",
		)

		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// Handle browser preflight
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
