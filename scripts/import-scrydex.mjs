#!/usr/bin/env node
// Bulk-import Pokémon cards from scrydex (English + Japanese) into the
// Graduada database, downloading images into Supabase Storage.
//
// Usage:
//   node --env-file=.env scripts/import-scrydex.mjs [options]
//
// Options:
//   --language=en|ja      Only import this language (default: both)
//   --limit=N             Stop after processing N cards (for testing)
//   --concurrency=N       Parallel cards being processed (default: 10)
//   --dry-run             Don't write to DB or storage, just count
//
// Run from project root. Requires .env with SCRYDEX_API_KEY, SCRYDEX_TEAM_ID,
// NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'node:buffer';

const SCRYDEX_API_KEY = process.env.SCRYDEX_API_KEY;
const SCRYDEX_TEAM_ID = process.env.SCRYDEX_TEAM_ID;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SCRYDEX_API_KEY || !SCRYDEX_TEAM_ID || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required env vars. Need SCRYDEX_API_KEY, SCRYDEX_TEAM_ID, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ---- Parse CLI args ----
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const ONLY_LANGUAGE = args.language; // 'en' | 'ja' | undefined
const LIMIT = args.limit ? parseInt(args.limit, 10) : Infinity;
const CONCURRENCY = args.concurrency ? parseInt(args.concurrency, 10) : 10;
const DRY_RUN = !!args['dry-run'];

const LANG_TO_GROUP = { en: 'INT', ja: 'JP' };
const STORAGE_BUCKET = 'card-base-images';
const SCRYDEX_API = 'https://api.scrydex.com/pokemon/v1';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const stats = {
  apiCalls: 0,
  cardsSeen: 0,
  cardsImported: 0,
  cardsSkippedTcgp: 0,
  cardsSkippedNoImage: 0,
  cardsSkippedNoName: 0,
  imageDownloadErrors: 0,
  uploadErrors: 0,
  dbErrors: 0,
};

async function scrydexFetch(endpoint) {
  stats.apiCalls += 1;
  const res = await fetch(`${SCRYDEX_API}${endpoint}`, {
    headers: {
      'X-Api-Key': SCRYDEX_API_KEY,
      'X-Team-ID': SCRYDEX_TEAM_ID,
    },
  });
  if (!res.ok) {
    throw new Error(`Scrydex ${res.status} on ${endpoint}: ${await res.text().catch(() => '')}`);
  }
  return res.json();
}

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch ${res.status}: ${url}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

async function processCard(card, language) {
  stats.cardsSeen += 1;

  // Filter out TCG Pocket (digital game) cards — not graded physical cards
  const exp = card.expansion || {};
  if (exp.is_online_only === true || (card.id && card.id.startsWith('tcgp-'))) {
    stats.cardsSkippedTcgp += 1;
    return;
  }

  // The catalog is English-facing. For Japanese cards every human-readable
  // field comes from the English translation block (fetched via
  // include=translations); only the EN-language cards are already English.
  const en = card.translation?.en;
  const displayName = language === 'ja'
    ? (en?.name ?? null)
    : (card.name ?? null);
  const displaySetName = language === 'ja'
    ? (en?.expansion?.name ?? exp.name ?? 'Unknown Set')
    : (exp.name || 'Unknown Set');
  const displayRarity = language === 'ja'
    ? (en?.rarity ?? null)
    : (card.rarity ?? null);

  if (!displayName) {
    stats.cardsSkippedNoName += 1;
    return;
  }

  // Image URL (large variant from scrydex CDN)
  const imageUrl = (card.images || []).find((i) => i.type === 'front')?.large
    ?? card.images?.[0]?.large;
  if (!imageUrl) {
    stats.cardsSkippedNoImage += 1;
    return;
  }

  const languageGroup = LANG_TO_GROUP[language];
  const setCode = exp.code || 'unknown';
  const cardNumber = String(card.number || '0');
  // Use scrydex_id as the filename — globally unique per card, so no collisions
  // between different sets that share an expansion.code (e.g., multiple "PROMO" sets).
  const storagePath = `${languageGroup}/${card.id}.png`;

  if (DRY_RUN) {
    stats.cardsImported += 1;
    return;
  }

  // 1) Download image from scrydex CDN
  let imageBuffer;
  try {
    imageBuffer = await downloadImage(imageUrl);
  } catch (err) {
    stats.imageDownloadErrors += 1;
    console.error(`[${card.id}] image download failed:`, err.message);
    return;
  }

  // 2) Upload to Supabase Storage (upsert: true = overwrite if exists)
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    });
  if (uploadError) {
    stats.uploadErrors += 1;
    console.error(`[${card.id}] upload failed:`, uploadError.message);
    return;
  }

  // 3) Public URL for the image
  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  const publicImageUrl = urlData.publicUrl;

  // 4) Upsert row in card_bases (key: scrydex_id)
  const row = {
    scrydex_id: card.id,
    name: displayName,
    set_name: displaySetName,
    set_code: setCode,
    number: cardNumber,
    type: 'normal',
    rarity: displayRarity,
    image_url: publicImageUrl,
    language_group: languageGroup,
  };

  // Upsert against scrydex_id (globally unique per card). Using set_code+number
  // as the conflict key would lose data because scrydex's expansion.code is not
  // globally unique (e.g., "PROMO" maps to 3 different JA expansions).
  const { error: dbError } = await supabase
    .from('card_bases')
    .upsert(row, { onConflict: 'scrydex_id', ignoreDuplicates: false });

  if (dbError) {
    stats.dbErrors += 1;
    console.error(`[${card.id}] db upsert failed:`, dbError.message);
    return;
  }

  stats.cardsImported += 1;
}

async function processInBatches(items, batchSize, worker) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(worker));
  }
}

async function processLanguage(language) {
  console.log(`\n=== Importing language: ${language.toUpperCase()} ===`);
  const pageSize = 100;
  let page = 1;

  // Build the URL. We filter at the API level to exclude TCG Pocket (digital
  // game) cards, since they're not graded physical cards.
  // Note: scrydex's boolean filter syntax differs between languages — the negative
  // form (-expansion.is_online_only:true) works for both EN and JA, while the
  // positive form returns 0 results for JA. Negative it is.
  const filterPhysical = encodeURIComponent('-expansion.is_online_only:true');
  const buildUrl = (p) => language === 'ja'
    ? `/cards?language=ja&page=${p}&page_size=${pageSize}&include=translations&q=${filterPhysical}`
    : `/cards?language=en&page=${p}&page_size=${pageSize}&q=${filterPhysical}`;

  // First page to learn total
  let first;
  try {
    first = await scrydexFetch(buildUrl(page));
  } catch (err) {
    console.error(`Failed to fetch first page for ${language}:`, err.message);
    return;
  }
  const total = first.total_count || 0;
  console.log(`Total ${language} cards in scrydex: ${total}`);

  let processedInThisLang = 0;
  const handlePage = async (pageData) => {
    const cards = pageData.data || [];
    await processInBatches(cards, CONCURRENCY, async (card) => {
      if (stats.cardsSeen >= LIMIT) return;
      await processCard(card, language);
    });
    processedInThisLang += cards.length;
    if (processedInThisLang % 500 < pageSize) {
      console.log(`  [${language}] processed ${processedInThisLang}/${total} ... imported=${stats.cardsImported}, skippedTCGP=${stats.cardsSkippedTcgp}`);
    }
  };

  await handlePage(first);

  while (processedInThisLang < total && stats.cardsSeen < LIMIT) {
    page += 1;
    let pageData;
    try {
      pageData = await scrydexFetch(buildUrl(page));
    } catch (err) {
      console.error(`Failed page ${page} for ${language}:`, err.message);
      break;
    }
    if (!pageData.data || pageData.data.length === 0) break;
    await handlePage(pageData);
  }

  console.log(`Finished ${language.toUpperCase()}: processed=${processedInThisLang}`);
}

async function main() {
  const startedAt = Date.now();
  console.log('=== scrydex import ===');
  console.log('Language:', ONLY_LANGUAGE || 'en, ja');
  console.log('Limit:', LIMIT === Infinity ? 'none' : LIMIT);
  console.log('Concurrency:', CONCURRENCY);
  console.log('Dry-run:', DRY_RUN);

  const langs = ONLY_LANGUAGE ? [ONLY_LANGUAGE] : ['en', 'ja'];

  for (const lang of langs) {
    if (stats.cardsSeen >= LIMIT) break;
    if (!LANG_TO_GROUP[lang]) {
      console.error(`Unknown language: ${lang}`);
      continue;
    }
    await processLanguage(lang);
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log('\n=== Done ===');
  console.log(`Time: ${elapsed}s`);
  console.log(`API calls: ${stats.apiCalls} (~${stats.apiCalls} credits)`);
  console.log(`Cards seen: ${stats.cardsSeen}`);
  console.log(`Cards imported: ${stats.cardsImported}`);
  console.log(`Skipped (TCG Pocket): ${stats.cardsSkippedTcgp}`);
  console.log(`Skipped (no image): ${stats.cardsSkippedNoImage}`);
  console.log(`Skipped (no name): ${stats.cardsSkippedNoName}`);
  console.log(`Errors — image: ${stats.imageDownloadErrors}, upload: ${stats.uploadErrors}, db: ${stats.dbErrors}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
