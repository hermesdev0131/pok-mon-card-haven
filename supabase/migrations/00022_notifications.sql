-- ============================================
-- Notification system (4.1) — core table + helper.
--
-- One row per notification delivered to a user. The in-app bell reads these
-- via RLS; the email layer (separate edge function) sends an email when a row
-- is inserted. Notifications are created only through create_notification()
-- (security definer), called from RPCs, triggers, and the server (webhooks).
-- ============================================

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,  -- recipient
  type        text not null,            -- e.g. 'new_order', 'payment_confirmed', 'dispute_opened'
  title       text not null,
  body        text not null,
  link        text,                     -- relative URL to the relevant page (order, dispute, listing)
  metadata    jsonb not null default '{}'::jsonb,  -- context: { order_id, dispute_id, listing_id, ... }
  read_at     timestamptz,              -- null = unread
  created_at  timestamptz not null default now()
);

create index idx_notifications_user_created on notifications(user_id, created_at desc);
-- Partial index to count/fetch unread quickly.
create index idx_notifications_user_unread on notifications(user_id) where read_at is null;

alter table notifications enable row level security;

-- Users can read and update (mark read) only their own notifications.
create policy "Users see their own notifications"
  on notifications for select using (auth.uid() = user_id);

create policy "Users update their own notifications"
  on notifications for update using (auth.uid() = user_id);

-- No client INSERT/DELETE policy: notifications are created server-side only
-- (via create_notification / service role).

-- ── Helper: create a notification ──────────────────────────────────────
-- Security definer so it can be called from other security-definer RPCs and
-- triggers regardless of the caller's RLS. Returns the new notification id.
create or replace function create_notification(
  p_user_id  uuid,
  p_type     text,
  p_title    text,
  p_body     text,
  p_link     text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_user_id is null then
    return null;
  end if;

  insert into notifications (user_id, type, title, body, link, metadata)
  values (p_user_id, p_type, p_title, p_body, p_link, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

-- Mark-all-read RPC (one round-trip instead of per-row updates).
create or replace function mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_count integer;
begin
  v_user := auth.uid();
  if v_user is null then return 0; end if;

  update notifications
     set read_at = now()
   where user_id = v_user
     and read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Enable Supabase realtime so the bell badge updates live on new inserts.
alter publication supabase_realtime add table notifications;
