-- orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text, -- your auth user id (string) — can be UUID or text depending on auth
  status text NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  total_amount_cents bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- order_items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  variant_id uuid NOT NULL,
  quantity integer NOT NULL,
  price_cents bigint NOT NULL, -- price snapshot
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
