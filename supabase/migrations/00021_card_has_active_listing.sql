-- ============================================
-- Global active-first catalog ordering.
--
-- The combined marketplace "Todos" view must show every card with an active
-- listing first, then the inactive (research-only) cards. Doing that across
-- the full ~41k catalog with server-side pagination needs a card-level flag
-- to order by — joining listings at query time can't push active cards to the
-- front efficiently.
--
-- `card_bases.has_active_listing` is that flag, kept in sync by a trigger on
-- the listings table. The catalog query then orders by
-- (has_active_listing desc, name asc) for correct, performant ordering.
-- ============================================

alter table card_bases
  add column if not exists has_active_listing boolean not null default false;

-- Backfill from current state.
update card_bases cb
   set has_active_listing = exists (
     select 1 from listings l
      where l.card_base_id = cb.id
        and l.status = 'active'
   );

-- Composite index so "order by has_active_listing desc, name asc" is cheap.
create index if not exists idx_card_bases_active_name
  on card_bases (has_active_listing desc, name asc);

-- Recompute the flag for a card whenever its listings change.
create or replace function sync_card_has_active_listing()
returns trigger
language plpgsql
as $$
declare
  v_card uuid;
begin
  if (tg_op = 'DELETE') then
    v_card := old.card_base_id;
  else
    v_card := new.card_base_id;
  end if;

  update card_bases cb
     set has_active_listing = exists (
       select 1 from listings l
        where l.card_base_id = v_card
          and l.status = 'active'
     )
   where cb.id = v_card;

  -- An UPDATE that moved the listing to a different card_base must refresh both.
  if (tg_op = 'UPDATE' and new.card_base_id is distinct from old.card_base_id) then
    update card_bases cb
       set has_active_listing = exists (
         select 1 from listings l
          where l.card_base_id = old.card_base_id
            and l.status = 'active'
       )
     where cb.id = old.card_base_id;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_sync_card_active on listings;
create trigger trg_sync_card_active
  after insert or update or delete on listings
  for each row execute function sync_card_has_active_listing();
