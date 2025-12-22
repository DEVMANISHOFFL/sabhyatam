create table reviews (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,
  order_item_id uuid not null,
  product_id uuid not null,

  rating int not null check (rating between 1 and 5),
  title text,
  body text,

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),

  verified_purchase boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (order_item_id)
);

create index idx_reviews_product_created
  on reviews (product_id, created_at desc);
  

create index idx_reviews_product_status
  on reviews (product_id, status);
