-- ============================================
-- Per-method free shipping.
--
-- Replaces the single `listings.free_shipping` boolean with two per-method
-- flags so a seller can offer free PAC, free SEDEX, both, or neither.
-- Records the buyer's chosen shipping method on the order so the payout RPC
-- can decide whether to deduct the shipping cost from the seller's payout
-- (only when the chosen method was marked free).
--
-- The legacy `listings.free_shipping` column is kept and continues to mean
-- "any method is free" so existing read paths (badges, listing rows, sales
-- breakdown) keep working without simultaneous code changes everywhere. New
-- writes mirror it from the per-method flags.
-- ============================================

-- 1. New per-method flags on listings.
alter table listings
  add column if not exists free_shipping_pac   boolean not null default false,
  add column if not exists free_shipping_sedex boolean not null default false;

-- Backfill: anything previously marked free_shipping=true should be free on both
-- methods, so existing listings behave identically to before this migration.
update listings
   set free_shipping_pac = true,
       free_shipping_sedex = true
 where free_shipping = true;

-- 2. Chosen shipping method on the order. Nullable until the buyer picks one.
alter table orders
  add column if not exists shipping_method text;

-- 3. Replace the payout RPC. New behavior:
--    * Read both per-method flags AND the chosen method.
--    * Deduct shipping from seller_payout ONLY when the chosen method was free.
--    * For backwards compatibility, if p_shipping_method is null, fall back to
--      the old "any free" rule using the legacy free_shipping column so any
--      caller that hasn't been updated yet doesn't regress.
create or replace function update_order_shipping(
  p_order_id        uuid,
  p_shipping_cost   integer,
  p_shipping_method text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_order record;
  v_listing record;
  v_seller_pays boolean;
  v_new_seller_payout integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Não autenticado');
  end if;
  if p_shipping_cost < 0 then
    return jsonb_build_object('success', false, 'error', 'Valor de frete inválido');
  end if;

  select id, buyer_id, listing_id, price, platform_fee, status
    into v_order
    from orders
   where id = p_order_id
   for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Pedido não encontrado');
  end if;
  if v_order.buyer_id != v_user_id then
    return jsonb_build_object('success', false, 'error', 'Operação não autorizada');
  end if;
  if v_order.status != 'awaiting_payment' then
    return jsonb_build_object('success', false, 'error', 'Pedido não está aguardando pagamento');
  end if;

  select free_shipping, free_shipping_pac, free_shipping_sedex
    into v_listing
    from listings
   where id = v_order.listing_id;

  -- Decide whether the seller pays for this specific shipment.
  if p_shipping_method is not null then
    if upper(p_shipping_method) = 'PAC' then
      v_seller_pays := coalesce(v_listing.free_shipping_pac, false);
    elsif upper(p_shipping_method) = 'SEDEX' then
      v_seller_pays := coalesce(v_listing.free_shipping_sedex, false);
    else
      -- Unknown method (e.g. flat-rate fallback): seller doesn't pay
      v_seller_pays := false;
    end if;
  else
    -- Legacy callers: fall back to the old "any free" rule
    v_seller_pays := coalesce(v_listing.free_shipping, false);
  end if;

  if v_seller_pays then
    v_new_seller_payout := v_order.price - v_order.platform_fee - p_shipping_cost;
    if v_new_seller_payout < 0 then
      return jsonb_build_object(
        'success', false,
        'error', 'Frete excede o valor do vendedor (preço − comissão). Vendedor não pode cobrir este envio.'
      );
    end if;
    update orders
       set shipping_cost = p_shipping_cost,
           shipping_method = p_shipping_method,
           seller_payout = v_new_seller_payout
     where id = p_order_id;
  else
    update orders
       set shipping_cost = p_shipping_cost,
           shipping_method = p_shipping_method
     where id = p_order_id;
  end if;

  return jsonb_build_object('success', true);
end;
$$;
