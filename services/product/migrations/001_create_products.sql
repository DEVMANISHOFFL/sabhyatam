CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  short_desc TEXT,
  long_desc TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  attributes JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::text[],
  vendor_id UUID,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- variants table 
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  mrp NUMERIC(12,2),
  stock INT DEFAULT 0,
  attributes JSONB DEFAULT '{}'::jsonb,
  weight_grams INT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- media table 
CREATE TABLE IF NOT EXISTS product_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image', 
  meta JSONB DEFAULT '{}'::jsonb,  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products (subcategory);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_products_attributes ON products USING GIN (attributes);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants (sku);
CREATE INDEX IF NOT EXISTS idx_media_product ON product_media (product_id);

-- trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON products;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_variant ON product_variants;
CREATE TRIGGER set_timestamp_variant BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
