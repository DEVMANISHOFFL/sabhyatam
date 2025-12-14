package api

import (
	"context"
	"net/http"

	"github.com/google/uuid"
)

type ctxKey string

const (
	CtxSessionID ctxKey = "session_id"
	CtxUserID    ctxKey = "user_id"
)

func UserSessionMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		ctx := r.Context()

		// 1️⃣ Try reading session cookie
		cookie, err := r.Cookie("sabhyatam_session")
		if err == nil && cookie.Value != "" {
			ctx = context.WithValue(ctx, CtxSessionID, cookie.Value)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		// 2️⃣ No session → create guest session
		sessionID := uuid.NewString()

		http.SetCookie(w, &http.Cookie{
			Name:     "sabhyatam_session",
			Value:    sessionID,
			Path:     "/",
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
			// Secure: true // enable in prod HTTPS
		})

		ctx = context.WithValue(ctx, CtxSessionID, sessionID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
