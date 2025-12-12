package api

import (
	"context"
	"net/http"
)

type ctxKey string

const (
	CtxUserID    ctxKey = "user_id"
	CtxSessionID ctxKey = "session_id"
)

// Auth-like header extraction
// - If X-USER-ID present -> authenticated user
// - Else read X-SESSION-ID or create one (client side should create)
func UserSessionMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		uid := r.Header.Get("X-USER-ID")
		sid := r.Header.Get("X-SESSION-ID")
		// prefer user id if present
		ctx := r.Context()
		if uid != "" {
			ctx = context.WithValue(ctx, CtxUserID, uid)
		} else if sid != "" {
			ctx = context.WithValue(ctx, CtxSessionID, sid)
		}
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
