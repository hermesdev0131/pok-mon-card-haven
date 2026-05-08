-- ============================================
-- Withdrawal payment receipts
-- Lets admin attach proof of PIX transfer when
-- marking a withdrawal as paid; seller and admin
-- can view the receipt afterwards.
-- ============================================

alter table withdrawals
  add column if not exists receipt_path        text,
  add column if not exists receipt_uploaded_at timestamptz;

-- ===== Storage bucket =====
-- Bucket "withdrawal-receipts" must be created (PRIVATE) via Supabase Dashboard
-- or CLI before this migration is run, e.g.:
--   supabase storage create-bucket withdrawal-receipts
-- (Do NOT make it public — receipts contain bank/PIX details.)

-- ===== Storage policies (RLS on storage.objects) =====
-- Drop any prior versions so this migration is idempotent.
drop policy if exists "withdrawal_receipts_select" on storage.objects;
drop policy if exists "withdrawal_receipts_admin_write" on storage.objects;

-- Read: admin always; sellers only their own withdrawals' receipts.
-- We expect file path = "<withdrawal_id>.<ext>", so we look up the row.
create policy "withdrawal_receipts_select" on storage.objects for select
  using (
    bucket_id = 'withdrawal-receipts'
    and (
      is_admin()
      or exists (
        select 1 from withdrawals w
        where w.receipt_path = storage.objects.name
          and w.seller_id = auth.uid()
      )
    )
  );

-- Write/update/delete: admin only.
create policy "withdrawal_receipts_admin_write" on storage.objects for all
  using (bucket_id = 'withdrawal-receipts' and is_admin())
  with check (bucket_id = 'withdrawal-receipts' and is_admin());
