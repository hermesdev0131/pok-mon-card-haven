-- ============================================
-- Fix the import dedup key: the (set_code, number, language_group) constraint
-- caused data loss because multiple sets in scrydex share the same
-- expansion.code (e.g., "PROMO" for 3 different JA promo sets, "CRZ" for both
-- Crown Zenith and Crown Zenith Galarian Gallery).
--
-- scrydex_id is globally unique per card, so use that as the conflict target
-- instead. Swap from partial-index (which PostgreSQL can't use with ON CONFLICT)
-- to a regular unique constraint that allows multiple NULLs (existing MVP rows
-- without a scrydex_id stay valid since PostgreSQL treats NULLs as distinct
-- in unique constraints).
-- ============================================

-- Drop the (set_code, number, language_group) unique constraint — it caused
-- collisions because scrydex's expansion.code is NOT globally unique across sets.
alter table card_bases
  drop constraint if exists card_bases_set_code_number_lang_key;

-- Replace with a non-unique index so set-based queries stay fast
create index if not exists idx_card_bases_set_lookup
  on card_bases (set_code, number, language_group);

-- Drop the partial unique index on scrydex_id (couldn't be used as ON CONFLICT target)
drop index if exists card_bases_scrydex_id_key;

-- Add a regular unique constraint on scrydex_id.
-- PostgreSQL allows multiple NULL values in a unique constraint, so existing
-- MVP rows with scrydex_id = NULL remain valid and don't conflict with each other.
alter table card_bases
  add constraint card_bases_scrydex_id_uq unique (scrydex_id);
