package worker

import (
	"context"
	"log"
	"time"

	"github.com/devmanishoffl/sabhyatam-payments/internal/client"
	"github.com/devmanishoffl/sabhyatam-payments/internal/store"
)

type PaymentTimeoutWorker struct {
	store        *store.PGStore
	ordersClient *client.OrdersClient
	timeout      time.Duration
}

func NewPaymentTimeoutWorker(
	s *store.PGStore,
	o *client.OrdersClient,
	timeout time.Duration,
) *PaymentTimeoutWorker {
	return &PaymentTimeoutWorker{
		store:        s,
		ordersClient: o,
		timeout:      timeout,
	}
}

func (w *PaymentTimeoutWorker) Run(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			w.sweep(ctx)
		}
	}
}

func (w *PaymentTimeoutWorker) sweep(ctx context.Context) {
	stale, err := w.store.FindStalePayments(ctx, w.timeout)
	if err != nil {
		log.Println("payment sweep failed:", err)
		return
	}

	for _, p := range stale {
		log.Println("releasing stale payment:", p.PaymentID)

		// idempotent — orders service handles duplicates
		if err := w.ordersClient.ReleaseOrder(ctx, p.OrderID); err != nil {
			log.Println("failed to release order:", p.OrderID, err)
			continue
		}

		_ = w.store.MarkPaymentFailed(ctx, p.PaymentID)
	}
}
