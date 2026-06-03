-- ============================================
-- Cart infrastructure: address book, shopping cart, purchase groups.
--
-- The marketplace moves from single-listing direct checkout to a cart-based
-- flow where a buyer can hold listings from multiple sellers, then check out
-- in a single payment. This migration introduces the persistent tables; the
-- RPCs that drive cart checkout land in 00018.
--
-- Design notes:
-- * `addresses` is owned by the user (buyer). One row can be marked default
--   via a partial unique index. The legacy `profiles.address_*` columns
--   stay in place for now so existing seller-origin reads (getSellerCep)
--   keep working unchanged.
-- * `cart_items` is the persistent cart. Each (buyer, listing) pair is unique
--   because graded slabs are unique (no quantity).
-- * `purchase_groups` represents a single cart-checkout: one buyer, one
--   delivery address (snapshotted so address edits don't mutate history),
--   one Mercado Pago payment. It links to N orders (one per seller) via
--   `orders.purchase_group_id`.
-- * Orders keep their existing per-listing structure. The new column just
--   tells us which cart purchase produced them; legacy direct-buy orders
--   leave it null.
-- ============================================

-- ----- 1. Address book -----
create table addresses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  label           text not null,                    -- e.g. "Casa", "Trabalho"
  recipient_name  text not null,
  address_line    text not null,
  address_number  text,
  complement      text,
  neighborhood    text,
  city            text not null,
  state           text not null,
  zip             text not null,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_addresses_user on addresses(user_id);

-- Enforce at most one default address per user. Partial unique index allows
-- many rows per user (non-default), but rejects a second `is_default = true`.
create unique index uq_addresses_user_default
  on addresses(user_id)
  where is_default = true;

alter table addresses enable row level security;

-- ----- 2. Shopping cart -----
create table cart_items (
  id          uuid primary key default gen_random_uuid(),
  buyer_id    uuid not null references profiles(id) on delete cascade,
  listing_id  uuid not null references listings(id) on delete cascade,
  added_at    timestamptz not null default now(),
  unique (buyer_id, listing_id)
);

create index idx_cart_items_buyer on cart_items(buyer_id);

alter table cart_items enable row level security;

-- ----- 3. Purchase groups -----
-- One row per cart-checkout payment. Address fields are snapshotted at
-- checkout time so subsequent address edits do not mutate history.
create table purchase_groups (
  id                       uuid primary key default gen_random_uuid(),
  buyer_id                 uuid not null references profiles(id) on delete restrict,

  -- Snapshot of the delivery address chosen at checkout
  delivery_recipient_name  text not null,
  delivery_address_line    text not null,
  delivery_address_number  text,
  delivery_complement      text,
  delivery_neighborhood    text,
  delivery_city            text not null,
  delivery_state           text not null,
  delivery_zip             text not null,

  -- Totals across all orders in the group, in centavos
  items_total              integer not null check (items_total >= 0),
  shipping_total           integer not null default 0 check (shipping_total >= 0),
  insurance_total          integer not null default 0 check (insurance_total >= 0),
  total_amount             integer not null check (total_amount >= 0),

  -- Mercado Pago (single payment for the whole group)
  mp_preference_id         text,
  mp_payment_id            text,

  status                   text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'paid', 'cancelled', 'expired')),
  paid_at                  timestamptz,
  cancelled_at             timestamptz,
  expires_at               timestamptz,                  -- reservation expiry, mirrors order timeout

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index idx_purchase_groups_buyer  on purchase_groups(buyer_id);
create index idx_purchase_groups_status on purchase_groups(status);

alter table purchase_groups enable row level security;

-- ----- 4. Order linkage -----
-- Each order created from a cart checkout points back to its purchase group.
-- Legacy direct-buy orders (pre-cart) leave this null and continue to behave
-- exactly as before.
alter table orders
  add column if not exists purchase_group_id uuid references purchase_groups(id) on delete set null;

create index if not exists idx_orders_purchase_group on orders(purchase_group_id);

-- ----- 5. Row-level security policies -----

-- addresses: only the owner can see or mutate their own address book.
create policy "Users see their own addresses"
  on addresses for select using (auth.uid() = user_id);

create policy "Users insert their own addresses"
  on addresses for insert with check (auth.uid() = user_id);

create policy "Users update their own addresses"
  on addresses for update using (auth.uid() = user_id);

create policy "Users delete their own addresses"
  on addresses for delete using (auth.uid() = user_id);

-- cart_items: only the cart owner.
create policy "Buyers see their own cart"
  on cart_items for select using (auth.uid() = buyer_id);

create policy "Buyers add to their own cart"
  on cart_items for insert with check (auth.uid() = buyer_id);

create policy "Buyers remove from their own cart"
  on cart_items for delete using (auth.uid() = buyer_id);

-- purchase_groups:
--   * The buyer can read and update their own group (e.g. while paying).
--   * Sellers can read a group when they have at least one order in it,
--     because they need the snapshotted delivery address to ship the package.
create policy "Buyers see their own purchase groups"
  on purchase_groups for select using (auth.uid() = buyer_id);

create policy "Sellers see purchase groups containing their orders"
  on purchase_groups for select using (
    exists (
      select 1 from orders
      where orders.purchase_group_id = purchase_groups.id
        and orders.seller_id = auth.uid()
    )
  );

create policy "Buyers update their own purchase groups"
  on purchase_groups for update using (auth.uid() = buyer_id);

-- Inserts to purchase_groups happen only via the cart-checkout RPC (security
-- definer), so no client insert policy is granted here.
