CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    order_id UUID NOT NULL,
    user_id TEXT,

    gateway TEXT NOT NULL,
    gateway_payment_id TEXT,
    gateway_order_id TEXT,

    amount_cents BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',

    status TEXT NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
