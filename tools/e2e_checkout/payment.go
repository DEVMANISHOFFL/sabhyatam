package main

import (
	"fmt"
	"net/http"
)

func initiatePayment(orderID string) {
	req, _ := http.NewRequest(
		"POST",
		paymentsBase+"/v1/payments/initiate",
		nil,
	)
	req.Header.Set("X-ORDER-ID", orderID)
	req.Header.Set("Idempotency-Key", "e2e-"+orderID)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		panic(fmt.Errorf("initiatePayment failed: %d", resp.StatusCode))
	}
}
