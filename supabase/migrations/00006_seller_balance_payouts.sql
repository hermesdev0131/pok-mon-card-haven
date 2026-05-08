-- ============================================
-- Items 2.9 (Saldo) + 2.10 (Dados PIX)
-- Seller balance, PIX details, and withdrawal flow
-- ============================================

-- ===== 0. CLEANUP (safe re-run) =====
-- Drop existing objects so this migration can be re-applied cleanly.

drop view  if exists seller_balance cascade;
drop table if exists withdrawals cascade;
drop table if exists seller_pix cascade;
drop table if exists admin_settings cascade;
drop type  if exists withdrawal_status cascade;
drop type  if exists pix_status cascade;
drop type  if exists pix_key_type cascade;

-- ===== 1. ADMIN SETTINGS =====
-- Single-row table for global configuration (commission rate, withdrawal fee, etc.)

create table if not exists admin_settings (
  id                          integer primary key default 1 check (id = 1),
  default_commission_rate     numeric(5,4) not null default 0.05,   -- 5%
  withdrawal_fee_centavos     integer not null default 1000,        -- R$ 10.00
  updated_at                  timestamptz not null default now()
);

-- Seed the single settings row
insert into admin_settings (id, default_commission_rate, withdrawal_fee_centavos)
values (1, 0.05, 1000)
on conflict (id) do nothing;

alter table admin_settings enable row level security;

-- Anyone can read; only admins can write (enforced via policies)
create policy "Settings readable by all" on admin_settings for select using (true);
create policy "Settings writable by admin only" on admin_settings for update using (is_admin());

-- ===== 2. SELLER PIX DETAILS =====
-- Stores each seller's PIX key. First key trusted; changes require admin approval.

create type pix_key_type as enum ('cpf', 'cnpj', 'email', 'phone', 'random');
create type pix_status   as enum ('active', 'pending_approval');

create table if not exists seller_pix (
  seller_id           uuid primary key references seller_profiles(id) on delete cascade,
  pix_key             text not null,
  pix_key_type        pix_key_type not null,
  status              pix_status not null default 'active',
  pending_pix_key     text,                 -- new key awaiting admin approval
  pending_pix_key_type pix_key_type,
  rejected_reason     text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table seller_pix enable row level security;

create policy "Seller can read own PIX" on seller_pix for select
  using (seller_id = auth.uid() or is_admin());
create policy "Seller can insert own PIX" on seller_pix for insert
  with check (seller_id = auth.uid());
create policy "Seller can update own PIX" on seller_pix for update
  using (seller_id = auth.uid() or is_admin());

-- ===== 3. WITHDRAWALS =====
-- Tracks each withdrawal request from a seller

create type withdrawal_status as enum ('pending', 'completed', 'rejected');

create table if not exists withdrawals (
  id                  uuid primary key default gen_random_uuid(),
  seller_id           uuid not null references seller_profiles(id) on delete restrict,
  amount_requested_centavos  integer not null check (amount_requested_centavos > 0),
  fee_centavos        integer not null default 0,
  amount_paid_centavos integer not null,    -- amount_requested - fee
  pix_key             text not null,        -- snapshot at time of request
  pix_key_type        pix_key_type not null,
  status              withdrawal_status not null default 'pending',
  requested_at        timestamptz not null default now(),
  processed_at        timestamptz,
  rejected_reason     text,
  admin_notes         text
);

create index idx_withdrawals_seller on withdrawals(seller_id);
create index idx_withdrawals_status on withdrawals(status);
create index idx_withdrawals_requested on withdrawals(requested_at desc);

alter table withdrawals enable row level security;

create policy "Seller can read own withdrawals" on withdrawals for select
  using (seller_id = auth.uid() or is_admin());
create policy "Seller can request withdrawals" on withdrawals for insert
  with check (seller_id = auth.uid());
create policy "Admin can update withdrawals" on withdrawals for update
  using (is_admin());

-- ===== 4. UPDATE create_order TO USE 5% COMMISSION FROM SETTINGS =====
-- Replaces the old hardcoded 10% with the configurable rate from admin_settings.

create or replace function create_order(p_listing_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_listing record;
  v_commission_rate numeric;
  v_platform_fee integer;
  v_seller_payout integer;
  v_order_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Não autenticado');
  end if;

  select id, seller_id, price, status
    into v_listing from listings where id = p_listing_id for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Anúncio não encontrado');
  end if;
  if v_listing.status != 'active' then
    return jsonb_build_object('success', false, 'error', 'Este anúncio não está mais disponível');
  end if;
  if v_listing.seller_id = v_user_id then
    return jsonb_build_object('success', false, 'error', 'Você não pode comprar seu próprio anúncio');
  end if;

  -- Read configurable commission rate (default 5%)
  select default_commission_rate into v_commission_rate from admin_settings where id = 1;
  if v_commission_rate is null then
    v_commission_rate := 0.05;
  end if;

  v_platform_fee := round(v_listing.price * v_commission_rate);
  v_seller_payout := v_listing.price - v_platform_fee;

  insert into orders (listing_id, buyer_id, seller_id, price, shipping_cost, platform_fee, seller_payout, status)
  values (p_listing_id, v_user_id, v_listing.seller_id, v_listing.price, 0, v_platform_fee, v_seller_payout, 'awaiting_payment')
  returning id into v_order_id;

  update listings set status = 'reserved' where id = p_listing_id;

  return jsonb_build_object('success', true, 'orderId', v_order_id);
exception
  when unique_violation then
    return jsonb_build_object('success', false, 'error', 'Este anúncio já foi vendido');
end;
$$;

-- ===== 5. SELLER BALANCE VIEW (for fast reads) =====
-- Available = sum of seller_payout from completed orders not yet withdrawn
-- Pending   = sum of seller_payout from paid/shipped/delivered orders (still in escrow)

create or replace view seller_balance as
select
  sp.id as seller_id,
  -- Pending: paid but not yet completed
  coalesce(
    (select sum(o.seller_payout) from orders o
     where o.seller_id = sp.id
       and o.status in ('payment_confirmed', 'awaiting_shipment', 'shipped', 'delivered')),
    0
  ) as pending_centavos,
  -- Available: completed orders minus already-paid-out withdrawals
  greatest(
    coalesce(
      (select sum(o.seller_payout) from orders o
       where o.seller_id = sp.id and o.status = 'completed'),
      0
    )
    - coalesce(
      (select sum(w.amount_requested_centavos) from withdrawals w
       where w.seller_id = sp.id and w.status in ('pending', 'completed')),
      0
    ),
    0
  ) as available_centavos
from seller_profiles sp;

-- ===== 6. AUTO-UPDATE updated_at TIMESTAMPS =====

create trigger trg_admin_settings_updated_at
  before update on admin_settings
  for each row execute function handle_updated_at();

create trigger trg_seller_pix_updated_at
  before update on seller_pix
  for each row execute function handle_updated_at();
