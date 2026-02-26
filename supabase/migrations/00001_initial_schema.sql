-- ============================================================
-- GradedBR Marketplace — Initial Schema
-- Supabase (PostgreSQL 15+)
-- ============================================================
-- Prices stored as INTEGER in centavos (R$150.00 = 15000)
-- UUIDs for all primary keys
-- RLS enabled on every table
-- Safe to re-run: drops all objects first
-- ============================================================

-- =========================
-- 0. CLEANUP (safe re-run)
-- =========================
-- Drop tables in reverse dependency order
drop table if exists platform_config cascade;
drop table if exists admin_event_log cascade;
drop table if exists disputes cascade;
drop table if exists messages cascade;
drop table if exists questions cascade;
drop table if exists reviews cascade;
drop table if exists confirmed_sales cascade;
drop table if exists orders cascade;
drop table if exists listings cascade;
drop table if exists card_bases cascade;
drop table if exists seller_profiles cascade;
drop table if exists profiles cascade;
drop table if exists grade_companies cascade;
drop table if exists card_types cascade;

-- Drop enums (including legacy ones from previous schema versions)
drop type if exists dispute_status;
drop type if exists order_status;
drop type if exists listing_status;
drop type if exists grade_company;
drop type if exists card_type;

-- Drop functions
drop function if exists handle_updated_at() cascade;
drop function if exists handle_new_user() cascade;
drop function if exists prevent_confirmed_sale_mutation() cascade;
drop function if exists recalculate_seller_rating() cascade;
drop function if exists increment_seller_sales() cascade;
drop function if exists is_admin() cascade;

-- =========================
-- 1. EXTENSIONS
-- =========================
create extension if not exists "pgcrypto";
create extension if not exists "moddatetime";

-- =========================
-- 2. CUSTOM TYPES (ENUMS)
-- =========================
-- Only internal system states are enums. Domain data uses lookup tables (see section 3).

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

-- ----- 3.1 LOOKUP: CARD TYPES -----
-- Pokemon energy types. Lookup table instead of enum so admins can add/edit without migrations.
create table card_types (
  code        text primary key,               -- 'fire', 'electric', etc.
  label       text not null,                  -- display name: 'Fogo', 'Elétrico'
  color       text,                           -- hex or tailwind class for UI
  sort_order  smallint not null default 0
);

alter table card_types enable row level security;

-- ----- 3.2 LOOKUP: GRADE COMPANIES -----
-- Grading companies. Lookup table so new companies can be added via admin panel.
create table grade_companies (
  code        text primary key,               -- 'PSA', 'CGC', etc.
  name        text not null,                  -- full name: 'Professional Sports Authenticator'
  logo_url    text,
  website     text,
  active      boolean not null default true,
  sort_order  smallint not null default 0
);

alter table grade_companies enable row level security;

-- ----- 3.3 PROFILES -----
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

-- ----- 3.4 SELLER PROFILES -----
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

-- ----- 3.5 CARD BASES -----
-- Normalized card data — the Pokemon card itself, not a specific graded copy.
-- Unique constraint on (set_code, number) prevents duplicates.
create table card_bases (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,               -- "Charizard VMAX"
  set_name        text not null,               -- "Shiny Star V"
  set_code        text not null,               -- "SSV"
  number          text not null,               -- "307/190"
  type            text not null default 'normal' references card_types(code),
  rarity          text,                        -- "Secret Rare", "Alt Art", etc.
  image_url       text,                        -- official card image
  language_group  text not null default 'INT'  -- 'INT' = EN/PT (same sets), 'JP' = Japanese (own sets)
                  check (language_group in ('INT', 'JP')),
  created_at      timestamptz not null default now(),

  unique (set_code, number)
);

alter table card_bases enable row level security;

-- ----- 3.6 LISTINGS -----
-- A specific graded card copy listed for sale.
create table listings (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references profiles(id) on delete cascade,
  card_base_id    uuid not null references card_bases(id) on delete restrict,
  grade           numeric(3,1) not null check (grade >= 1 and grade <= 10),  -- 1.0 to 10.0
  grade_company   text not null references grade_companies(code),
  pristine        boolean not null default false,  -- Pristine 10 (CGC, TAG, Beckett)
  cert_number     text,                    -- grading certificate number
  language        text not null default 'PT' check (language in ('PT', 'EN', 'JP')),
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

-- ----- 3.7 ORDERS -----
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

-- ----- 3.8 CONFIRMED SALES -----
-- IMMUTABLE record created when order reaches COMPLETED.
-- Powers the price history charts. No UPDATE or DELETE allowed.
create table confirmed_sales (
  id              uuid primary key default gen_random_uuid(),
  card_base_id    uuid not null references card_bases(id) on delete restrict,
  order_id        uuid not null references orders(id) on delete restrict,
  buyer_id        uuid not null references profiles(id) on delete restrict,
  seller_id       uuid not null references profiles(id) on delete restrict,
  grade           numeric(3,1) not null,
  grade_company   text not null references grade_companies(code),
  pristine        boolean not null default false,  -- Pristine 10 (CGC, TAG, Beckett)
  language        text not null default 'PT' check (language in ('PT', 'EN', 'JP')),
  sale_price      integer not null,             -- centavos
  sold_at         timestamptz not null,
  created_at      timestamptz not null default now(),

  constraint uq_confirmed_sales_order unique (order_id)
);

create index idx_confirmed_sales_card    on confirmed_sales(card_base_id);
create index idx_confirmed_sales_grade   on confirmed_sales(grade);
create index idx_confirmed_sales_sold_at on confirmed_sales(sold_at desc);

alter table confirmed_sales enable row level security;

-- ----- 3.9 REVIEWS -----
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

-- ----- 3.10 QUESTIONS -----
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

-- ----- 3.11 MESSAGES -----
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

-- ----- 3.12 DISPUTES -----
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

-- ----- 3.13 ADMIN EVENT LOG -----
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

-- ----- 3.14 PLATFORM CONFIG -----
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

-- ----- 5.1 CARD TYPES -----
create policy "Card types are publicly readable"
  on card_types for select using (true);

create policy "Only admins can manage card types"
  on card_types for all using (is_admin());

-- ----- 5.2 GRADE COMPANIES -----
create policy "Grade companies are publicly readable"
  on grade_companies for select using (true);

create policy "Only admins can manage grade companies"
  on grade_companies for all using (is_admin());

-- ----- 5.3 PROFILES -----
create policy "Profiles are publicly readable"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- ----- 5.4 SELLER PROFILES -----
create policy "Seller profiles are publicly readable"
  on seller_profiles for select using (true);

create policy "Sellers can update own profile"
  on seller_profiles for update using (auth.uid() = id);

create policy "Users can create their own seller profile"
  on seller_profiles for insert with check (auth.uid() = id);

-- ----- 5.5 CARD BASES -----
create policy "Card bases are publicly readable"
  on card_bases for select using (true);

create policy "Only admins can insert card bases"
  on card_bases for insert with check (is_admin());

create policy "Only admins can update card bases"
  on card_bases for update using (is_admin());

-- ----- 5.6 LISTINGS -----
create policy "Active listings are publicly readable"
  on listings for select using (true);

create policy "Sellers can create own listings"
  on listings for insert with check (auth.uid() = seller_id);

create policy "Sellers can update own listings"
  on listings for update using (auth.uid() = seller_id);

-- ----- 5.7 ORDERS -----
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

-- ----- 5.8 CONFIRMED SALES -----
create policy "Confirmed sales are publicly readable"
  on confirmed_sales for select using (true);

-- Insert only via server (service_role key) — no client insert policy
-- UPDATE and DELETE blocked by trigger

-- ----- 5.9 REVIEWS -----
create policy "Reviews are publicly readable"
  on reviews for select using (true);

create policy "Buyers can create reviews for their orders"
  on reviews for insert with check (auth.uid() = buyer_id);

create policy "Sellers can reply to reviews"
  on reviews for update using (auth.uid() = seller_id);

-- ----- 5.10 QUESTIONS -----
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

-- ----- 5.11 MESSAGES -----
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

-- ----- 5.12 DISPUTES -----
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

-- ----- 5.13 ADMIN EVENT LOG -----
create policy "Only admins can view admin log"
  on admin_event_log for select using (is_admin());

create policy "Only admins can insert admin log"
  on admin_event_log for insert with check (is_admin());

-- ----- 5.14 PLATFORM CONFIG -----
create policy "Platform config is publicly readable"
  on platform_config for select using (true);

create policy "Only admins can modify platform config"
  on platform_config for update using (is_admin());

create policy "Only admins can insert platform config"
  on platform_config for insert with check (is_admin());


-- =========================
-- 6. SEED: PLATFORM CONFIG
-- =========================

-- 6.1 Card Types
insert into card_types (code, label, color, sort_order) values
  ('fire',      'Fogo',       '#f97316', 1),
  ('water',     'Água',       '#3b82f6', 2),
  ('grass',     'Planta',     '#22c55e', 3),
  ('electric',  'Elétrico',   '#eab308', 4),
  ('psychic',   'Psíquico',   '#ec4899', 5),
  ('fighting',  'Lutador',    '#b45309', 6),
  ('dark',      'Sombrio',    '#6366f1', 7),
  ('steel',     'Metálico',   '#94a3b8', 8),
  ('dragon',    'Dragão',     '#06b6d4', 9),
  ('fairy',     'Fada',       '#f472b6', 10),
  ('ghost',     'Fantasma',   '#8b5cf6', 11),
  ('flying',    'Voador',     '#67e8f9', 12),
  ('normal',    'Normal',     '#a8a29e', 13),
  ('colorless', 'Incolor',    '#d4d4d4', 14);

-- 6.2 Grade Companies
insert into grade_companies (code, name, logo_url, website, active, sort_order) values
  ('PSA',      'Professional Sports Authenticator', null, 'https://www.psacard.com',        true, 1),
  ('CGC',      'Certified Guaranty Company',        null, 'https://www.cgccards.com',       true, 2),
  ('Beckett',  'Beckett Grading Services',          null, 'https://www.beckett.com/grading', true, 3),
  ('TAG',      'TAG Grading',                       null, 'https://www.taggrading.com.br',  true, 4),
  ('ARS',      'ARS Grading',                       null, 'https://www.arsgrading.com.br',  true, 5),
  ('Mana Fix', 'Mana Fix Grading',                  null, null,                              true, 6),
  ('BGA',      'BGA Grading',                       null, null,                              true, 7),
  ('Capy',     'Capy Grading',                      null, null,                              true, 8),
  ('Taverna',  'Taverna Grading',                    null, null,                              true, 9);

-- 6.3 Platform Config
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
