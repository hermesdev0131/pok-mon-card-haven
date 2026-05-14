-- ============================================
-- Seller commission tiers (Bronze / Prata / Ouro)
-- - Quarterly evaluation, calendar quarters
-- - Promotions are immediate mid-quarter when threshold is crossed
-- - Demotions happen at quarter end (manual in this phase, automated in Phase 2)
-- - Optional tier_locked flag pins a seller to their current tier
-- ============================================

-- ===== 0. CLEANUP (safe re-run) =====
drop view  if exists seller_quarterly_sales cascade;
drop trigger if exists trg_orders_completed_promote on orders;
drop trigger if exists trg_orders_set_completed_at on orders;
drop trigger if exists trg_seller_profiles_default_tier on seller_profiles;
drop function if exists promote_seller_if_eligible(uuid) cascade;
drop function if exists handle_order_completed_promotion() cascade;
drop function if exists fn_set_completed_at() cascade;
drop function if exists fn_default_seller_tier() cascade;

-- ===== 1. TIER DEFINITIONS =====
create table if not exists seller_tiers (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null unique,                     -- 'Bronze', 'Prata', 'Ouro'
  display_order           integer not null unique,                  -- 1=lowest, higher=better
  commission_rate         numeric(5,2) not null check (commission_rate >= 0 and commission_rate <= 100),
  min_quarterly_centavos  integer not null default 0 check (min_quarterly_centavos >= 0),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table seller_tiers enable row level security;

create policy "Tiers readable by all" on seller_tiers for select using (true);
create policy "Tiers writable by admin only" on seller_tiers for update using (is_admin());
create policy "Tiers insertable by admin only" on seller_tiers for insert with check (is_admin());
create policy "Tiers deletable by admin only" on seller_tiers for delete using (is_admin());

create trigger trg_seller_tiers_updated_at
  before update on seller_tiers
  for each row execute function handle_updated_at();

-- Seed: Bronze (default), Prata, Ouro. Idempotent on name.
insert into seller_tiers (name, display_order, commission_rate, min_quarterly_centavos) values
  ('Bronze', 1, 11.00,       0),       -- 0% threshold; default
  ('Prata',  2,  9.00, 2000000),       -- R$ 20.000,00
  ('Ouro',   3,  7.00, 7000000)        -- R$ 70.000,00
on conflict (name) do nothing;

-- ===== 2. SELLER TIER ASSIGNMENT =====
alter table seller_profiles
  add column if not exists tier_id          uuid references seller_tiers(id),
  add column if not exists tier_locked      boolean not null default false,
  add column if not exists tier_assigned_at timestamptz default now(),
  add column if not exists tier_assigned_by uuid references auth.users(id);

-- Default tier_id to Bronze on insert if the application didn't set it
create or replace function fn_default_seller_tier()
returns trigger
language plpgsql
as $$
begin
  if NEW.tier_id is null then
    select id into NEW.tier_id from seller_tiers where name = 'Bronze' limit 1;
  end if;
  return NEW;
end;
$$;

create trigger trg_seller_profiles_default_tier
  before insert on seller_profiles
  for each row execute function fn_default_seller_tier();

-- Backfill: any existing seller without a tier becomes Bronze
update seller_profiles
   set tier_id = (select id from seller_tiers where name = 'Bronze')
 where tier_id is null;

create index if not exists idx_seller_profiles_tier on seller_profiles(tier_id);

-- ===== 3. AUTO-FILL orders.completed_at =====
-- Some code paths transition an order to 'completed' without setting completed_at.
-- This BEFORE trigger guarantees the timestamp is populated for every transition,
-- which is what the quarterly volume view depends on.

create or replace function fn_set_completed_at()
returns trigger
language plpgsql
as $$
begin
  if NEW.status = 'completed'
     and (OLD.status is null or OLD.status != 'completed')
     and NEW.completed_at is null then
    NEW.completed_at := now();
  end if;
  return NEW;
end;
$$;

create trigger trg_orders_set_completed_at
  before insert or update of status on orders
  for each row execute function fn_set_completed_at();

-- Backfill: historical 'completed' orders missing completed_at get updated_at
update orders
   set completed_at = updated_at
 where status = 'completed' and completed_at is null;

-- ===== 4. QUARTERLY VOLUME VIEW =====
-- Sums completed-order volume per seller for the CURRENT calendar quarter.
-- Refunded orders are naturally excluded since their status moves to 'refunded'.
-- Falls back to updated_at if completed_at is somehow null (defensive).
create or replace view seller_quarterly_sales as
select
  sp.id                                                       as seller_id,
  date_trunc('quarter', current_date)                         as quarter_start,
  date_trunc('quarter', current_date) + interval '3 months'   as quarter_end,
  coalesce(sum(o.price), 0)::integer                          as quarter_volume_centavos
from seller_profiles sp
left join orders o
  on o.seller_id = sp.id
 and o.status = 'completed'
 and coalesce(o.completed_at, o.updated_at) >= date_trunc('quarter', current_date)
 and coalesce(o.completed_at, o.updated_at) <  date_trunc('quarter', current_date) + interval '3 months'
group by sp.id;

-- ===== 5. MID-QUARTER PROMOTION =====
-- When an order completes, check if the seller's cumulative quarter volume
-- now meets a higher tier's threshold. If so, promote them.
-- Locked sellers are never auto-promoted (admin controls them).

create or replace function promote_seller_if_eligible(p_seller_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locked          boolean;
  v_current_order   integer;
  v_current_tier    uuid;
  v_quarter_volume  integer;
  v_eligible_tier   uuid;
begin
  -- Read current tier + lock flag
  select sp.tier_id, sp.tier_locked, st.display_order
    into v_current_tier, v_locked, v_current_order
    from seller_profiles sp
    left join seller_tiers st on st.id = sp.tier_id
   where sp.id = p_seller_id;

  if v_locked then return; end if;
  if v_current_order is null then v_current_order := 0; end if;

  -- Current calendar quarter volume (completed orders only)
  select quarter_volume_centavos
    into v_quarter_volume
    from seller_quarterly_sales
   where seller_id = p_seller_id;

  if v_quarter_volume is null then v_quarter_volume := 0; end if;

  -- Highest tier whose threshold the seller meets, ABOVE their current tier.
  select id
    into v_eligible_tier
    from seller_tiers
   where display_order > v_current_order
     and min_quarterly_centavos <= v_quarter_volume
   order by display_order desc
   limit 1;

  if v_eligible_tier is not null then
    update seller_profiles
       set tier_id = v_eligible_tier,
           tier_assigned_at = now(),
           tier_assigned_by = null     -- system-assigned
     where id = p_seller_id;
  end if;
end;
$$;

-- Trigger: fire on order completion (status transitions to 'completed')
create or replace function handle_order_completed_promotion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT' and NEW.status = 'completed')
     or (TG_OP = 'UPDATE' and NEW.status = 'completed' and OLD.status is distinct from 'completed') then
    perform promote_seller_if_eligible(NEW.seller_id);
  end if;
  return NEW;
end;
$$;

create trigger trg_orders_completed_promote
  after insert or update of status on orders
  for each row execute function handle_order_completed_promotion();

-- ===== 6. UPDATE create_order TO USE SELLER'S TIER RATE =====
-- Replaces the previous logic that read from admin_settings.default_commission_rate.
-- Falls back to the Bronze rate if a seller somehow has no tier (shouldn't happen
-- after backfill + default-tier trigger, but defensive).

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

  -- Commission rate from seller's current tier (percentage, e.g. 11.00)
  select st.commission_rate / 100.0
    into v_commission_rate
    from seller_profiles sp
    join seller_tiers st on st.id = sp.tier_id
   where sp.id = v_listing.seller_id;

  -- Defensive fallback: Bronze rate if seller has no tier
  if v_commission_rate is null then
    select commission_rate / 100.0 into v_commission_rate
      from seller_tiers where name = 'Bronze';
  end if;
  if v_commission_rate is null then
    v_commission_rate := 0.11;
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

-- ===== 7. DROP ORPHANED COLUMN =====
-- admin_settings.default_commission_rate is no longer read by create_order
-- (the seller's tier rate is used instead). Drop it to avoid future confusion.

alter table admin_settings drop column if exists default_commission_rate;
