package api

import (
	"context"
	"log"
	"net/http"
	"os"
)

type ctxKey string

const (
	ctxUserID    ctxKey = "user_id"
	ctxSessionID ctxKey = "session_id"
)

func getUserID(ctx context.Context) string {
	if v := ctx.Value(ctxUserID); v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func getSessionID(ctx context.Context) string {
	if v := ctx.Value(ctxSessionID); v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func UserSessionMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		if uid := r.Header.Get("X-USER-ID"); uid != "" {
			ctx = context.WithValue(ctx, ctxUserID, uid)
		}

		if sid := r.Header.Get("X-SESSION-ID"); sid != "" {
			ctx = context.WithValue(ctx, ctxSessionID, sid)
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-USER-ID, X-SESSION-ID")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// internal/api/middleware.go

func AdminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// simple check: match against an env variable
		adminKey := os.Getenv("ADMIN_KEY")
		if adminKey == "" {
			// Fallback or log warning if env not set
			log.Println("WARNING: ADMIN_KEY not set")
		}

		// Check header (e.g., "X-ADMIN-KEY")
		if r.Header.Get("X-ADMIN-KEY") != adminKey {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}
