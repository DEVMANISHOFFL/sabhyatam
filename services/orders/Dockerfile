FROM golang:1.23-alpine

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o ordersvc

EXPOSE 8082

CMD ["./ordersvc"]
