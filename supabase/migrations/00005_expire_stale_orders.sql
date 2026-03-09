-- ============================================================
-- Expire stale orders: cancel awaiting_payment orders older than 30 min
-- and release their listings back to active.
-- Called on-demand from the frontend (getListingsForCard, createOrder).
-- ============================================================

CREATE OR REPLACE FUNCTION expire_stale_orders(p_listing_ids uuid[] DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_count integer;
BEGIN
  -- Find and cancel stale orders (atomically)
  WITH stale AS (
    SELECT o.id AS order_id, o.listing_id
    FROM orders o
    WHERE o.status = 'awaiting_payment'
      AND o.created_at < now() - interval '30 minutes'
      AND (p_listing_ids IS NULL OR o.listing_id = ANY(p_listing_ids))
    FOR UPDATE OF o SKIP LOCKED
  ),
  cancel_orders AS (
    UPDATE orders
    SET status = 'cancelled',
        cancelled_at = now(),
        cancellation_reason = 'Expirado — pagamento não realizado em 30 minutos'
    FROM stale
    WHERE orders.id = stale.order_id
  )
  UPDATE listings
  SET status = 'active'
  FROM stale
  WHERE listings.id = stale.listing_id
    AND listings.status = 'reserved';

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$$;
