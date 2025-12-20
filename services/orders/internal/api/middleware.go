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

// Keep this one! It processes the User ID for your logic
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

// --- DELETED CORSMiddleware function entirely ---

func AdminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		adminKey := os.Getenv("ADMIN_KEY")
		if adminKey == "" {
			log.Println("WARNING: ADMIN_KEY not set")
		}

		if r.Header.Get("X-ADMIN-KEY") != adminKey {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}
