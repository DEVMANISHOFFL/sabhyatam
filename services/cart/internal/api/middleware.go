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

		// 1️⃣ INTERNAL / API CALLS: trust header first
		if sid := r.Header.Get("X-SESSION-ID"); sid != "" {
			ctx = context.WithValue(ctx, CtxSessionID, sid)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		// 2️⃣ BROWSER: read cookie
		if cookie, err := r.Cookie("sabhyatam_session"); err == nil && cookie.Value != "" {
			ctx = context.WithValue(ctx, CtxSessionID, cookie.Value)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		// 3️⃣ New guest session (browser only)
		sessionID := uuid.NewString()

		http.SetCookie(w, &http.Cookie{
			Name:     "sabhyatam_session",
			Value:    sessionID,
			Path:     "/",
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		})

		ctx = context.WithValue(ctx, CtxSessionID, sessionID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
