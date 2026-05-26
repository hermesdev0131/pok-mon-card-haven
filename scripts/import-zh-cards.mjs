#!/usr/bin/env node
// Manual ZH (Chinese) card importer. Reads a CSV produced from the template
// in docs/zh-cards-template.csv, uploads each matching image to Supabase
// Storage under ZH/{filename}, and upserts a card_bases row per line.
//
// Idempotent: re-running with the same CSV updates existing rows.
// Each ZH row gets a synthetic id (zh-{set_code}-{number}) stored in
// scrydex_id so the existing UNIQUE(scrydex_id) constraint dedups cleanly
// without needing a new schema constraint.
//
// Usage:
//   node --env-file=.env scripts/import-zh-cards.mjs \
//     --csv="Pokemon Cards.csv" --images="Pokemon Cards" [--dry-run]

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const CSV_PATH = resolve(args.csv ?? 'Pokemon Cards.csv');
const IMG_DIR = resolve(args.images ?? 'Pokemon Cards');
const DRY = !!args['dry-run'];
const BUCKET = 'card-base-images';

// Minimal CSV parser: handles quoted fields with commas. The template is
// simple enough that we don't need a dependency.
function parseCsv(text) {
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { inQuotes = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\n' || c === '\r') {
      if (field !== '' || row.length) { row.push(field); rows.push(row); row = []; field = ''; }
      if (c === '\r' && text[i + 1] === '\n') i++;
      i++; continue;
    }
    field += c; i++;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const text = readFileSync(CSV_PATH, 'utf8');
const rows = parseCsv(text).filter(r => r.some(c => c.trim()));
const header = rows.shift().map(h => h.trim());
const expected = ['name','set_name','set_code','number','rarity','language','image_filename'];
for (const col of expected) {
  if (!header.includes(col)) { console.error(`CSV missing column "${col}". Got: ${header.join(',')}`); process.exit(1); }
}
const idx = Object.fromEntries(header.map((h, i) => [h, i]));

console.log(`CSV rows: ${rows.length}`);
console.log(`Image dir: ${IMG_DIR}`);
console.log(`Dry-run: ${DRY}\n`);

let uploaded = 0, upserted = 0, errors = 0;
for (const r of rows) {
  const get = (k) => (r[idx[k]] ?? '').trim();
  const name = get('name');
  const setName = get('set_name');
  const setCode = get('set_code');
  const number = get('number');
  const rarity = get('rarity') || null;
  const language = get('language');
  const imageFilename = get('image_filename');

  if (language !== 'ZH') {
    console.error(`  SKIP "${name}" — language must be ZH, got "${language}"`);
    errors += 1;
    continue;
  }
  if (!setCode || !number || !imageFilename) {
    console.error(`  SKIP "${name}" — missing set_code/number/image_filename`);
    errors += 1;
    continue;
  }

  // Synthetic stable id so upsert is idempotent without a new schema constraint
  const syntheticId = `zh-${setCode}-${number}`;
  const storagePath = `ZH/${imageFilename}`;
  const imageLocalPath = join(IMG_DIR, imageFilename);

  let imageBuffer;
  try {
    imageBuffer = readFileSync(imageLocalPath);
  } catch (err) {
    console.error(`  MISS image ${imageFilename}: ${err.message}`);
    errors += 1;
    continue;
  }

  if (DRY) {
    console.log(`  [dry] would upload ${storagePath} (${imageBuffer.length} bytes) and upsert ${syntheticId}`);
    continue;
  }

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, imageBuffer, { contentType: 'image/png', upsert: true });
  if (upErr) {
    console.error(`  UPLOAD FAIL ${storagePath}: ${upErr.message}`);
    errors += 1;
    continue;
  }
  uploaded += 1;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const publicImageUrl = urlData.publicUrl;

  const row = {
    scrydex_id: syntheticId,
    name,
    set_name: setName,
    set_code: setCode,
    number,
    type: 'normal',
    rarity,
    image_url: publicImageUrl,
    language_group: 'ZH',
  };

  const { error: dbErr } = await supabase
    .from('card_bases')
    .upsert(row, { onConflict: 'scrydex_id', ignoreDuplicates: false });
  if (dbErr) {
    console.error(`  DB FAIL ${syntheticId}: ${dbErr.message}`);
    errors += 1;
    continue;
  }
  upserted += 1;
  console.log(`  OK ${syntheticId}  "${name}"`);
}

console.log(`\nDone. uploaded=${uploaded}, upserted=${upserted}, errors=${errors}`);
