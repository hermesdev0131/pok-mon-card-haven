-- ============================================
-- Bug fix: when a listing has free_shipping = true, the seller is supposed
-- to pay the shipping cost (deducted from their payout). The previous code
-- updated orders.shipping_cost when the buyer entered their CEP, but never
-- recalculated seller_payout, so the shipping amount disappeared.
--
-- This migration adds an atomic RPC update_order_shipping(order_id, shipping_cost)
-- that updates both fields together inside a single transaction.
-- ============================================

create or replace function update_order_shipping(
  p_order_id uuid,
  p_shipping_cost integer
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
  v_new_seller_payout integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Não autenticado');
  end if;
  if p_shipping_cost < 0 then
    return jsonb_build_object('success', false, 'error', 'Valor de frete inválido');
  end if;

  -- Lock the order row and verify the buyer is acting on their own order in the right status
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

  -- Look up the listing to see who pays shipping
  select free_shipping into v_listing from listings where id = v_order.listing_id;

  if v_listing.free_shipping then
    -- Seller absorbs the shipping: deduct from their payout
    v_new_seller_payout := v_order.price - v_order.platform_fee - p_shipping_cost;
    if v_new_seller_payout < 0 then
      return jsonb_build_object(
        'success', false,
        'error', 'Frete excede o valor do vendedor (preço − comissão). Vendedor não pode cobrir este envio.'
      );
    end if;
    update orders
       set shipping_cost = p_shipping_cost,
           seller_payout = v_new_seller_payout
     where id = p_order_id;
  else
    -- Buyer pays shipping on top of the price; seller_payout is unaffected
    update orders
       set shipping_cost = p_shipping_cost
     where id = p_order_id;
  end if;

  return jsonb_build_object('success', true);
end;
$$;
