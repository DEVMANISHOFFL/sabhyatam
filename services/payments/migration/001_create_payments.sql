CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL,
    user_id UUID,

    gateway TEXT NOT NULL,
    gateway_order_id TEXT,
    gateway_payment_id TEXT,

    amount_cents BIGINT NOT NULL,
    currency TEXT NOT NULL,

    status TEXT NOT NULL CHECK (
        status IN (
            'initiated',
            'authorized',
            'captured',
            'failed',
            'refunded'
        )
    ),

    idempotency_key TEXT NOT NULL UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id
    ON payments(order_id);

CREATE INDEX IF NOT EXISTS idx_payments_gateway_order_id
    ON payments(gateway_order_id);
