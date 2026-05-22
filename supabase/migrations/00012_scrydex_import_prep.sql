-- ============================================
-- Schema prep for the scrydex EN + JA bulk import (and future manual ZH uploads).
--
-- Three changes:
-- 1. Expand language_group check to include 'ZH' (Chinese, manual upload later)
-- 2. Change unique constraint from (set_code, number) to
--    (set_code, number, language_group) so the same set+number can coexist
--    across language groups (e.g., English Charizard base1-4 AND Japanese
--    equivalent share set_code "base1" / number "4" but different languages)
-- 3. Add scrydex_id column for dedup/sync against scrydex's globally-unique IDs
-- ============================================

-- ----- 1. Expand language_group constraint -----
-- Drop the old constraint and add the new one that includes 'ZH'.
-- Korean ('KR') deferred until we actually start importing/uploading Korean cards.
alter table card_bases
  drop constraint if exists card_bases_language_group_check;

alter table card_bases
  add constraint card_bases_language_group_check
  check (language_group in ('INT', 'JP', 'ZH'));

-- ----- 2. Switch unique constraint to include language_group -----
-- Drop old (set_code, number) constraint
alter table card_bases
  drop constraint if exists card_bases_set_code_number_key;

-- Add new compound constraint
alter table card_bases
  add constraint card_bases_set_code_number_lang_key
  unique (set_code, number, language_group);

-- ----- 3. Add scrydex_id column -----
-- Scrydex IDs are globally unique across all languages (e.g., 'base1-4' for
-- English Charizard, 'm4_ja-1' for Japanese Weedle). Used as the dedup key
-- for re-runs and future incremental syncs.
alter table card_bases
  add column if not exists scrydex_id text;

-- Unique constraint (nullable — existing MVP rows have no scrydex_id and stay valid)
create unique index if not exists card_bases_scrydex_id_key
  on card_bases (scrydex_id)
  where scrydex_id is not null;

-- Index for fast lookups during import
create index if not exists idx_card_bases_scrydex_id
  on card_bases (scrydex_id);
