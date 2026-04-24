-- Schedule global expiry of stale awaiting_payment orders every 5 minutes.
-- Without this, expire_stale_orders() only runs lazily when someone views a card page,
-- so abandoned checkouts on rarely-visited cards stay reserved indefinitely.

create extension if not exists pg_cron;

select cron.schedule(
  'expire-stale-orders',
  '*/5 * * * *',
  $$select expire_stale_orders();$$
);
