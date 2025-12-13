FROM golang:1.23-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
  go build -o paymentsvc ./cmd/paymentsvc

FROM gcr.io/distroless/base-debian11

WORKDIR /app

COPY --from=builder /app/paymentsvc /app/paymentsvc

EXPOSE 8083

USER nonroot:nonroot

ENTRYPOINT ["/app/paymentsvc"]
