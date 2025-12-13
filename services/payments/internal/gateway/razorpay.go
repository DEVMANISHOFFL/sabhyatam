package gateway

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
)

type Razorpay struct {
	KeyID     string
	KeySecret string
}

func NewRazorpay() *Razorpay {
	return &Razorpay{
		KeyID:     os.Getenv("RAZORPAY_KEY_ID"),
		KeySecret: os.Getenv("RAZORPAY_KEY_SECRET"),
	}
}

func (r *Razorpay) CreatePayment(
	ctx context.Context,
	req CreatePaymentRequest,
) (*CreatePaymentResponse, error) {

	body := map[string]any{
		"amount":   req.AmountCents,
		"currency": req.Currency,
		"receipt":  req.OrderID,
	}

	b, _ := json.Marshal(body)

	httpReq, _ := http.NewRequestWithContext(
		ctx,
		"POST",
		"https://api.razorpay.com/v1/orders",
		bytes.NewBuffer(b),
	)
	httpReq.SetBasicAuth(r.KeyID, r.KeySecret)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var out struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}

	return &CreatePaymentResponse{
		GatewayOrderID: out.ID,
	}, nil
}

func (r *Razorpay) VerifyWebhook(body []byte, signature string) error {
	h := hmac.New(sha256.New, []byte(r.KeySecret))
	h.Write(body)
	expected := hex.EncodeToString(h.Sum(nil))

	if expected != signature {
		return http.ErrAbortHandler
	}
	return nil
}
