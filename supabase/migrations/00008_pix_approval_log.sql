-- ============================================
-- Audit log for every PIX key approval decision
-- (approved / rejected). Lets admin see history,
-- which seller_pix alone can't show because that
-- table only holds the latest state.
-- ============================================

create table if not exists pix_approval_log (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references seller_profiles(id) on delete cascade,
  proposed_pix_key       text not null,
  proposed_pix_key_type  pix_key_type not null,
  decision        text not null check (decision in ('approved', 'rejected')),
  rejected_reason text,
  decided_by      uuid references auth.users(id) on delete set null,
  decided_at      timestamptz not null default now()
);

create index if not exists idx_pix_approval_log_seller   on pix_approval_log(seller_id);
create index if not exists idx_pix_approval_log_decided  on pix_approval_log(decided_at desc);

alter table pix_approval_log enable row level security;

create policy "Seller can read own pix log" on pix_approval_log for select
  using (seller_id = auth.uid() or is_admin());
create policy "Admin can insert pix log" on pix_approval_log for insert
  with check (is_admin());
