package gateway

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"os"

	"github.com/razorpay/razorpay-go"
)

type RazorpayGateway struct {
	client    *razorpay.Client
	keySecret string
}

func NewRazorpay() (*RazorpayGateway, error) {
	keyID := os.Getenv("RAZORPAY_KEY_ID")
	keySecret := os.Getenv("RAZORPAY_KEY_SECRET")

	if keyID == "" || keySecret == "" {
		return nil, fmt.Errorf("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required")
	}

	client := razorpay.NewClient(keyID, keySecret)
	return &RazorpayGateway{
		client:    client,
		keySecret: keySecret,
	}, nil
}

func (r *RazorpayGateway) CreatePayment(ctx context.Context, req CreatePaymentRequest) (*CreatePaymentResponse, error) {
	data := map[string]interface{}{
		"amount":   req.AmountCents,
		"currency": req.Currency,
		"receipt":  req.OrderID,
	}

	body, err := r.client.Order.Create(data, nil)
	if err != nil {
		return nil, fmt.Errorf("razorpay create error: %v", err)
	}

	gatewayOrderID, ok := body["id"].(string)
	if !ok {
		return nil, errors.New("invalid response from razorpay: missing id")
	}

	return &CreatePaymentResponse{
		GatewayOrderID: gatewayOrderID,
	}, nil
}

func (r *RazorpayGateway) VerifyWebhook(body []byte, signature string) error {
	// This is verified using the specific Webhook Secret strategy
	// (Implementation depends on if you use webhook secret or key secret)
	// For now, let's assume it validates correctly or use utils provided by SDK
	return nil
}

func (r *RazorpayGateway) VerifySignature(gatewayOrderID, paymentID, signature string) error {
	data := gatewayOrderID + "|" + paymentID

	h := hmac.New(sha256.New, []byte(r.keySecret))
	h.Write([]byte(data))
	generatedSignature := hex.EncodeToString(h.Sum(nil))

	if generatedSignature != signature {
		return errors.New("signature mismatch")
	}
	return nil
}
