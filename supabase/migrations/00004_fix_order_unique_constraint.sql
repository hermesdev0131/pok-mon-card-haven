-- ============================================================
-- Fix 1: Replace blanket unique constraint with partial index
-- Allows re-purchase after cancellation
-- ============================================================

-- Try both possible constraint names (migration-defined vs auto-generated)
DO $$
BEGIN
  -- Try the name from the migration file
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS uq_orders_listing;
  -- Try Postgres auto-generated name
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_listing_id_key;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_listing_active
  ON orders(listing_id)
  WHERE status != 'cancelled';

-- ============================================================
-- Fix 2: Atomic create_order function (SECURITY DEFINER)
-- Bypasses RLS so buyer can reserve the listing atomically
-- ============================================================

CREATE OR REPLACE FUNCTION create_order(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_listing record;
  v_platform_fee integer;
  v_seller_payout integer;
  v_order_id uuid;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autenticado');
  END IF;

  -- Fetch and lock the listing (FOR UPDATE prevents race conditions)
  SELECT id, seller_id, price, status
    INTO v_listing
    FROM listings
    WHERE id = p_listing_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Anúncio não encontrado');
  END IF;

  IF v_listing.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este anúncio não está mais disponível');
  END IF;

  IF v_listing.seller_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode comprar seu próprio anúncio');
  END IF;

  -- Calculate fees
  v_platform_fee := ROUND(v_listing.price * 0.10);
  v_seller_payout := v_listing.price - v_platform_fee;

  -- Create the order
  INSERT INTO orders (listing_id, buyer_id, seller_id, price, shipping_cost, platform_fee, seller_payout, status)
  VALUES (p_listing_id, v_user_id, v_listing.seller_id, v_listing.price, 0, v_platform_fee, v_seller_payout, 'awaiting_payment')
  RETURNING id INTO v_order_id;

  -- Reserve the listing (same transaction, bypasses RLS)
  UPDATE listings SET status = 'reserved' WHERE id = p_listing_id;

  RETURN jsonb_build_object('success', true, 'orderId', v_order_id);

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este anúncio já foi vendido');
END;
$$;

-- ============================================================
-- Fix 3: Atomic cancel_order function (SECURITY DEFINER)
-- Bypasses RLS so buyer can unlock the listing atomically
-- ============================================================

CREATE OR REPLACE FUNCTION cancel_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_order record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autenticado');
  END IF;

  SELECT id, listing_id, buyer_id, status
    INTO v_order
    FROM orders
    WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;

  IF v_order.buyer_id != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão');
  END IF;

  IF v_order.status != 'awaiting_payment' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não pode ser cancelado');
  END IF;

  -- Cancel the order
  UPDATE orders
    SET status = 'cancelled',
        cancelled_at = now(),
        cancellation_reason = 'Cancelado pelo comprador'
    WHERE id = p_order_id;

  -- Unlock the listing
  UPDATE listings SET status = 'active' WHERE id = v_order.listing_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
