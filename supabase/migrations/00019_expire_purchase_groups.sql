-- ============================================
-- Expire stale purchase_groups.
--
-- Mirrors expire_stale_orders() but operates at the group level: when a
-- buyer reaches the payment screen but doesn't complete payment within
-- the 20-minute window, the whole purchase_group is marked expired, all
-- of its orders are cancelled, and the reserved listings are released
-- back to 'active' so other buyers can pick them up.
--
-- Scheduled via pg_cron alongside the existing expire_stale_orders job
-- so the system self-cleans without depending on lazy page loads.
-- ============================================

create or replace function expire_stale_purchase_groups()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired_count integer := 0;
  v_group record;
begin
  -- Lock candidate groups (FOR UPDATE SKIP LOCKED so two cron ticks can't
  -- step on each other if the previous run is slow).
  for v_group in
    select id from purchase_groups
     where status = 'awaiting_payment'
       and expires_at is not null
       and expires_at < now()
     for update skip locked
  loop
    -- Release any listings the group's orders are holding.
    update listings
       set status = 'active'
      from orders
     where orders.purchase_group_id = v_group.id
       and orders.listing_id = listings.id
       and listings.status = 'reserved';

    -- Cancel the orders themselves.
    update orders
       set status = 'cancelled',
           cancelled_at = now(),
           cancellation_reason = 'Compra expirada — pagamento não realizado em 20 minutos'
     where purchase_group_id = v_group.id
       and status = 'awaiting_payment';

    -- Finally mark the group expired.
    update purchase_groups
       set status = 'expired',
           cancelled_at = now()
     where id = v_group.id;

    v_expired_count := v_expired_count + 1;
  end loop;

  return v_expired_count;
end;
$$;

-- Schedule it every 5 minutes, matching the cadence of expire_stale_orders.
select cron.schedule(
  'expire-stale-purchase-groups',
  '*/5 * * * *',
  $$select expire_stale_purchase_groups();$$
);
