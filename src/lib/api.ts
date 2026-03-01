import { createClient } from '@/lib/supabase/client';
import type {
  CardBase,
  Listing,
  CardBaseWithStats,
  Seller,
  SaleRecord,
  PricePoint,
  Order,
  Question,
  Review,
  OrderStatus,
  GradeCompany,
} from '@/types';
import type { Database } from '@/types/database';

// DB row types for explicit typing (Supabase type inference can collapse to `never` on chained queries)
type ListingRow = Database['public']['Tables']['listings']['Row'];
type CardBaseRow = Database['public']['Tables']['card_bases']['Row'];
type ConfirmedSaleRow = Database['public']['Tables']['confirmed_sales']['Row'];

const supabase = createClient();

// Log Supabase query errors. Do NOT call signOut() here — Supabase handles
// genuine session expiry automatically via its own token refresh and emits
// SIGNED_OUT through onAuthStateChange when truly needed. Calling signOut()
// on transient JWT errors clears in-memory session state while cookies remain
// valid, causing all subsequent queries to fail until a hard refresh restores
// the session from cookies.
function logIfError(label: string, error: { message: string; code?: string } | null) {
  if (!error) return;
  console.error(`[api] ${label}:`, error.message, error.code ?? '');
}

// ════════════════════════════════════════════════
// Helpers: batch-fetch profiles & seller_profiles
// ════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchProfilesByIds(ids: string[]): Promise<Record<string, any>> {
  if (!ids.length) return {};
  const { data, error } = await supabase.from('profiles').select('*').in('id', Array.from(new Set(ids)));
  logIfError('fetchProfilesByIds', error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (data ?? []) as any[]) map[p.id] = p;
  return map;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchSellerProfilesByIds(ids: string[]): Promise<Record<string, any>> {
  if (!ids.length) return {};
  const unique = Array.from(new Set(ids));
  const [{ data: sellers, error: sErr }, profiles] = await Promise.all([
    supabase.from('seller_profiles').select('*').in('id', unique),
    fetchProfilesByIds(unique),
  ]);
  logIfError('fetchSellerProfilesByIds', sErr);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const s of (sellers ?? []) as any[]) {
    map[s.id] = { ...s, profiles: profiles[s.id] ?? {} };
  }
  return map;
}

// ════════════════════════════════════════════════
// Mapper functions: DB rows → Frontend types
// ════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCardBase(row: any): CardBase {
  return {
    id: row.id,
    name: row.name,
    set: row.set_name,
    setCode: row.set_code,
    number: row.number,
    type: row.type,
    rarity: row.rarity ?? undefined,
    imageUrl: row.image_url ?? undefined,
    languageGroup: row.language_group,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapListing(row: any): Listing {
  return {
    id: row.id,
    cardBaseId: row.card_base_id,
    sellerId: row.seller_id,
    grade: row.grade,
    gradeCompany: row.grade_company,
    pristine: row.pristine || undefined,
    price: row.price,
    images: row.images ?? [],
    freeShipping: row.free_shipping || undefined,
    language: row.language,
    tags: row.tags ?? [],
    status: row.status,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSeller(row: any): Seller {
  const profile = row.profiles;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return {
    id: row.id,
    name: row.store_name,
    avatar: profile?.avatar_url ?? '',
    verified: row.verified,
    isNew: new Date(row.created_at) > thirtyDaysAgo,
    rating: row.rating,
    totalSales: row.total_sales,
    joinedAt: row.created_at,
  };
}

function mapOrderStatus(dbStatus: string): OrderStatus {
  const map: Record<string, OrderStatus> = {
    awaiting_payment: 'aguardando_pagamento',
    payment_confirmed: 'pago',
    awaiting_shipment: 'pago',
    shipped: 'enviado',
    delivered: 'entregue',
    completed: 'entregue',
    disputed: 'disputa',
    cancelled: 'cancelado',
    refunded: 'cancelado',
  };
  return map[dbStatus] ?? 'aguardando_pagamento';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrder(row: any, buyerName: string, sellerName: string): Order {
  const listing = row.listing;
  const cardBase = listing?.card_base;
  const cardName = cardBase
    ? `${cardBase.name} ${listing.grade_company} ${listing.grade}`
    : 'Carta';
  return {
    id: row.id,
    status: mapOrderStatus(row.status),
    cardId: listing?.card_base_id ?? '',
    cardName,
    buyerId: row.buyer_id,
    buyerName,
    sellerId: row.seller_id,
    sellerName,
    price: row.price,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReview(row: any, buyerName: string): Review {
  return {
    id: row.id,
    sellerId: row.seller_id,
    buyerName,
    rating: row.rating,
    comment: row.comment ?? '',
    date: row.created_at,
  };
}

// ════════════════════════════════════════════════
// Card Bases
// ════════════════════════════════════════════════

export async function getCardBasesWithStats(filters?: {
  search?: string;
  type?: string;
  sort?: string;
}): Promise<CardBaseWithStats[]> {
  let cbQuery = supabase.from('card_bases').select('*');
  if (filters?.search) {
    const s = filters.search;
    cbQuery = cbQuery.or(`name.ilike.%${s}%,set_name.ilike.%${s}%,number.ilike.%${s}%`);
  }
  if (filters?.type) {
    cbQuery = cbQuery.eq('type', filters.type as string);
  }
  const { data: cardRows, error: cbErr } = await cbQuery;
  console.log('[api:DBG] getCardBasesWithStats card_bases — rows:', cardRows?.length ?? 'null', '| error:', cbErr?.message ?? 'none');
  logIfError('getCardBasesWithStats.card_bases', cbErr);
  const cardBaseRows = (cardRows ?? []) as CardBaseRow[];
  if (!cardBaseRows.length) return [];

  const { data: listingRows, error: lErr } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'active' as string);
  logIfError('getCardBasesWithStats.listings', lErr);

  const listingsArr = (listingRows ?? []) as ListingRow[];

  const listingsByCard: Record<string, number[]> = {};
  for (const l of listingsArr) {
    if (!listingsByCard[l.card_base_id]) listingsByCard[l.card_base_id] = [];
    listingsByCard[l.card_base_id].push(l.price);
  }

  const stats: CardBaseWithStats[] = cardBaseRows
    .map(row => {
      const prices = listingsByCard[row.id] ?? [];
      return {
        cardBase: mapCardBase(row),
        listingCount: prices.length,
        lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
        highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
      };
    })
    .filter(s => s.listingCount > 0);

  if (filters?.sort === 'price_asc') stats.sort((a, b) => a.lowestPrice - b.lowestPrice);
  else if (filters?.sort === 'price_desc') stats.sort((a, b) => b.lowestPrice - a.lowestPrice);

  return stats;
}

export async function getCardBase(id: string): Promise<CardBase | null> {
  const { data, error } = await supabase
    .from('card_bases')
    .select('*')
    .eq('id', id)
    .single();
  logIfError('getCardBase', error);
  return data ? mapCardBase(data) : null;
}

// ════════════════════════════════════════════════
// Listings
// ════════════════════════════════════════════════

export async function getListingsForCard(cardBaseId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('card_base_id', cardBaseId)
    .eq('status', 'active' as string)
    .order('price', { ascending: true });
  logIfError('getListingsForCard', error);
  return ((data ?? []) as ListingRow[]).map(mapListing);
}

/** Recent listings with card base + seller info (for ultimos-anuncios page) */
export async function getRecentListings(): Promise<
  (Listing & { cardBase: CardBase; seller?: Seller })[]
> {
  // card_bases join works (direct FK), but seller_profiles doesn't
  const { data, error } = await supabase
    .from('listings')
    .select('*, card_bases(*)')
    .eq('status', 'active' as string)
    .order('created_at', { ascending: false })
    .limit(30);
  logIfError('getRecentListings', error);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  if (!rows.length) return [];

  // Batch-fetch sellers
  const sellerIds = rows.map(r => r.seller_id);
  const sellerMap = await fetchSellerProfilesByIds(sellerIds);

  return rows.map(row => ({
    ...mapListing(row),
    cardBase: mapCardBase(row.card_bases),
    seller: sellerMap[row.seller_id] ? mapSeller(sellerMap[row.seller_id]) : undefined,
  }));
}

// ════════════════════════════════════════════════
// Sellers
// ════════════════════════════════════════════════

export async function getSeller(id: string): Promise<Seller | null> {
  const [{ data: sp }, profiles] = await Promise.all([
    supabase.from('seller_profiles').select('*').eq('id', id).single(),
    fetchProfilesByIds([id]),
  ]);
  if (!sp) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mapSeller({ ...(sp as any), profiles: profiles[id] ?? {} });
}

export async function getSellerListings(sellerId: string): Promise<(Listing & { cardBase: CardBase })[]> {
  const { data } = await supabase
    .from('listings')
    .select('*, card_bases(*)')
    .eq('seller_id', sellerId)
    .eq('status', 'active' as string);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map(row => ({
    ...mapListing(row),
    cardBase: mapCardBase(row.card_bases),
  }));
}

export async function getSellerReviews(sellerId: string): Promise<Review[]> {
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  if (!rows.length) return [];

  const buyerIds = rows.map(r => r.buyer_id);
  const profiles = await fetchProfilesByIds(buyerIds);

  return rows.map(r => mapReview(r, profiles[r.buyer_id]?.full_name ?? 'Comprador'));
}

export async function getAllSellers(): Promise<Seller[]> {
  const { data, error } = await supabase.from('seller_profiles').select('*');
  logIfError('getAllSellers', error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  if (!rows.length) return [];

  const profiles = await fetchProfilesByIds(rows.map(r => r.id));
  return rows.map(r => mapSeller({ ...r, profiles: profiles[r.id] ?? {} }));
}

/** All sellers with active listing count (for vendedores page) */
export async function getSellersWithListingCount(): Promise<(Seller & { listingCount: number })[]> {
  const [{ data: sellerRows }, { data: listingRows }] = await Promise.all([
    supabase.from('seller_profiles').select('*'),
    supabase.from('listings').select('*').eq('status', 'active' as string),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sRows = (sellerRows ?? []) as any[];
  if (!sRows.length) return [];

  const profiles = await fetchProfilesByIds(sRows.map(r => r.id));
  const sellers = sRows.map(r => mapSeller({ ...r, profiles: profiles[r.id] ?? {} }));

  const listings = (listingRows ?? []) as ListingRow[];
  const countMap: Record<string, number> = {};
  for (const l of listings) {
    countMap[l.seller_id] = (countMap[l.seller_id] ?? 0) + 1;
  }

  return sellers.map(s => ({
    ...s,
    listingCount: countMap[s.id] ?? 0,
  }));
}

export async function getAllReviews(): Promise<Review[]> {
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  if (!rows.length) return [];

  const profiles = await fetchProfilesByIds(rows.map(r => r.buyer_id));
  return rows.map(r => mapReview(r, profiles[r.buyer_id]?.full_name ?? 'Comprador'));
}

// ════════════════════════════════════════════════
// Sales & Price History
// ════════════════════════════════════════════════

export async function getSalesHistory(cardBaseId: string): Promise<SaleRecord[]> {
  const { data, error } = await supabase
    .from('confirmed_sales')
    .select('*')
    .eq('card_base_id', cardBaseId)
    .order('sold_at', { ascending: false });
  logIfError('getSalesHistory', error);

  const rows = (data ?? []) as ConfirmedSaleRow[];
  if (!rows.length) return [];

  const buyerIds = Array.from(new Set(rows.map(r => r.buyer_id)));
  const sellerIds = Array.from(new Set(rows.map(r => r.seller_id)));

  const [profiles, { data: sellers }] = await Promise.all([
    fetchProfilesByIds(buyerIds),
    supabase.from('seller_profiles').select('id, store_name').in('id', sellerIds),
  ]);

  const sellerMap: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const s of (sellers ?? []) as any[]) sellerMap[s.id] = s.store_name;

  return rows.map(row => ({
    date: row.sold_at,
    price: row.sale_price,
    grade: row.grade,
    gradeCompany: row.grade_company,
    pristine: row.pristine || undefined,
    sellerName: sellerMap[row.seller_id] ?? 'Vendedor',
    buyerName: profiles[row.buyer_id]?.full_name ?? 'Comprador',
    language: row.language,
  }));
}

export async function getPriceHistory(cardBaseId: string): Promise<PricePoint[]> {
  const { data, error } = await supabase
    .from('confirmed_sales')
    .select('*')
    .eq('card_base_id', cardBaseId)
    .order('sold_at', { ascending: true });
  logIfError('getPriceHistory', error);

  const rows = (data ?? []) as ConfirmedSaleRow[];
  if (!rows.length) return [];

  const groups: Record<string, { total: number; count: number }> = {};
  for (const row of rows) {
    const d = new Date(row.sold_at);
    const monthName = d.toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '')
      .replace(/^(\w)/, (_, c) => c.toUpperCase());
    const month = `${monthName}/${String(d.getFullYear()).slice(-2)}`;
    const key = `${month}|${row.language}|${row.grade_company}|${row.grade}`;
    if (!groups[key]) groups[key] = { total: 0, count: 0 };
    groups[key].total += row.sale_price;
    groups[key].count += 1;
  }

  return Object.entries(groups).map(([key, { total, count }]) => {
    const [month, language, company, grade] = key.split('|');
    return {
      month,
      language: language as PricePoint['language'],
      company,
      grade: Number(grade),
      avgPrice: Math.round(total / count),
      salesCount: count,
    };
  });
}

/** Recent confirmed sales across all cards (for ultimas-vendas page) */
export async function getRecentSales(): Promise<
  (SaleRecord & { cardBaseId: string; cardName: string; cardSet: string; imageUrl?: string; seller?: Seller })[]
> {
  const { data, error } = await supabase
    .from('confirmed_sales')
    .select('*')
    .order('sold_at', { ascending: false })
    .limit(30);
  logIfError('getRecentSales', error);

  const rows = (data ?? []) as ConfirmedSaleRow[];
  if (!rows.length) return [];

  const cardBaseIds = Array.from(new Set(rows.map(r => r.card_base_id)));
  const buyerIds = Array.from(new Set(rows.map(r => r.buyer_id)));
  const sellerIds = Array.from(new Set(rows.map(r => r.seller_id)));

  const [{ data: cardBases }, profiles, sellerMap] = await Promise.all([
    supabase.from('card_bases').select('*').in('id', cardBaseIds),
    fetchProfilesByIds(buyerIds),
    fetchSellerProfilesByIds(sellerIds),
  ]);

  const cbMap: Record<string, CardBaseRow> = {};
  for (const cb of (cardBases ?? []) as CardBaseRow[]) cbMap[cb.id] = cb;

  return rows.map(row => {
    const cb = cbMap[row.card_base_id];
    const sp = sellerMap[row.seller_id];
    return {
      date: row.sold_at,
      price: row.sale_price,
      grade: row.grade,
      gradeCompany: row.grade_company,
      pristine: row.pristine || undefined,
      sellerName: sp?.store_name ?? 'Vendedor',
      buyerName: profiles[row.buyer_id]?.full_name ?? 'Comprador',
      language: row.language,
      cardBaseId: row.card_base_id,
      cardName: cb?.name ?? 'Carta',
      cardSet: cb?.set_name ?? '',
      imageUrl: cb?.image_url ?? undefined,
      seller: sp ? mapSeller(sp) : undefined,
    };
  });
}

// ════════════════════════════════════════════════
// Questions
// ════════════════════════════════════════════════

export async function getQuestionsForListing(listingId: string): Promise<Question[]> {
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (questions ?? []) as any[];
  if (!rows.length) return [];

  // Fetch the listing to get seller_id
  const { data: listing } = await supabase
    .from('listings')
    .select('seller_id')
    .eq('id', listingId)
    .single();

  // Batch-fetch user profiles + seller name
  const userIds = rows.map(r => r.user_id);
  const sellerId = (listing as any)?.seller_id;

  const [profiles, { data: sellerData }] = await Promise.all([
    fetchProfilesByIds(userIds),
    sellerId
      ? supabase.from('seller_profiles').select('store_name').eq('id', sellerId).single()
      : Promise.resolve({ data: null }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sellerName = (sellerData as any)?.store_name ?? 'Vendedor';

  return rows.map(r => ({
    id: r.id,
    listingId: r.listing_id,
    sellerId: sellerId ?? '',
    sellerName,
    userName: profiles[r.user_id]?.full_name ?? 'Usuário',
    question: r.question,
    answer: r.answer ?? undefined,
    questionDate: r.created_at,
    answerDate: r.answered_at ?? undefined,
  }));
}

// ════════════════════════════════════════════════
// Orders
// ════════════════════════════════════════════════

// Only join listings→card_bases (direct FKs in public schema)
const ORDER_SELECT = `
  *,
  listing:listings(card_base_id, grade, grade_company, card_base:card_bases(name))
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enrichOrders(rows: any[]): Promise<Order[]> {
  if (!rows.length) return [];

  const buyerIds = Array.from(new Set(rows.map(r => r.buyer_id)));
  const sellerIds = Array.from(new Set(rows.map(r => r.seller_id)));

  const [profiles, { data: sellers }] = await Promise.all([
    fetchProfilesByIds(buyerIds),
    supabase.from('seller_profiles').select('id, store_name').in('id', sellerIds),
  ]);

  const sellerMap: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const s of (sellers ?? []) as any[]) sellerMap[s.id] = s.store_name;

  return rows.map(row => mapOrder(
    row,
    profiles[row.buyer_id]?.full_name ?? 'Comprador',
    sellerMap[row.seller_id] ?? 'Vendedor',
  ));
}

/** Orders for the current user (buyer or seller) */
export async function getMyOrders(): Promise<Order[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  return enrichOrders((data ?? []) as any[]);
}

/** All orders (for admin page) */
export async function getAllOrders(): Promise<Order[]> {
  const { data } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false });

  return enrichOrders((data ?? []) as any[]);
}

export async function getOrder(id: string): Promise<Order | null> {
  const { data } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', id)
    .single();

  if (!data) return null;
  const orders = await enrichOrders([data]);
  return orders[0] ?? null;
}

// ════════════════════════════════════════════════
// Specialized queries for pages
// ════════════════════════════════════════════════

/** Card bases that have at least one PSA 10 active listing (for PSA10 page) */
export async function getCardBasesWithPSA10(): Promise<CardBaseWithStats[]> {
  const { data: psa10Listings } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'active' as string)
    .eq('grade_company', 'PSA' as string)
    .eq('grade', 10);

  const psa10Rows = (psa10Listings ?? []) as ListingRow[];
  if (!psa10Rows.length) return [];

  const psa10CardIds = Array.from(new Set(psa10Rows.map(l => l.card_base_id)));

  const { data: cardRows } = await supabase
    .from('card_bases')
    .select('*')
    .in('id', psa10CardIds);

  const cardRowsTyped = (cardRows ?? []) as CardBaseRow[];
  if (!cardRowsTyped.length) return [];

  const { data: allListings } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'active' as string)
    .in('card_base_id', psa10CardIds);

  const allListingsTyped = (allListings ?? []) as ListingRow[];
  const listingsByCard: Record<string, number[]> = {};
  for (const l of allListingsTyped) {
    if (!listingsByCard[l.card_base_id]) listingsByCard[l.card_base_id] = [];
    listingsByCard[l.card_base_id].push(l.price);
  }

  return cardRowsTyped.map(row => {
    const prices = listingsByCard[row.id] ?? [];
    return {
      cardBase: mapCardBase(row),
      listingCount: prices.length,
      lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
      highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
    };
  });
}

/** Sellers map for a set of listings (for card detail page) */
export async function getSellersForListings(sellerIds: string[]): Promise<Record<string, Seller>> {
  if (!sellerIds.length) return {};
  const sellerMap = await fetchSellerProfilesByIds(sellerIds);
  const result: Record<string, Seller> = {};
  for (const [id, row] of Object.entries(sellerMap)) {
    result[id] = mapSeller(row);
  }
  return result;
}

// ════════════════════════════════════════════════
// Card Base Search (for sell form)
// ════════════════════════════════════════════════

export async function searchCardBases(query: string): Promise<CardBase[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from('card_bases')
    .select('*')
    .or(`name.ilike.%${query}%,set_name.ilike.%${query}%,number.ilike.%${query}%`)
    .order('name', { ascending: true })
    .limit(20);
  logIfError('searchCardBases', error);
  return ((data ?? []) as CardBaseRow[]).map(mapCardBase);
}

// ════════════════════════════════════════════════
// Listing Mutations
// ════════════════════════════════════════════════

export type CreateListingInput = {
  cardBaseId: string;
  grade: number;
  gradeCompany: GradeCompany;
  pristine: boolean;
  language: 'PT' | 'EN' | 'JP';
  price: number; // in centavos
  freeShipping: boolean;
  conditionNotes?: string;
  imageFiles: (File | null)[];
};

export type CreateListingResult =
  | { success: true; listingId: string }
  | { success: false; error: string };

export async function createListing(input: CreateListingInput): Promise<CreateListingResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const listingId = crypto.randomUUID();
  const imageUrls: string[] = [];

  for (let i = 0; i < input.imageFiles.length; i++) {
    const file = input.imageFiles[i];
    if (!file) continue;
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/${listingId}/${i}_${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(path, file, { upsert: false });
    if (uploadError) {
      logIfError(`createListing.upload[${i}]`, uploadError);
      return { success: false, error: `Erro ao enviar imagem ${i + 1}: ${uploadError.message}` };
    }
    const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(path);
    imageUrls.push(urlData.publicUrl);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase.from('listings') as any).insert({
    id: listingId,
    seller_id: user.id,
    card_base_id: input.cardBaseId,
    grade: input.grade,
    grade_company: input.gradeCompany,
    pristine: input.pristine,
    language: input.language,
    price: input.price,
    free_shipping: input.freeShipping,
    condition_notes: input.conditionNotes ?? null,
    images: imageUrls,
    status: 'active',
  });

  if (insertError) {
    logIfError('createListing.insert', insertError);
    return { success: false, error: insertError.message };
  }

  return { success: true, listingId };
}

export type UpdateListingInput = {
  price?: number;
  freeShipping?: boolean;
  conditionNotes?: string;
  status?: 'active' | 'cancelled';
};

export async function updateListing(
  listingId: string,
  input: UpdateListingInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  if (input.price !== undefined) updates.price = input.price;
  if (input.freeShipping !== undefined) updates.free_shipping = input.freeShipping;
  if (input.conditionNotes !== undefined) updates.condition_notes = input.conditionNotes;
  if (input.status !== undefined) updates.status = input.status;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('listings') as any).update(updates).eq('id', listingId).eq('seller_id', user.id);

  if (error) {
    logIfError('updateListing', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function cancelListing(
  listingId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  return updateListing(listingId, { status: 'cancelled' });
}

export async function getMyListings(): Promise<(Listing & { cardBase: CardBase })[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('listings')
    .select('*, card_bases(*)')
    .eq('seller_id', user.id)
    .in('status', ['active', 'reserved'])
    .order('created_at', { ascending: false });

  logIfError('getMyListings', error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map(row => ({
    ...mapListing(row),
    cardBase: mapCardBase(row.card_bases),
  }));
}

// ════════════════════════════════════════════════
// Order Mutations
// ════════════════════════════════════════════════

const PLATFORM_FEE_RATE = 0.10;

export type CreateOrderResult =
  | { success: true; orderId: string }
  | { success: false; error: string };

export async function createOrder(listingId: string): Promise<CreateOrderResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, seller_id, price, status')
    .eq('id', listingId)
    .single();

  if (listingError || !listing) return { success: false, error: 'Anúncio não encontrado' };
  if ((listing as { status: string }).status !== 'active') return { success: false, error: 'Este anúncio não está mais disponível' };
  if ((listing as { seller_id: string }).seller_id === user.id) return { success: false, error: 'Você não pode comprar seu próprio anúncio' };

  const price = (listing as { price: number }).price;
  const platformFee = Math.round(price * PLATFORM_FEE_RATE);
  const sellerPayout = price - platformFee;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: orderError } = await (supabase.from('orders') as any).insert({
    listing_id: listingId,
    buyer_id: user.id,
    seller_id: (listing as { seller_id: string }).seller_id,
    price,
    shipping_cost: 0,
    platform_fee: platformFee,
    seller_payout: sellerPayout,
    status: 'awaiting_payment',
  }).select('id').single();

  if (orderError) {
    logIfError('createOrder', orderError);
    if (orderError.code === '23505') return { success: false, error: 'Este anúncio já foi vendido' };
    return { success: false, error: orderError.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('listings') as any).update({ status: 'reserved' }).eq('id', listingId);

  return { success: true, orderId: (order as { id: string }).id };
}
