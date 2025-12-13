FROM golang:1.23-alpine

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o cartsvc

EXPOSE 8081

CMD ["./cartsvc"]
