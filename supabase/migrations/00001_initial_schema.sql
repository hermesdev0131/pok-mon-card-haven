-- ============================================================
-- GradedBR Marketplace — Initial Schema
-- Supabase (PostgreSQL 15+)
-- ============================================================
-- Prices stored as INTEGER in centavos (R$150.00 = 15000)
-- UUIDs for all primary keys
-- RLS enabled on every table
-- ============================================================

-- =========================
-- 1. EXTENSIONS
-- =========================
create extension if not exists "pgcrypto";
create extension if not exists "moddatetime";

-- =========================
-- 2. CUSTOM TYPES (ENUMS)
-- =========================

create type card_type as enum (
  'fire', 'electric', 'psychic', 'dark', 'dragon',
  'ghost', 'flying', 'grass', 'water', 'normal',
  'fighting', 'steel', 'fairy', 'colorless'
);

create type grade_company as enum ('PSA', 'CGC', 'Beckett', 'TAG', 'ARS', 'Mana Fix', 'BGA', 'Capy', 'Taverna');

create type listing_status as enum ('active', 'sold', 'reserved', 'cancelled');

create type order_status as enum (
  'awaiting_payment',   -- aguardando_pagamento
  'payment_confirmed',  -- pago
  'awaiting_shipment',  -- aguardando_envio
  'shipped',            -- enviado
  'delivered',          -- entregue
  'completed',          -- concluido
  'disputed',           -- disputa
  'cancelled',          -- cancelado
  'refunded'            -- reembolsado
);

create type dispute_status as enum ('open', 'resolved_buyer', 'resolved_seller', 'escalated', 'closed');

-- =========================
-- 3. TABLES
-- =========================

-- ----- 3.1 PROFILES -----
-- Extends Supabase auth.users. Created via trigger on signup.
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  avatar_url    text,
  phone         text,
  cpf_hash      text,                       -- hashed CPF for uniqueness check
  address_line  text,
  address_city  text,
  address_state text,
  address_zip   text,
  role          text not null default 'buyer' check (role in ('buyer', 'seller', 'admin')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table profiles enable row level security;

-- ----- 3.2 SELLER PROFILES -----
-- Additional data for users who sell cards.
create table seller_profiles (
  id                    uuid primary key references profiles(id) on delete cascade,
  store_name            text not null,
  description           text,
  verified              boolean not null default false,
  total_sales           integer not null default 0,
  rating                numeric(3,2) not null default 0,    -- 0.00 to 5.00
  rating_count          integer not null default 0,
  commission_rate       numeric(4,2) not null default 10.00, -- percentage (e.g. 10.00 = 10%)
  mercadopago_seller_id text,                                -- MP account for split payments
  payout_email          text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table seller_profiles enable row level security;

-- ----- 3.3 CARD BASES -----
-- Normalized card data — the Pokemon card itself, not a specific graded copy.
-- Unique constraint on (set_code, number) prevents duplicates.
create table card_bases (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,               -- "Charizard VMAX"
  set_name    text not null,               -- "Shiny Star V"
  set_code    text not null,               -- "SSV"
  number      text not null,               -- "307/190"
  type        card_type not null default 'normal',
  rarity      text,                        -- "Secret Rare", "Alt Art", etc.
  image_url   text,                        -- official card image
  created_at  timestamptz not null default now(),

  unique (set_code, number)
);

alter table card_bases enable row level security;

-- ----- 3.4 LISTINGS -----
-- A specific graded card copy listed for sale.
create table listings (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references profiles(id) on delete cascade,
  card_base_id    uuid not null references card_bases(id) on delete restrict,
  grade           numeric(3,1) not null check (grade >= 1 and grade <= 10),  -- 1.0 to 10.0
  grade_company   grade_company not null,
  cert_number     text,                    -- grading certificate number
  price           integer not null check (price > 0),  -- centavos
  status          listing_status not null default 'active',
  free_shipping   boolean not null default false,
  condition_notes text,
  tags            text[] default '{}',
  images          text[] not null default '{}',  -- Supabase Storage URLs
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_listings_seller     on listings(seller_id);
create index idx_listings_card_base  on listings(card_base_id);
create index idx_listings_status     on listings(status);
create index idx_listings_grade      on listings(grade);
create index idx_listings_price      on listings(price);
create index idx_listings_created    on listings(created_at desc);
create index idx_listings_tags       on listings using gin(tags);

alter table listings enable row level security;

-- ----- 3.5 ORDERS -----
-- Purchase transaction. One order per listing.
create table orders (
  id                      uuid primary key default gen_random_uuid(),
  listing_id              uuid not null references listings(id) on delete restrict,
  buyer_id                uuid not null references profiles(id) on delete restrict,
  seller_id               uuid not null references profiles(id) on delete restrict,
  status                  order_status not null default 'awaiting_payment',
  price                   integer not null check (price > 0),       -- listing price snapshot
  shipping_cost           integer not null default 0,
  platform_fee            integer not null default 0,               -- commission in centavos
  seller_payout           integer not null default 0,               -- price - platform_fee

  -- Mercado Pago
  mp_payment_id           text,
  mp_preference_id        text,

  -- Shipping
  tracking_code           text,
  tracking_url            text,

  -- Timestamps for each state transition
  paid_at                 timestamptz,
  shipped_at              timestamptz,
  delivered_at            timestamptz,
  completed_at            timestamptz,
  cancelled_at            timestamptz,
  auto_complete_at        timestamptz,   -- scheduled auto-completion (e.g. 7 days after delivered)

  -- Cancellation / refund
  cancellation_reason     text,
  refunded_at             timestamptz,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- A listing can only be sold once
  constraint uq_orders_listing unique (listing_id)
);

create index idx_orders_buyer    on orders(buyer_id);
create index idx_orders_seller   on orders(seller_id);
create index idx_orders_status   on orders(status);
create index idx_orders_created  on orders(created_at desc);

alter table orders enable row level security;

-- ----- 3.6 CONFIRMED SALES -----
-- IMMUTABLE record created when order reaches COMPLETED.
-- Powers the price history charts. No UPDATE or DELETE allowed.
create table confirmed_sales (
  id              uuid primary key default gen_random_uuid(),
  card_base_id    uuid not null references card_bases(id) on delete restrict,
  order_id        uuid not null references orders(id) on delete restrict,
  buyer_id        uuid not null references profiles(id) on delete restrict,
  seller_id       uuid not null references profiles(id) on delete restrict,
  grade           numeric(3,1) not null,
  grade_company   grade_company not null,
  sale_price      integer not null,             -- centavos
  sold_at         timestamptz not null,
  created_at      timestamptz not null default now(),

  constraint uq_confirmed_sales_order unique (order_id)
);

create index idx_confirmed_sales_card    on confirmed_sales(card_base_id);
create index idx_confirmed_sales_grade   on confirmed_sales(grade);
create index idx_confirmed_sales_sold_at on confirmed_sales(sold_at desc);

alter table confirmed_sales enable row level security;

-- ----- 3.7 REVIEWS -----
-- Buyer reviews seller after order completion. One review per order.
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete restrict,
  seller_id     uuid not null references profiles(id) on delete restrict,
  buyer_id      uuid not null references profiles(id) on delete restrict,
  rating        smallint not null check (rating >= 1 and rating <= 5),
  comment       text,
  seller_reply  text,
  replied_at    timestamptz,
  created_at    timestamptz not null default now(),

  constraint uq_reviews_order unique (order_id)
);

create index idx_reviews_seller on reviews(seller_id);

alter table reviews enable row level security;

-- ----- 3.8 QUESTIONS -----
-- Public Q&A on listings.
create table questions (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references listings(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  question      text not null,
  answer        text,
  answered_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_questions_listing on questions(listing_id);

alter table questions enable row level security;

-- ----- 3.9 MESSAGES -----
-- Private messages between buyer and seller within an order.
create table messages (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  sender_id   uuid not null references profiles(id) on delete cascade,
  content     text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_messages_order   on messages(order_id);
create index idx_messages_created on messages(created_at);

alter table messages enable row level security;

-- ----- 3.10 DISPUTES -----
-- Opened when buyer or seller has a problem with an order.
create table disputes (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete restrict,
  opened_by     uuid not null references profiles(id) on delete restrict,
  reason        text not null,
  description   text,
  status        dispute_status not null default 'open',
  admin_notes   text,
  resolved_by   uuid references profiles(id),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint uq_disputes_order unique (order_id)
);

alter table disputes enable row level security;

-- ----- 3.11 ADMIN EVENT LOG -----
-- Audit trail for admin actions. Append-only.
create table admin_event_log (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references profiles(id) on delete restrict,
  action      text not null,               -- 'verify_seller', 'resolve_dispute', 'ban_user', etc.
  entity_type text not null,               -- 'seller', 'order', 'dispute', 'listing', etc.
  entity_id   uuid not null,
  details     jsonb default '{}',
  created_at  timestamptz not null default now()
);

create index idx_admin_log_created on admin_event_log(created_at desc);

alter table admin_event_log enable row level security;

-- ----- 3.12 PLATFORM CONFIG -----
-- Key-value store for platform settings.
create table platform_config (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table platform_config enable row level security;


-- =========================
-- 4. TRIGGERS
-- =========================

-- 4.1 Auto-update updated_at columns
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on profiles
  for each row execute function handle_updated_at();

create trigger set_updated_at before update on seller_profiles
  for each row execute function handle_updated_at();

create trigger set_updated_at before update on listings
  for each row execute function handle_updated_at();

create trigger set_updated_at before update on orders
  for each row execute function handle_updated_at();

create trigger set_updated_at before update on disputes
  for each row execute function handle_updated_at();

create trigger set_updated_at before update on platform_config
  for each row execute function handle_updated_at();

-- 4.2 Create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 4.3 Immutability guard on confirmed_sales — block UPDATE and DELETE
create or replace function prevent_confirmed_sale_mutation()
returns trigger as $$
begin
  raise exception 'confirmed_sales records are immutable — UPDATE and DELETE are not allowed';
end;
$$ language plpgsql;

create trigger guard_confirmed_sales_update
  before update on confirmed_sales
  for each row execute function prevent_confirmed_sale_mutation();

create trigger guard_confirmed_sales_delete
  before delete on confirmed_sales
  for each row execute function prevent_confirmed_sale_mutation();

-- 4.4 Recalculate seller rating when a review is inserted
create or replace function recalculate_seller_rating()
returns trigger as $$
begin
  update seller_profiles
  set
    rating = (
      select round(avg(rating)::numeric, 2)
      from reviews
      where seller_id = new.seller_id
    ),
    rating_count = (
      select count(*)
      from reviews
      where seller_id = new.seller_id
    )
  where id = new.seller_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_inserted
  after insert on reviews
  for each row execute function recalculate_seller_rating();

-- 4.5 Increment seller total_sales when confirmed_sale is created
create or replace function increment_seller_sales()
returns trigger as $$
begin
  update seller_profiles
  set total_sales = total_sales + 1
  where id = new.seller_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_confirmed_sale_created
  after insert on confirmed_sales
  for each row execute function increment_seller_sales();


-- =========================
-- 5. ROW LEVEL SECURITY POLICIES
-- =========================

-- Helper: check if current user is admin
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer stable;

-- ----- 5.1 PROFILES -----
create policy "Profiles are publicly readable"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- ----- 5.2 SELLER PROFILES -----
create policy "Seller profiles are publicly readable"
  on seller_profiles for select using (true);

create policy "Sellers can update own profile"
  on seller_profiles for update using (auth.uid() = id);

create policy "Users can create their own seller profile"
  on seller_profiles for insert with check (auth.uid() = id);

-- ----- 5.3 CARD BASES -----
create policy "Card bases are publicly readable"
  on card_bases for select using (true);

create policy "Only admins can insert card bases"
  on card_bases for insert with check (is_admin());

create policy "Only admins can update card bases"
  on card_bases for update using (is_admin());

-- ----- 5.4 LISTINGS -----
create policy "Active listings are publicly readable"
  on listings for select using (true);

create policy "Sellers can create own listings"
  on listings for insert with check (auth.uid() = seller_id);

create policy "Sellers can update own listings"
  on listings for update using (auth.uid() = seller_id);

-- ----- 5.5 ORDERS -----
create policy "Users can view own orders (buyer or seller)"
  on orders for select using (
    auth.uid() = buyer_id or auth.uid() = seller_id or is_admin()
  );

create policy "Authenticated users can create orders"
  on orders for insert with check (auth.uid() = buyer_id);

create policy "Order participants can update orders"
  on orders for update using (
    auth.uid() = buyer_id or auth.uid() = seller_id or is_admin()
  );

-- ----- 5.6 CONFIRMED SALES -----
create policy "Confirmed sales are publicly readable"
  on confirmed_sales for select using (true);

-- Insert only via server (service_role key) — no client insert policy
-- UPDATE and DELETE blocked by trigger

-- ----- 5.7 REVIEWS -----
create policy "Reviews are publicly readable"
  on reviews for select using (true);

create policy "Buyers can create reviews for their orders"
  on reviews for insert with check (auth.uid() = buyer_id);

create policy "Sellers can reply to reviews"
  on reviews for update using (auth.uid() = seller_id);

-- ----- 5.8 QUESTIONS -----
create policy "Questions are publicly readable"
  on questions for select using (true);

create policy "Authenticated users can ask questions"
  on questions for insert with check (auth.uid() = user_id);

create policy "Listing owners can answer questions"
  on questions for update using (
    exists (
      select 1 from listings
      where listings.id = questions.listing_id
      and listings.seller_id = auth.uid()
    )
  );

-- ----- 5.9 MESSAGES -----
create policy "Order participants can view messages"
  on messages for select using (
    exists (
      select 1 from orders
      where orders.id = messages.order_id
      and (orders.buyer_id = auth.uid() or orders.seller_id = auth.uid())
    )
    or is_admin()
  );

create policy "Order participants can send messages"
  on messages for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from orders
      where orders.id = messages.order_id
      and (orders.buyer_id = auth.uid() or orders.seller_id = auth.uid())
    )
  );

-- ----- 5.10 DISPUTES -----
create policy "Order participants can view disputes"
  on disputes for select using (
    exists (
      select 1 from orders
      where orders.id = disputes.order_id
      and (orders.buyer_id = auth.uid() or orders.seller_id = auth.uid())
    )
    or is_admin()
  );

create policy "Order participants can open disputes"
  on disputes for insert with check (
    auth.uid() = opened_by
    and exists (
      select 1 from orders
      where orders.id = disputes.order_id
      and (orders.buyer_id = auth.uid() or orders.seller_id = auth.uid())
    )
  );

create policy "Only admins can update disputes"
  on disputes for update using (is_admin());

-- ----- 5.11 ADMIN EVENT LOG -----
create policy "Only admins can view admin log"
  on admin_event_log for select using (is_admin());

create policy "Only admins can insert admin log"
  on admin_event_log for insert with check (is_admin());

-- ----- 5.12 PLATFORM CONFIG -----
create policy "Platform config is publicly readable"
  on platform_config for select using (true);

create policy "Only admins can modify platform config"
  on platform_config for update using (is_admin());

create policy "Only admins can insert platform config"
  on platform_config for insert with check (is_admin());


-- =========================
-- 6. SEED: PLATFORM CONFIG
-- =========================

insert into platform_config (key, value) values
  ('commission_rate', '"10.00"'),
  ('auto_complete_days', '7'),
  ('cancellation_timeout_hours', '24'),
  ('min_listing_price', '500'),
  ('max_images_per_listing', '8'),
  ('supported_grade_companies', '["PSA", "CGC", "Beckett", "TAG", "ARS", "Mana Fix", "BGA", "Capy", "Taverna"]');


-- =========================
-- 7. STORAGE BUCKETS
-- =========================
-- Run these via Supabase Dashboard or supabase CLI, not raw SQL:
--
-- supabase storage create-bucket card-images --public
-- supabase storage create-bucket avatars --public
--
-- Storage policies:
-- card-images: public read, authenticated upload (owner only)
-- avatars: public read, authenticated upload (owner only)
