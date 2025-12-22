# ---------- Build stage ----------
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git (needed for go modules sometimes)
RUN apk add --no-cache git

# Copy go mod files first (better caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
  go build -o reviewsvc ./cmd/api


# ---------- Runtime stage ----------
FROM gcr.io/distroless/base-debian12

WORKDIR /app

COPY --from=builder /app/reviewsvc /reviewsvc 

EXPOSE 8085

USER nonroot:nonroot

ENTRYPOINT ["/reviewsvc"]
