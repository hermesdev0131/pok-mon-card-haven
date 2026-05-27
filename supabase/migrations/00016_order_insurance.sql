-- ============================================
-- Shipping insurance opt-in at checkout.
--
-- Records whether the buyer added Correios's package insurance and the
-- accurate insurance fee returned by Melhor Envio (declared value = listing
-- price). Insurance is always paid by the buyer, even when the seller offers
-- "free shipping" for the chosen method — so it stays out of the payout math.
-- ============================================

-- 1. Per-order insurance columns.
alter table orders
  add column if not exists insurance_opted_in boolean not null default false,
  add column if not exists insurance_cost     integer not null default 0
    check (insurance_cost >= 0);

-- 2. Extend the shipping-update RPC so the checkout can write the chosen
--    method, the base shipping cost, and the insurance choice in one atomic
--    transaction. Seller payout still only deducts the BASE shipping cost
--    (never insurance) and only when the chosen method was marked free.
create or replace function update_order_shipping(
  p_order_id          uuid,
  p_shipping_cost     integer,
  p_shipping_method   text    default null,
  p_insurance_cost    integer default 0,
  p_insurance_opted_in boolean default false
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
  if p_insurance_cost < 0 then
    return jsonb_build_object('success', false, 'error', 'Valor de seguro inválido');
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

  if p_shipping_method is not null then
    if upper(p_shipping_method) = 'PAC' then
      v_seller_pays := coalesce(v_listing.free_shipping_pac, false);
    elsif upper(p_shipping_method) = 'SEDEX' then
      v_seller_pays := coalesce(v_listing.free_shipping_sedex, false);
    else
      v_seller_pays := false;
    end if;
  else
    v_seller_pays := coalesce(v_listing.free_shipping, false);
  end if;

  if v_seller_pays then
    -- Insurance is buyer's choice; never deduct it from seller_payout.
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
           insurance_opted_in = p_insurance_opted_in,
           insurance_cost = p_insurance_cost,
           seller_payout = v_new_seller_payout
     where id = p_order_id;
  else
    update orders
       set shipping_cost = p_shipping_cost,
           shipping_method = p_shipping_method,
           insurance_opted_in = p_insurance_opted_in,
           insurance_cost = p_insurance_cost
     where id = p_order_id;
  end if;

  return jsonb_build_object('success', true);
end;
$$;
