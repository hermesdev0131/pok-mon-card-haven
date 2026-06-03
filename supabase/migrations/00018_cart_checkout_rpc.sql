-- ============================================
-- Cart checkout RPC.
--
-- Atomically converts a buyer's cart into a purchase group plus N orders
-- (one per cart item / one per listing), reserves all the listings, and
-- snapshots the chosen delivery address. Reservation only happens here —
-- the cart itself never locks listings, per the agreed UX.
--
-- The caller (cart page) passes a JSON array describing each seller's
-- shipping choice (method, cost, insurance). The RPC distributes those
-- onto the per-listing orders: shipping/insurance live on the FIRST order
-- of each seller's group; the other orders for that seller carry 0 so the
-- per-order seller_payout math stays clean. The seller's total payout is
-- the sum across their orders.
-- ============================================

create or replace function checkout_cart(
  p_address_id uuid,
  p_seller_shipments jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_address record;
  v_group_id uuid;

  v_items_total integer := 0;
  v_shipping_total integer := 0;
  v_insurance_total integer := 0;

  v_unavailable jsonb := '[]'::jsonb;
  v_seller_first jsonb := '{}'::jsonb;   -- seller_id -> true once first order has been written
  v_shipments jsonb := '{}'::jsonb;      -- seller_id -> {shipping_cost, shipping_method, insurance_opted_in, insurance_cost}

  v_cart record;
  v_listing record;
  v_commission_rate numeric;
  v_platform_fee integer;
  v_seller_payout integer;
  v_shipment jsonb;
  v_is_first boolean;
  v_shipping_cost_for_order integer;
  v_shipping_method_for_order text;
  v_insurance_opted_in_for_order boolean;
  v_insurance_cost_for_order integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Não autenticado');
  end if;

  -- 1. Snapshot the chosen address, validating ownership.
  select id, recipient_name, address_line, address_number, complement,
         neighborhood, city, state, zip
    into v_address
    from addresses
   where id = p_address_id and user_id = v_user_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Endereço inválido');
  end if;

  -- 2. Build a seller_id -> shipment map from the input JSON for fast lookups.
  select coalesce(jsonb_object_agg(s->>'seller_id', s), '{}'::jsonb)
    into v_shipments
    from jsonb_array_elements(p_seller_shipments) as s;

  -- 3. Walk the cart, lock listings, abort with a list of unavailable items
  --    if any listing is no longer 'active'.
  for v_cart in
    select ci.id as cart_item_id, ci.listing_id
      from cart_items ci
     where ci.buyer_id = v_user_id
  loop
    select id, seller_id, price, status
      into v_listing
      from listings
     where id = v_cart.listing_id
     for update;
    if not found or v_listing.status != 'active' then
      v_unavailable := v_unavailable || jsonb_build_array(v_cart.listing_id);
    end if;
  end loop;

  if jsonb_array_length(v_unavailable) > 0 then
    return jsonb_build_object('success', false, 'error', 'Alguns itens não estão mais disponíveis', 'unavailable', v_unavailable);
  end if;

  -- 4. Sum totals from the input shipments so we can write purchase_group up
  --    front, then re-walk cart for per-listing order rows.
  select coalesce(sum((value->>'shipping_cost')::integer), 0),
         coalesce(sum((value->>'insurance_cost')::integer), 0)
    into v_shipping_total, v_insurance_total
    from jsonb_each(v_shipments);

  select coalesce(sum(l.price), 0)
    into v_items_total
    from cart_items ci
    join listings l on l.id = ci.listing_id
   where ci.buyer_id = v_user_id;

  if v_items_total = 0 then
    return jsonb_build_object('success', false, 'error', 'Carrinho vazio');
  end if;

  -- 5. Create the purchase group with snapshotted address.
  insert into purchase_groups (
    buyer_id,
    delivery_recipient_name, delivery_address_line, delivery_address_number,
    delivery_complement, delivery_neighborhood, delivery_city,
    delivery_state, delivery_zip,
    items_total, shipping_total, insurance_total, total_amount,
    status, expires_at
  ) values (
    v_user_id,
    v_address.recipient_name, v_address.address_line, v_address.address_number,
    v_address.complement, v_address.neighborhood, v_address.city,
    v_address.state, v_address.zip,
    v_items_total, v_shipping_total, v_insurance_total,
    v_items_total + v_shipping_total + v_insurance_total,
    'awaiting_payment', now() + interval '20 minutes'
  ) returning id into v_group_id;

  -- 6. Create one order per cart item. Shipping/insurance ride only on the
  --    FIRST order per seller; subsequent orders for that seller get 0 so
  --    the existing seller_payout = price - fee - shipping math stays valid.
  for v_cart in
    select ci.listing_id, l.seller_id, l.price
      from cart_items ci
      join listings l on l.id = ci.listing_id
     where ci.buyer_id = v_user_id
     order by l.seller_id, ci.added_at
  loop
    -- Commission via the seller's tier (mirrors create_order in 00010).
    select st.commission_rate / 100.0
      into v_commission_rate
      from seller_profiles sp
      join seller_tiers st on st.id = sp.tier_id
     where sp.id = v_cart.seller_id;
    if v_commission_rate is null then
      select commission_rate / 100.0 into v_commission_rate
        from seller_tiers where name = 'Bronze';
    end if;
    if v_commission_rate is null then v_commission_rate := 0.11; end if;

    v_platform_fee := round(v_cart.price * v_commission_rate);

    v_shipment := v_shipments->v_cart.seller_id::text;
    v_is_first := not coalesce((v_seller_first->v_cart.seller_id::text)::boolean, false);

    if v_is_first and v_shipment is not null then
      v_shipping_cost_for_order   := coalesce((v_shipment->>'shipping_cost')::integer, 0);
      v_shipping_method_for_order := v_shipment->>'shipping_method';
      v_insurance_opted_in_for_order := coalesce((v_shipment->>'insurance_opted_in')::boolean, false);
      v_insurance_cost_for_order  := coalesce((v_shipment->>'insurance_cost')::integer, 0);
    else
      v_shipping_cost_for_order   := 0;
      v_shipping_method_for_order := null;
      v_insurance_opted_in_for_order := false;
      v_insurance_cost_for_order  := 0;
    end if;

    -- Seller payout for this order. Per-method free shipping deduction
    -- applies only to the first order of the seller (the one carrying the
    -- real shipping cost).
    v_seller_payout := v_cart.price - v_platform_fee;
    if v_is_first and v_shipping_method_for_order is not null then
      declare v_listing_free record;
      begin
        select free_shipping_pac, free_shipping_sedex
          into v_listing_free
          from listings where id = v_cart.listing_id;
        if (upper(v_shipping_method_for_order) = 'PAC' and v_listing_free.free_shipping_pac)
           or (upper(v_shipping_method_for_order) = 'SEDEX' and v_listing_free.free_shipping_sedex) then
          v_seller_payout := v_seller_payout - v_shipping_cost_for_order;
        end if;
      end;
    end if;

    insert into orders (
      listing_id, buyer_id, seller_id, price,
      shipping_cost, shipping_method,
      insurance_opted_in, insurance_cost,
      platform_fee, seller_payout,
      purchase_group_id, status
    ) values (
      v_cart.listing_id, v_user_id, v_cart.seller_id, v_cart.price,
      v_shipping_cost_for_order, v_shipping_method_for_order,
      v_insurance_opted_in_for_order, v_insurance_cost_for_order,
      v_platform_fee, v_seller_payout,
      v_group_id, 'awaiting_payment'
    );

    update listings set status = 'reserved' where id = v_cart.listing_id;

    v_seller_first := v_seller_first || jsonb_build_object(v_cart.seller_id::text, true);
  end loop;

  -- 7. Empty the cart.
  delete from cart_items where buyer_id = v_user_id;

  return jsonb_build_object('success', true, 'purchase_group_id', v_group_id);
end;
$$;
