#!/usr/bin/env node
// One-time fix: re-set the `rarity` of imported JP cards to their English
// value (translation.en.rarity from scrydex). The original import stored the
// Japanese rarity (card.rarity) by mistake. Metadata-only, no image work.
//
// Usage: node --env-file=.env scripts/fix-jp-rarity.mjs [--dry-run]

import { createClient } from '@supabase/supabase-js';

const K = process.env.SCRYDEX_API_KEY;
const T = process.env.SCRYDEX_TEAM_ID;
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes('--dry-run');

const API = 'https://api.scrydex.com/pokemon/v1';
const h = { 'X-Api-Key': K, 'X-Team-ID': T };
const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

// 1) Build scrydex_id -> English rarity map by paging all JP cards.
const filter = encodeURIComponent('-expansion.is_online_only:true');
const pageSize = 100;
const enRarity = new Map();
let page = 1, total = Infinity, fetched = 0;

while (fetched < total) {
  const res = await fetch(
    `${API}/cards?language=ja&page=${page}&page_size=${pageSize}&include=translations&q=${filter}`,
    { headers: h }
  );
  if (!res.ok) throw new Error(`scrydex ${res.status}: ${await res.text().catch(() => '')}`);
  const j = await res.json();
  total = j.total_count ?? 0;
  const cards = j.data ?? [];
  if (cards.length === 0) break;
  for (const c of cards) {
    const r = c.translation?.en?.rarity ?? null;
    if (r) enRarity.set(c.id, r);
  }
  fetched += cards.length;
  if (page % 10 === 0 || fetched >= total) console.log(`  fetched ${fetched}/${total}, mapped=${enRarity.size}`);
  page += 1;
}
console.log(`Built English-rarity map for ${enRarity.size} JP cards`);

// 2) Pull JP rows from DB and compute the ones whose rarity needs changing.
const rows = [];
const dbPage = 1000;
for (let from = 0; ; from += dbPage) {
  const { data, error } = await supabase
    .from('card_bases')
    .select('scrydex_id,rarity')
    .eq('language_group', 'JP')
    .range(from, from + dbPage - 1);
  if (error) throw error;
  if (!data || data.length === 0) break;
  rows.push(...data);
  if (data.length < dbPage) break;
}
console.log(`JP cards in DB: ${rows.length}`);

const updates = [];
let unmatched = 0;
for (const row of rows) {
  const en = enRarity.get(row.scrydex_id);
  if (!en) { unmatched += 1; continue; }
  if (row.rarity !== en) updates.push({ scrydex_id: row.scrydex_id, rarity: en });
}
console.log(`Need update: ${updates.length}, already correct: ${rows.length - updates.length - unmatched}, unmatched: ${unmatched}`);

if (DRY) {
  console.log('Dry run — sample updates:', updates.slice(0, 10));
  process.exit(0);
}

// 3) Group updates by target rarity, then update each group in id-chunks.
// Distinct rarities are few (~20), so this is a handful of chunked calls
// instead of one request per card.
const byRarity = new Map();
for (const u of updates) {
  if (!byRarity.has(u.rarity)) byRarity.set(u.rarity, []);
  byRarity.get(u.rarity).push(u.scrydex_id);
}

let done = 0;
const chunk = 200;
for (const [rarity, ids] of byRarity) {
  for (let i = 0; i < ids.length; i += chunk) {
    const slice = ids.slice(i, i + chunk);
    const { error } = await supabase
      .from('card_bases')
      .update({ rarity })
      .in('scrydex_id', slice);
    if (error) { console.error(`update "${rarity}" chunk failed:`, error.message); continue; }
    done += slice.length;
  }
  console.log(`  "${rarity}": ${ids.length} rows`);
}
console.log(`Updated ${done} JP card rarities to English`);
