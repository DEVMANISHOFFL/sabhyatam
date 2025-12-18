-- Ensure SKU column exists (safe if already present)
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS sku TEXT;

-- Backfill existing rows so NOT NULL + UNIQUE won't fail
UPDATE product_variants
SET sku = 'SKU-' || id
WHERE sku IS NULL;

-- Enforce NOT NULL on sku (guarded)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_variants'
      AND column_name = 'sku'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE product_variants
    ALTER COLUMN sku SET NOT NULL;
  END IF;
END $$;

-- Enforce UNIQUE constraint on sku (guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_variants_sku_key'
  ) THEN
    ALTER TABLE product_variants
    ADD CONSTRAINT product_variants_sku_key UNIQUE (sku);
  END IF;
END $$;

-- Optional: ensure index exists (unique constraint already creates one,
-- but this preserves naming consistency if referenced elsewhere)
CREATE INDEX IF NOT EXISTS idx_variants_sku
ON product_variants (sku);
