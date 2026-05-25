-- Expand the per-listing/per-sale `language` CHECK to allow 'ZH' (Chinese).
-- Catalog cards already support ZH (migration 00012); this lets sellers
-- declare their copy as Chinese and lets historical sales be recorded the
-- same way. Korean ('KR') is intentionally not added yet — no card data
-- exists for it.

alter table listings
  drop constraint if exists listings_language_check;

alter table listings
  add constraint listings_language_check
  check (language in ('PT', 'EN', 'JP', 'ZH'));

alter table confirmed_sales
  drop constraint if exists confirmed_sales_language_check;

alter table confirmed_sales
  add constraint confirmed_sales_language_check
  check (language in ('PT', 'EN', 'JP', 'ZH'));
