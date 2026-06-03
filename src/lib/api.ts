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
  Message,
  Dispute,
  DisputeStatus,
  CardLanguageGroup,
  CardLanguage,
  Address,
  CartItem,
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
    freeShippingPac: row.free_shipping_pac || undefined,
    freeShippingSedex: row.free_shipping_sedex || undefined,
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
    completed: 'concluido',
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
  // Prefer seller's listing photo, fall back to card base reference image
  const listingImages = listing?.images as string[] | null;
  const listingImageUrl = listingImages?.[0] ?? cardBase?.image_url ?? undefined;
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
    shippingCost: row.shipping_cost ?? 0,
    shippingMethod: row.shipping_method ?? undefined,
    insuranceOptedIn: row.insurance_opted_in ?? false,
    insuranceCost: row.insurance_cost ?? 0,
    purchaseGroupId: row.purchase_group_id ?? undefined,
    deliveryAddress: row.purchase_group ? {
      recipientName: row.purchase_group.delivery_recipient_name,
      addressLine: row.purchase_group.delivery_address_line,
      addressNumber: row.purchase_group.delivery_address_number ?? undefined,
      complement: row.purchase_group.delivery_complement ?? undefined,
      neighborhood: row.purchase_group.delivery_neighborhood ?? undefined,
      city: row.purchase_group.delivery_city,
      state: row.purchase_group.delivery_state,
      zip: row.purchase_group.delivery_zip,
    } : undefined,
    freeShipping: listing?.free_shipping ?? false,
    freeShippingPac: listing?.free_shipping_pac ?? false,
    freeShippingSedex: listing?.free_shipping_sedex ?? false,
    listingImageUrl,
    createdAt: row.created_at,
    trackingCode: row.tracking_code ?? undefined,
    mpPaymentId: row.mp_payment_id ?? undefined,
    paidAt: row.paid_at ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReview(row: any, buyerName: string): Review {
  return {
    id: row.id,
    orderId: row.order_id,
    sellerId: row.seller_id,
    buyerName,
    rating: row.rating,
    comment: row.comment ?? '',
    sellerReply: row.seller_reply ?? undefined,
    repliedAt: row.replied_at ?? undefined,
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
  gradingGroup?: 'nacional' | 'internacional';
  company?: string;
  language?: CardLanguageGroup;
}): Promise<CardBaseWithStats[]> {
  // Start from active listings, then fetch only the card_bases they reference.
  // The opposite direction (fetch every card_base, then filter by listings)
  // silently breaks at >1000 catalog rows because of Supabase's default row
  // cap — listings on cards outside that slice would disappear from the grid.
  let listingsQuery = supabase
    .from('listings')
    .select('card_base_id, price, grade_company, created_at')
    .eq('status', 'active' as string);

  if (filters?.company) {
    listingsQuery = listingsQuery.eq('grade_company', filters.company);
  } else if (filters?.gradingGroup) {
    const { getCompaniesForGroup } = await import('@/lib/grading-groups');
    const companies = getCompaniesForGroup(filters.gradingGroup);
    listingsQuery = listingsQuery.in('grade_company', companies);
  }

  const { data: listingRows, error: lErr } = await listingsQuery;
  logIfError('getCardBasesWithStats.listings', lErr);
  const listingsArr = (listingRows ?? []) as Pick<ListingRow, 'card_base_id' | 'price' | 'grade_company' | 'created_at'>[];
  if (!listingsArr.length) return [];

  // Aggregate prices and track the freshest listing timestamp per card.
  // "Mais recentes" sorts by this — that way a new listing on an existing
  // card bumps the card to the top, instead of being hidden in the group.
  const listingsByCard: Record<string, number[]> = {};
  const newestListingAt: Record<string, number> = {};
  for (const l of listingsArr) {
    if (!listingsByCard[l.card_base_id]) listingsByCard[l.card_base_id] = [];
    listingsByCard[l.card_base_id].push(l.price);
    const ts = new Date(l.created_at).getTime();
    if (!newestListingAt[l.card_base_id] || ts > newestListingAt[l.card_base_id]) {
      newestListingAt[l.card_base_id] = ts;
    }
  }
  const cardBaseIds = Object.keys(listingsByCard);

  // Fetch the referenced card_bases, applying catalog-level filters here.
  // Chunk the .in() lookup to stay well clear of any URL/length limits.
  const cardBaseRows: CardBaseRow[] = [];
  const CHUNK = 200;
  for (let i = 0; i < cardBaseIds.length; i += CHUNK) {
    const slice = cardBaseIds.slice(i, i + CHUNK);
    let cbQuery = supabase.from('card_bases').select('*').in('id', slice);
    if (filters?.search) {
      const s = filters.search;
      cbQuery = cbQuery.or(`name.ilike.%${s}%,set_name.ilike.%${s}%,number.ilike.%${s}%`);
    }
    if (filters?.type) {
      cbQuery = cbQuery.eq('type', filters.type as string);
    }
    if (filters?.language) {
      cbQuery = cbQuery.eq('language_group', filters.language as string);
    }
    const { data, error } = await cbQuery;
    logIfError('getCardBasesWithStats.card_bases', error);
    if (data) cardBaseRows.push(...(data as CardBaseRow[]));
  }

  const stats: CardBaseWithStats[] = cardBaseRows.map(row => {
    const prices = listingsByCard[row.id] ?? [];
    return {
      cardBase: mapCardBase(row),
      listingCount: prices.length,
      lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
      highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
    };
  });

  if (filters?.sort === 'price_asc') {
    stats.sort((a, b) => a.lowestPrice - b.lowestPrice);
  } else if (filters?.sort === 'price_desc') {
    stats.sort((a, b) => b.lowestPrice - a.lowestPrice);
  } else {
    // Default / "newest": freshest listing per card wins.
    stats.sort((a, b) => (newestListingAt[b.cardBase.id] ?? 0) - (newestListingAt[a.cardBase.id] ?? 0));
  }

  return stats;
}

export async function getCardBase(id: string): Promise<CardBase | null> {
  const { data, error } = await supabase
    .from('card_bases')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  logIfError('getCardBase', error);
  return data ? mapCardBase(data) : null;
}

// ════════════════════════════════════════════════
// Listings
// ════════════════════════════════════════════════

export async function getListingsForCard(cardBaseId: string): Promise<Listing[]> {
  // First, expire any stale reserved listings for this card
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservedIds } = await (supabase as any)
    .from('listings')
    .select('id')
    .eq('card_base_id', cardBaseId)
    .eq('status', 'reserved' as string);
  if (reservedIds?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc('expire_stale_orders', {
      p_listing_ids: reservedIds.map((r: any) => r.id),
    });
  }

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('card_base_id', cardBaseId)
    .in('status', ['active', 'reserved'] as string[])
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
    .limit(200);
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
    supabase.from('seller_profiles').select('*').eq('id', id).maybeSingle(),
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

/** Global search across cards (with stats) and sellers */
export async function searchAll(query: string): Promise<{
  cards: CardBaseWithStats[];
  sellers: Seller[];
}> {
  const q = query.trim();
  if (!q) return { cards: [], sellers: [] };

  // Search cards using the existing function (handles name, set_name, number)
  const cards = await getCardBasesWithStats({ search: q });

  // Search sellers by store_name
  const { data: sellerData, error: sellerErr } = await supabase
    .from('seller_profiles')
    .select('*')
    .ilike('store_name', `%${q}%`);
  logIfError('searchAll.sellers', sellerErr);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sellerRows = (sellerData ?? []) as any[];
  const sellerProfiles = sellerRows.length
    ? await fetchProfilesByIds(sellerRows.map(r => r.id))
    : {};
  const sellers = sellerRows.map(r => mapSeller({ ...r, profiles: sellerProfiles[r.id] ?? {} }));

  return { cards, sellers };
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
    if (row.grade_company === 'OTHER') continue;
    const d = new Date(row.sold_at);
    const monthName = d.toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '')
      .replace(/^(\w)/, (_, c) => c.toUpperCase());
    const month = `${monthName}/${String(d.getFullYear()).slice(-2)}`;
    const key = `${month}|${row.language}|${row.grade_company}|${row.grade}|${row.pristine ? '1' : '0'}`;
    if (!groups[key]) groups[key] = { total: 0, count: 0 };
    groups[key].total += row.sale_price;
    groups[key].count += 1;
  }

  return Object.entries(groups).map(([key, { total, count }]) => {
    const [month, language, company, grade, pristineFlag] = key.split('|');
    return {
      month,
      language: language as PricePoint['language'],
      company,
      grade: Number(grade),
      pristine: pristineFlag === '1',
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
    .limit(200);
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
    .maybeSingle();

  // Batch-fetch user profiles + seller name
  const userIds = rows.map(r => r.user_id);
  const sellerId = (listing as any)?.seller_id;

  const [profiles, { data: sellerData }] = await Promise.all([
    fetchProfilesByIds(userIds),
    sellerId
      ? supabase.from('seller_profiles').select('store_name').eq('id', sellerId).maybeSingle()
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
  listing:listings(card_base_id, grade, grade_company, images, free_shipping, free_shipping_pac, free_shipping_sedex, card_base:card_bases(name, image_url)),
  purchase_group:purchase_groups(delivery_recipient_name, delivery_address_line, delivery_address_number, delivery_complement, delivery_neighborhood, delivery_city, delivery_state, delivery_zip)
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
    .maybeSingle();

  if (!data) return null;
  const orders = await enrichOrders([data]);
  return orders[0] ?? null;
}

// ════════════════════════════════════════════════
// Specialized queries for pages
// ════════════════════════════════════════════════

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

  // Split the query into words and require every word to match somewhere
  // (name OR set_name OR number). Chained .or() calls are AND-ed together by
  // PostgREST, so "Umbreon VMAX 215" matches name "Umbreon VMAX" + number 215,
  // and "Umbreon Evolving Skies" matches name + set_name.
  const words = query
    .trim()
    .split(/\s+/)
    // strip characters that would break PostgREST's or() filter grammar
    .map((w) => w.replace(/[,()*]/g, '').trim())
    .filter(Boolean)
    .slice(0, 6); // cap to keep the query bounded

  if (words.length === 0) return [];

  let q = supabase.from('card_bases').select('*');
  for (const word of words) {
    q = q.or(`name.ilike.%${word}%,set_name.ilike.%${word}%,number.ilike.%${word}%`);
  }

  const { data, error } = await q.order('name', { ascending: true }).limit(20);
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
  language: CardLanguage;
  price: number; // in centavos
  freeShippingPac: boolean;
  freeShippingSedex: boolean;
  conditionNotes?: string;
  imageFiles: (File | null)[];
};

export type CreateListingResult =
  | { success: true; listingId: string }
  | { success: false; error: string };

export async function createListing(input: CreateListingInput): Promise<CreateListingResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // ── Antifraude: enforce limits for new sellers ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sellerProfile } = await (supabase as any)
    .from('seller_profiles')
    .select('verified')
    .eq('id', user.id)
    .maybeSingle() as { data: { verified: boolean } | null };

  if (sellerProfile && !sellerProfile.verified) {
    const maxListingsVal = await getPlatformConfig('new_seller_max_listings');
    const maxPriceVal = await getPlatformConfig('new_seller_max_price');
    const maxListings = typeof maxListingsVal === 'number' ? maxListingsVal : (typeof maxListingsVal === 'string' ? parseInt(maxListingsVal, 10) : 5);
    const maxPrice = typeof maxPriceVal === 'number' ? maxPriceVal : (typeof maxPriceVal === 'string' ? parseInt(maxPriceVal, 10) : 50000);

    // Check active listing count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .in('status', ['active', 'reserved']);
    if (count !== null && count >= maxListings) {
      return { success: false, error: `Vendedores novos podem ter no máximo ${maxListings} anúncios ativos. Verifique sua conta para aumentar o limite.` };
    }

    // Check price limit
    if (input.price > maxPrice) {
      return { success: false, error: `Vendedores novos podem anunciar no máximo R$ ${(maxPrice / 100).toFixed(2).replace('.', ',')}. Verifique sua conta para aumentar o limite.` };
    }
  }

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
    // Legacy column mirrors the per-method flags (true when ANY method is free)
    // so existing read paths (badges, sales breakdown) keep working unchanged.
    free_shipping: input.freeShippingPac || input.freeShippingSedex,
    free_shipping_pac: input.freeShippingPac,
    free_shipping_sedex: input.freeShippingSedex,
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
  freeShippingPac?: boolean;
  freeShippingSedex?: boolean;
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
  if (input.freeShippingPac !== undefined) updates.free_shipping_pac = input.freeShippingPac;
  if (input.freeShippingSedex !== undefined) updates.free_shipping_sedex = input.freeShippingSedex;
  // Keep the legacy column in sync whenever either per-method flag changes.
  if (input.freeShippingPac !== undefined || input.freeShippingSedex !== undefined) {
    const pacNext = input.freeShippingPac ?? undefined;
    const sedexNext = input.freeShippingSedex ?? undefined;
    if (pacNext !== undefined && sedexNext !== undefined) {
      updates.free_shipping = pacNext || sedexNext;
    } else {
      // Only one flag is changing; recompute from the current row's other flag.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: current } = await (supabase as any)
        .from('listings')
        .select('free_shipping_pac, free_shipping_sedex')
        .eq('id', listingId)
        .maybeSingle() as { data: { free_shipping_pac: boolean; free_shipping_sedex: boolean } | null };
      const pac = pacNext ?? current?.free_shipping_pac ?? false;
      const sedex = sedexNext ?? current?.free_shipping_sedex ?? false;
      updates.free_shipping = pac || sedex;
    }
  }
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

export async function becomeSeller(
  storeName: string,
  description?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (supabase as any)
    .from('profiles')
    .update({ role: 'seller', updated_at: new Date().toISOString() })
    .eq('id', user.id);
  if (profileError) return { success: false, error: profileError.message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: spError } = await (supabase as any)
    .from('seller_profiles')
    .insert({ id: user.id, store_name: storeName, description: description || null });
  if (spError) return { success: false, error: spError.message };

  return { success: true };
}

export const NICKNAME_COOLDOWN_DAYS = 90;

export async function updateProfile(input: {
  full_name?: string;
  phone?: string;
  nickname?: string;
  rg?: string;
  date_of_birth?: string;
  cpf_hash?: string;
  account_type?: 'individual' | 'business';
  cnpj?: string;
  razao_social?: string;
  address_zip?: string;
  address_line?: string;
  address_number?: string;
  address_complement?: string;
  address_city?: string;
  address_state?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'Não autenticado' };

  // If nickname is being changed, enforce 90-day cooldown
  const updates: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() };
  if (input.nickname !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: current } = await (supabase as any)
      .from('profiles')
      .select('nickname, nickname_changed_at')
      .eq('id', user.id)
      .single();
    const currentNickname = (current as { nickname: string | null; nickname_changed_at: string | null } | null);
    if (currentNickname && currentNickname.nickname !== input.nickname) {
      // Nickname is actually changing — check cooldown
      if (currentNickname.nickname_changed_at) {
        const lastChange = new Date(currentNickname.nickname_changed_at).getTime();
        const cooldownMs = NICKNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
        const elapsed = Date.now() - lastChange;
        if (elapsed < cooldownMs) {
          const daysLeft = Math.ceil((cooldownMs - elapsed) / (24 * 60 * 60 * 1000));
          return { success: false, error: `Você só pode alterar o apelido a cada ${NICKNAME_COOLDOWN_DAYS} dias. Próxima alteração disponível em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}.` };
        }
      }
      updates.nickname_changed_at = new Date().toISOString();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) { logIfError('updateProfile', error); return { success: false, error: error.message }; }
  return { success: true };
}

export async function getSellerCep(sellerId: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('profiles')
    .select('address_zip')
    .eq('id', sellerId)
    .single();
  return data?.address_zip ?? null;
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

export type CreateOrderResult =
  | { success: true; orderId: string }
  | { success: false; error: string };

export async function createOrder(listingId: string): Promise<CreateOrderResult> {
  // Expire any stale reservation on this listing before attempting purchase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc('expire_stale_orders', { p_listing_ids: [listingId] });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('create_order', { p_listing_id: listingId });
  if (error) { logIfError('createOrder', error); return { success: false, error: error.message }; }
  const result = data as { success: boolean; orderId?: string; error?: string };
  if (!result.success) return { success: false, error: result.error ?? 'Erro ao criar pedido' };
  return { success: true, orderId: result.orderId! };
}

export async function updateOrderShipping(
  orderId: string,
  shippingCost: number,
  shippingMethod?: string | null,
  insuranceCost: number = 0,
  insuranceOptedIn: boolean = false,
): Promise<{ success: true } | { success: false; error: string }> {
  // Atomic via RPC: writes the base shipping cost, chosen method, and the
  // insurance choice in one transaction. Seller payout only ever deducts the
  // base shipping cost when the chosen method is one the seller marked free;
  // insurance is always the buyer's expense.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('update_order_shipping', {
    p_order_id: orderId,
    p_shipping_cost: shippingCost,
    p_shipping_method: shippingMethod ?? null,
    p_insurance_cost: insuranceCost,
    p_insurance_opted_in: insuranceOptedIn,
  });
  if (error) { logIfError('updateOrderShipping', error); return { success: false, error: error.message }; }
  if (data && data.success === false) return { success: false, error: data.error ?? 'Erro ao atualizar frete' };
  return { success: true };
}

export async function cancelOrder(orderId: string): Promise<{ success: true } | { success: false; error: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('cancel_order', { p_order_id: orderId });
  if (error) { logIfError('cancelOrder', error); return { success: false, error: error.message }; }
  const result = data as { success: boolean; error?: string };
  if (!result.success) return { success: false, error: result.error ?? 'Erro ao cancelar pedido' };

  return { success: true };
}

export async function shipOrder(
  orderId: string,
  trackingCode: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('orders')
    .update({
      status: 'shipped',
      tracking_code: trackingCode,
      shipped_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('seller_id', user.id)
    .in('status', ['payment_confirmed', 'awaiting_shipment']);

  if (error) { logIfError('shipOrder', error); return { success: false, error: error.message }; }
  return { success: true };
}

export async function confirmDelivery(
  orderId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('orders')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('buyer_id', user.id)
    .eq('status', 'shipped');

  if (error) { logIfError('confirmDelivery', error); return { success: false, error: error.message }; }
  return { success: true };
}

export async function updateSellerVerification(
  sellerId: string,
  verified: boolean,
): Promise<{ success: true } | { success: false; error: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('seller_profiles')
    .update({ verified })
    .eq('id', sellerId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ════════════════════════════════════════════════
// Question Mutations
// ════════════════════════════════════════════════

export async function createQuestion(
  listingId: string,
  question: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('questions')
    .insert({ listing_id: listingId, user_id: user.id, question });

  if (error) { logIfError('createQuestion', error); return { success: false, error: error.message }; }
  return { success: true };
}

export async function answerQuestion(
  questionId: string,
  answer: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('questions')
    .update({ answer, answered_at: new Date().toISOString() })
    .eq('id', questionId);

  if (error) { logIfError('answerQuestion', error); return { success: false, error: error.message }; }
  return { success: true };
}

/** Fetch all questions on the current seller's listings (unanswered first). */
export async function getMyQuestions(): Promise<Question[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get all listing IDs owned by this seller
  const { data: listings } = await supabase
    .from('listings')
    .select('id, card_base_id')
    .eq('seller_id', user.id);
  if (!listings?.length) return [];

  const listingIds = listings.map((l: { id: string }) => l.id);

  // Fetch questions for those listings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questions } = await (supabase as any)
    .from('questions')
    .select('*')
    .in('listing_id', listingIds)
    .order('created_at', { ascending: false });

  const rows = (questions ?? []) as any[];
  if (!rows.length) return [];

  // Fetch card base names
  const cardBaseIds = Array.from(new Set(listings.map((l: { card_base_id: string }) => l.card_base_id)));
  const { data: cardBases } = await supabase
    .from('card_bases')
    .select('id, name')
    .in('id', cardBaseIds);
  const cardBaseMap: Record<string, string> = {};
  (cardBases ?? []).forEach((cb: { id: string; name: string }) => { cardBaseMap[cb.id] = cb.name; });

  // Map listing_id → card_base_id
  const listingCardMap: Record<string, string> = {};
  listings.forEach((l: { id: string; card_base_id: string }) => { listingCardMap[l.id] = l.card_base_id; });

  // Fetch user profiles for question authors
  const userIds = Array.from(new Set(rows.map((r: any) => r.user_id)));
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
  const profileMap: Record<string, string> = {};
  (profiles ?? []).forEach((p: { id: string; full_name: string }) => { profileMap[p.id] = p.full_name; });

  // Get seller name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sellerProfile } = await (supabase as any).from('seller_profiles').select('store_name').eq('id', user.id).single();
  const sellerName = (sellerProfile as any)?.store_name ?? 'Vendedor';

  return rows.map((r: any) => ({
    id: r.id,
    listingId: r.listing_id,
    sellerId: user.id,
    sellerName,
    userName: profileMap[r.user_id] ?? 'Usuário',
    question: r.question,
    answer: r.answer ?? undefined,
    questionDate: r.created_at,
    answerDate: r.answered_at ?? undefined,
    cardName: cardBaseMap[listingCardMap[r.listing_id]] ?? 'Carta',
    cardBaseId: listingCardMap[r.listing_id],
  }));
}

// ════════════════════════════════════════════════
// Private Order Messages
// ════════════════════════════════════════════════

export async function getMessagesForOrder(orderId: string): Promise<Message[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  logIfError('getMessagesForOrder', error);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  if (!rows.length) return [];

  const senderIds = rows.map(r => r.sender_id);
  const profiles = await fetchProfilesByIds(senderIds);

  return rows.map(r => ({
    id: r.id,
    orderId: r.order_id,
    senderId: r.sender_id,
    senderName: profiles[r.sender_id]?.full_name ?? 'Usuário',
    content: r.content,
    readAt: r.read_at ?? undefined,
    createdAt: r.created_at,
    isOwn: r.sender_id === user.id,
  }));
}

export async function sendMessage(
  orderId: string,
  content: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('messages')
    .insert({ order_id: orderId, sender_id: user.id, content });

  if (error) { logIfError('sendMessage', error); return { success: false, error: error.message }; }
  return { success: true };
}

export async function markMessagesRead(orderId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Mark all messages in this order that were NOT sent by the current user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .neq('sender_id', user.id)
    .is('read_at', null);
}

// ════════════════════════════════════════════════
// Review Mutations
// ════════════════════════════════════════════════

export async function createReview(
  orderId: string,
  sellerId: string,
  rating: number,
  comment: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('reviews')
    .insert({
      order_id: orderId,
      seller_id: sellerId,
      buyer_id: user.id,
      rating,
      comment,
    });

  if (error) {
    logIfError('createReview', error);
    if (error.code === '23505') return { success: false, error: 'Você já avaliou este pedido' };
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function replyToReview(
  reviewId: string,
  reply: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('reviews')
    .update({ seller_reply: reply, replied_at: new Date().toISOString() })
    .eq('id', reviewId)
    .eq('seller_id', user.id);

  if (error) { logIfError('replyToReview', error); return { success: false, error: error.message }; }
  return { success: true };
}

/** Check if current user has already reviewed an order */
export async function getReviewForOrder(orderId: string): Promise<Review | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const profiles = await fetchProfilesByIds([row.buyer_id]);
  return mapReview(row, profiles[row.buyer_id]?.full_name ?? 'Comprador');
}

// ════════════════════════════════════════════════
// Disputes
// ════════════════════════════════════════════════

export async function openDispute(
  orderId: string,
  reason: string,
  description?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: disputeError } = await (supabase as any)
    .from('disputes')
    .insert({
      order_id: orderId,
      opened_by: user.id,
      reason,
      description: description || null,
      status: 'open',
    });

  if (disputeError) {
    logIfError('openDispute', disputeError);
    if (disputeError.code === '23505') return { success: false, error: 'Já existe uma disputa para este pedido' };
    return { success: false, error: disputeError.message };
  }

  // Update order status to disputed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('orders')
    .update({ status: 'disputed' })
    .eq('id', orderId);

  // Change listing status from 'sold' to 'reserved' while in dispute
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orderData } = await (supabase as any)
    .from('orders')
    .select('listing_id')
    .eq('id', orderId)
    .single();

  if (orderData?.listing_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('listings')
      .update({ status: 'reserved' })
      .eq('id', orderData.listing_id);
  }

  return { success: true };
}

export async function getAllDisputes(): Promise<Dispute[]> {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .order('created_at', { ascending: false });
  logIfError('getAllDisputes', error);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  if (!rows.length) return [];

  const openerIds = rows.map(r => r.opened_by);
  const profiles = await fetchProfilesByIds(openerIds);

  return rows.map(r => ({
    id: r.id,
    orderId: r.order_id,
    openedBy: r.opened_by,
    openedByName: profiles[r.opened_by]?.full_name ?? 'Usuário',
    reason: r.reason,
    description: r.description ?? undefined,
    sellerResponse: r.seller_response ?? undefined,
    status: r.status as DisputeStatus,
    adminNotes: r.admin_notes ?? undefined,
    resolvedAt: r.resolved_at ?? undefined,
    createdAt: r.created_at,
  }));
}

export async function getDisputeByOrder(orderId: string): Promise<Dispute | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('disputes')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error || !data) return null;

  const profiles = await fetchProfilesByIds([data.opened_by]);
  return {
    id: data.id,
    orderId: data.order_id,
    openedBy: data.opened_by,
    openedByName: profiles[data.opened_by]?.full_name ?? 'Usuário',
    reason: data.reason,
    description: data.description ?? undefined,
    sellerResponse: data.seller_response ?? undefined,
    status: data.status as DisputeStatus,
    adminNotes: data.admin_notes ?? undefined,
    resolvedAt: data.resolved_at ?? undefined,
    createdAt: data.created_at,
  };
}

export async function respondToDispute(
  orderId: string,
  response: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const res = await fetch('/api/disputes/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, response }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error ?? 'Erro ao enviar resposta' };
    return { success: true };
  } catch {
    return { success: false, error: 'Erro de conexão' };
  }
}

export async function resolveDispute(
  disputeId: string,
  status: DisputeStatus,
  adminNotes: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('disputes')
    .update({
      status,
      admin_notes: adminNotes,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', disputeId);

  if (error) { logIfError('resolveDispute', error); return { success: false, error: error.message }; }

  // Get the order linked to this dispute to update listing status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dispute } = await (supabase as any)
    .from('disputes')
    .select('order_id')
    .eq('id', disputeId)
    .single();

  if (dispute?.order_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orderData } = await (supabase as any)
      .from('orders')
      .select('listing_id')
      .eq('id', dispute.order_id)
      .single();

    if (orderData?.listing_id) {
      if (status === 'resolved_buyer') {
        // Buyer wins — listing goes back to active (available for sale)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('listings').update({ status: 'active' }).eq('id', orderData.listing_id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('orders').update({ status: 'cancelled' }).eq('id', dispute.order_id);
      } else if (status === 'resolved_seller' || status === 'closed') {
        // Seller wins — listing stays sold, order back to previous flow
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('listings').update({ status: 'sold' }).eq('id', orderData.listing_id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('orders').update({ status: 'completed' }).eq('id', dispute.order_id);
      }
    }
  }

  // Log admin action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('admin_event_log')
    .insert({
      admin_id: user.id,
      action: 'resolve_dispute',
      entity_type: 'dispute',
      entity_id: disputeId,
      details: { status, adminNotes },
    });

  return { success: true };
}

// ════════════════════════════════════════════════
// Platform Config
// ════════════════════════════════════════════════

export async function getPlatformConfig(key: string): Promise<unknown> {
  const { data } = await supabase
    .from('platform_config')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any)?.value ?? null;
}

// ════════════════════════════════════════════════
// Seller Balance, PIX, and Withdrawals (Items 2.9 + 2.10)
// ════════════════════════════════════════════════

export interface SellerBalance {
  availableCentavos: number;
  pendingCentavos: number;
}

export interface BalanceTransaction {
  orderId: string;
  cardName: string;
  saleDateISO: string;
  status: string;
  priceCentavos: number;
  platformFeeCentavos: number;
  sellerPayoutCentavos: number;
  shippingCostCentavos: number; // 0 if no shipping or buyer paid
  sellerPaidShipping: boolean;  // true when listing.free_shipping was on (shipping deducted from payout)
}

export interface SellerPix {
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  status: 'active' | 'pending_approval';
  pendingPixKey?: string;
  pendingPixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  rejectedPixKey?: string;
  rejectedPixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  rejectedReason?: string;
}

export interface Withdrawal {
  id: string;
  amountRequestedCentavos: number;
  feeCentavos: number;
  amountPaidCentavos: number;
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  status: 'pending' | 'completed' | 'rejected';
  requestedAtISO: string;
  processedAtISO?: string;
  rejectedReason?: string;
  receiptPath?: string;
}

export interface AdminSettings {
  withdrawalFeeCentavos: number;
}

/** Get the current seller's balance (available + pending) */
export async function getMyBalance(): Promise<SellerBalance> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { availableCentavos: 0, pendingCentavos: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('seller_balance')
    .select('available_centavos, pending_centavos')
    .eq('seller_id', user.id)
    .maybeSingle();
  logIfError('getMyBalance', error);

  return {
    availableCentavos: data?.available_centavos ?? 0,
    pendingCentavos: data?.pending_centavos ?? 0,
  };
}

/** Get the current seller's transaction breakdown (per-order earnings) */
export async function getMyBalanceTransactions(): Promise<BalanceTransaction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('id, status, price, platform_fee, seller_payout, shipping_cost, paid_at, completed_at, created_at, listing_id')
    .eq('seller_id', user.id)
    .in('status', ['payment_confirmed', 'awaiting_shipment', 'shipped', 'delivered', 'completed'] as string[])
    .order('created_at', { ascending: false })
    .limit(200);
  logIfError('getMyBalanceTransactions', error);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderRows = (data ?? []) as any[];
  if (!orderRows.length) return [];

  // Fetch listings to get card names and free_shipping flag
  const listingIds = orderRows.map(o => o.listing_id);
  const { data: listingRows } = await supabase
    .from('listings')
    .select('id, card_base_id, free_shipping')
    .in('id', listingIds);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings = (listingRows ?? []) as any[];

  const cardBaseIds = Array.from(new Set(listings.map(l => l.card_base_id)));
  const { data: cardRows } = await supabase
    .from('card_bases')
    .select('id, name')
    .in('id', cardBaseIds);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardMap: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const c of (cardRows ?? []) as any[]) cardMap[c.id] = c.name;

  const listingToCard: Record<string, string> = {};
  const listingToFreeShipping: Record<string, boolean> = {};
  for (const l of listings) {
    listingToCard[l.id] = cardMap[l.card_base_id] ?? 'Carta';
    listingToFreeShipping[l.id] = !!l.free_shipping;
  }

  return orderRows.map(o => ({
    orderId: o.id,
    cardName: listingToCard[o.listing_id] ?? 'Carta',
    saleDateISO: o.paid_at ?? o.created_at,
    status: o.status,
    priceCentavos: o.price,
    platformFeeCentavos: o.platform_fee,
    sellerPayoutCentavos: o.seller_payout,
    shippingCostCentavos: o.shipping_cost ?? 0,
    sellerPaidShipping: listingToFreeShipping[o.listing_id] ?? false,
  }));
}

/** Get current seller's PIX details (or null if not set) */
export async function getMyPix(): Promise<SellerPix | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('seller_pix')
    .select('*')
    .eq('seller_id', user.id)
    .maybeSingle();
  logIfError('getMyPix', error);
  if (!data) return null;

  return {
    pixKey: data.pix_key,
    pixKeyType: data.pix_key_type,
    status: data.status,
    pendingPixKey: data.pending_pix_key ?? undefined,
    pendingPixKeyType: data.pending_pix_key_type ?? undefined,
    rejectedPixKey: data.rejected_pix_key ?? undefined,
    rejectedPixKeyType: data.rejected_pix_key_type ?? undefined,
    rejectedReason: data.rejected_reason ?? undefined,
  };
}

/** Save or update the current seller's PIX key.
 *  First save: trusted immediately.
 *  Subsequent updates: stored as pending and require admin approval. */
export async function saveMyPix(pixKey: string, pixKeyType: SellerPix['pixKeyType']): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };
  const trimmed = pixKey.trim();
  if (!trimmed) return { success: false, error: 'Chave PIX é obrigatória' };

  const existing = await getMyPix();

  if (!existing) {
    // First save: trusted immediately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('seller_pix').insert({
      seller_id: user.id,
      pix_key: trimmed,
      pix_key_type: pixKeyType,
      status: 'active',
    });
    if (error) { logIfError('saveMyPix.insert', error); return { success: false, error: error.message }; }
    return { success: true };
  }

  // Update: store as pending for admin approval; clear any previous rejection info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('seller_pix').update({
    pending_pix_key: trimmed,
    pending_pix_key_type: pixKeyType,
    status: 'pending_approval',
    rejected_reason: null,
    rejected_pix_key: null,
    rejected_pix_key_type: null,
  }).eq('seller_id', user.id);
  if (error) { logIfError('saveMyPix.update', error); return { success: false, error: error.message }; }
  return { success: true };
}

/** Get admin settings (commission rate, withdrawal fee) */
export async function getAdminSettings(): Promise<AdminSettings> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('admin_settings')
    .select('withdrawal_fee_centavos')
    .eq('id', 1)
    .maybeSingle();
  logIfError('getAdminSettings', error);
  return {
    withdrawalFeeCentavos: data?.withdrawal_fee_centavos ?? 1000,
  };
}

/** Request a withdrawal of the seller's available balance */
export async function requestWithdrawal(amountCentavos: number): Promise<{ success: true; withdrawalId: string } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };
  if (amountCentavos <= 0) return { success: false, error: 'Valor inválido' };

  const [balance, pix, settings] = await Promise.all([
    getMyBalance(),
    getMyPix(),
    getAdminSettings(),
  ]);

  if (!pix) return { success: false, error: 'Cadastre sua chave PIX antes de solicitar um saque' };
  if (pix.status === 'pending_approval') return { success: false, error: 'Sua chave PIX está em análise. Aguarde a aprovação para solicitar saque.' };
  if (amountCentavos > balance.availableCentavos) return { success: false, error: 'Saldo insuficiente' };
  if (amountCentavos <= settings.withdrawalFeeCentavos) return { success: false, error: 'Valor menor ou igual à taxa de saque' };

  const fee = settings.withdrawalFeeCentavos;
  const amountPaid = amountCentavos - fee;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from('withdrawals').insert({
    seller_id: user.id,
    amount_requested_centavos: amountCentavos,
    fee_centavos: fee,
    amount_paid_centavos: amountPaid,
    pix_key: pix.pixKey,
    pix_key_type: pix.pixKeyType,
    status: 'pending',
  }).select('id').single();
  if (error) { logIfError('requestWithdrawal', error); return { success: false, error: error.message }; }

  return { success: true, withdrawalId: (data as { id: string }).id };
}

/** Get current seller's withdrawal history */
export async function getMyWithdrawals(): Promise<Withdrawal[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('withdrawals')
    .select('*')
    .eq('seller_id', user.id)
    .order('requested_at', { ascending: false });
  logIfError('getMyWithdrawals', error);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map(w => ({
    id: w.id,
    amountRequestedCentavos: w.amount_requested_centavos,
    feeCentavos: w.fee_centavos,
    amountPaidCentavos: w.amount_paid_centavos,
    pixKey: w.pix_key,
    pixKeyType: w.pix_key_type,
    status: w.status,
    requestedAtISO: w.requested_at,
    processedAtISO: w.processed_at ?? undefined,
    rejectedReason: w.rejected_reason ?? undefined,
    receiptPath: w.receipt_path ?? undefined,
  }));
}

/** Generate a short-lived signed URL for a withdrawal receipt */
export async function getWithdrawalReceiptUrl(receiptPath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('withdrawal-receipts')
    .createSignedUrl(receiptPath, 3600);
  if (error) { logIfError('getWithdrawalReceiptUrl', error); return null; }
  return data?.signedUrl ?? null;
}

/** Upload (or replace) the receipt for a withdrawal (admin only) */
export async function uploadWithdrawalReceipt(
  withdrawalId: string,
  file: File,
): Promise<{ success: true; path: string } | { success: false; error: string }> {
  const ext = (file.name.split('.').pop() ?? 'pdf').toLowerCase();
  const path = `${withdrawalId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('withdrawal-receipts')
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (uploadError) { logIfError('uploadWithdrawalReceipt.upload', uploadError); return { success: false, error: uploadError.message }; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any).from('withdrawals').update({
    receipt_path: path,
    receipt_uploaded_at: new Date().toISOString(),
  }).eq('id', withdrawalId);
  if (updateError) { logIfError('uploadWithdrawalReceipt.update', updateError); return { success: false, error: updateError.message }; }

  return { success: true, path };
}

// ════════════════════════════════════════════════
// Admin: Withdrawals, PIX approvals, Settings
// ════════════════════════════════════════════════

export interface AdminWithdrawal extends Withdrawal {
  sellerId: string;
  sellerName: string;
}

export interface AdminPixApproval {
  sellerId: string;
  sellerName: string;
  currentPixKey: string;
  currentPixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pendingPixKey: string;
  pendingPixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  updatedAtISO: string;
}

/** Get all pending withdrawals (admin only) */
export async function getAdminPendingWithdrawals(): Promise<AdminWithdrawal[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('withdrawals')
    .select('*')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });
  logIfError('getAdminPendingWithdrawals', error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  if (!rows.length) return [];

  const sellerIds = Array.from(new Set(rows.map(r => r.seller_id)));
  const sellerMap = await fetchSellerProfilesByIds(sellerIds);

  return rows.map(w => ({
    id: w.id,
    sellerId: w.seller_id,
    sellerName: (sellerMap[w.seller_id]?.store_name as string) ?? 'Vendedor',
    amountRequestedCentavos: w.amount_requested_centavos,
    feeCentavos: w.fee_centavos,
    amountPaidCentavos: w.amount_paid_centavos,
    pixKey: w.pix_key,
    pixKeyType: w.pix_key_type,
    status: w.status,
    requestedAtISO: w.requested_at,
    processedAtISO: w.processed_at ?? undefined,
    rejectedReason: w.rejected_reason ?? undefined,
    receiptPath: w.receipt_path ?? undefined,
  }));
}

/** Get withdrawal history (completed + rejected) for admin */
export async function getAdminWithdrawalHistory(limit = 50): Promise<AdminWithdrawal[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('withdrawals')
    .select('*')
    .in('status', ['completed', 'rejected'])
    .order('processed_at', { ascending: false })
    .limit(limit);
  logIfError('getAdminWithdrawalHistory', error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  if (!rows.length) return [];

  const sellerIds = Array.from(new Set(rows.map(r => r.seller_id)));
  const sellerMap = await fetchSellerProfilesByIds(sellerIds);

  return rows.map(w => ({
    id: w.id,
    sellerId: w.seller_id,
    sellerName: (sellerMap[w.seller_id]?.store_name as string) ?? 'Vendedor',
    amountRequestedCentavos: w.amount_requested_centavos,
    feeCentavos: w.fee_centavos,
    amountPaidCentavos: w.amount_paid_centavos,
    pixKey: w.pix_key,
    pixKeyType: w.pix_key_type,
    status: w.status,
    requestedAtISO: w.requested_at,
    processedAtISO: w.processed_at ?? undefined,
    rejectedReason: w.rejected_reason ?? undefined,
    receiptPath: w.receipt_path ?? undefined,
  }));
}

/** Process a withdrawal: mark as completed or reject (admin only).
 *  When completing, optionally attach a payment receipt file. */
export async function processWithdrawal(
  withdrawalId: string,
  action: 'complete' | 'reject',
  rejectedReason?: string,
  receiptFile?: File | null,
): Promise<{ success: true } | { success: false; error: string }> {
  const updates: Record<string, unknown> = {
    status: action === 'complete' ? 'completed' : 'rejected',
    processed_at: new Date().toISOString(),
  };
  if (action === 'reject' && rejectedReason) updates.rejected_reason = rejectedReason;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('withdrawals')
    .update(updates)
    .eq('id', withdrawalId);
  if (error) { logIfError('processWithdrawal', error); return { success: false, error: error.message }; }

  if (action === 'complete' && receiptFile) {
    const upload = await uploadWithdrawalReceipt(withdrawalId, receiptFile);
    if (!upload.success) return upload;
  }
  return { success: true };
}

/** Get all sellers with pending PIX approval (admin only) */
export async function getAdminPendingPixApprovals(): Promise<AdminPixApproval[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('seller_pix')
    .select('*')
    .eq('status', 'pending_approval')
    .order('updated_at', { ascending: true });
  logIfError('getAdminPendingPixApprovals', error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  if (!rows.length) return [];

  const sellerIds = rows.map(r => r.seller_id);
  const sellerMap = await fetchSellerProfilesByIds(sellerIds);

  return rows.map(r => ({
    sellerId: r.seller_id,
    sellerName: (sellerMap[r.seller_id]?.store_name as string) ?? 'Vendedor',
    currentPixKey: r.pix_key,
    currentPixKeyType: r.pix_key_type,
    pendingPixKey: r.pending_pix_key,
    pendingPixKeyType: r.pending_pix_key_type,
    updatedAtISO: r.updated_at,
  }));
}

/** Approve or reject a PIX key change (admin only) */
export async function processPixApproval(
  sellerId: string,
  action: 'approve' | 'reject',
  rejectedReason?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  const adminId = user?.id ?? null;

  // Snapshot pending values up front so we can both update seller_pix and log the decision
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (supabase as any)
    .from('seller_pix')
    .select('pending_pix_key, pending_pix_key_type')
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (action === 'approve') {
    if (!row || !row.pending_pix_key) return { success: false, error: 'Sem chave pendente para aprovar' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('seller_pix').update({
      pix_key: row.pending_pix_key,
      pix_key_type: row.pending_pix_key_type,
      pending_pix_key: null,
      pending_pix_key_type: null,
      status: 'active',
      rejected_reason: null,
    }).eq('seller_id', sellerId);
    if (error) { logIfError('processPixApproval.approve', error); return { success: false, error: error.message }; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('pix_approval_log').insert({
      seller_id: sellerId,
      proposed_pix_key: row.pending_pix_key,
      proposed_pix_key_type: row.pending_pix_key_type,
      decision: 'approved',
      decided_by: adminId,
    });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('seller_pix').update({
      rejected_pix_key: row?.pending_pix_key ?? null,
      rejected_pix_key_type: row?.pending_pix_key_type ?? null,
      pending_pix_key: null,
      pending_pix_key_type: null,
      status: 'active',
      rejected_reason: rejectedReason ?? 'Rejeitado pelo administrador',
    }).eq('seller_id', sellerId);
    if (error) { logIfError('processPixApproval.reject', error); return { success: false, error: error.message }; }

    if (row?.pending_pix_key) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('pix_approval_log').insert({
        seller_id: sellerId,
        proposed_pix_key: row.pending_pix_key,
        proposed_pix_key_type: row.pending_pix_key_type,
        decision: 'rejected',
        rejected_reason: rejectedReason ?? 'Rejeitado pelo administrador',
        decided_by: adminId,
      });
    }
  }
  return { success: true };
}

export interface AdminPixApprovalHistoryEntry {
  id: string;
  sellerId: string;
  sellerName: string;
  proposedPixKey: string;
  proposedPixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  decision: 'approved' | 'rejected';
  rejectedReason?: string;
  decidedAtISO: string;
}

/** Get PIX approval history (approved + rejected) for admin */
export async function getAdminPixApprovalHistory(limit = 50): Promise<AdminPixApprovalHistoryEntry[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('pix_approval_log')
    .select('*')
    .order('decided_at', { ascending: false })
    .limit(limit);
  logIfError('getAdminPixApprovalHistory', error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  if (!rows.length) return [];

  const sellerIds = Array.from(new Set(rows.map(r => r.seller_id)));
  const sellerMap = await fetchSellerProfilesByIds(sellerIds);

  return rows.map(r => ({
    id: r.id,
    sellerId: r.seller_id,
    sellerName: (sellerMap[r.seller_id]?.store_name as string) ?? 'Vendedor',
    proposedPixKey: r.proposed_pix_key,
    proposedPixKeyType: r.proposed_pix_key_type,
    decision: r.decision,
    rejectedReason: r.rejected_reason ?? undefined,
    decidedAtISO: r.decided_at,
  }));
}

/** Update admin settings (commission rate, withdrawal fee) (admin only) */
export async function updateAdminSettings(
  withdrawalFeeCentavos: number,
): Promise<{ success: true } | { success: false; error: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('admin_settings').update({
    withdrawal_fee_centavos: withdrawalFeeCentavos,
  }).eq('id', 1);
  if (error) { logIfError('updateAdminSettings', error); return { success: false, error: error.message }; }
  return { success: true };
}

// ════════════════════════════════════════════════
// Seller Tiers (Bronze / Prata / Ouro)
// ════════════════════════════════════════════════

export interface SellerTier {
  id: string;
  name: string;                       // 'Bronze' | 'Prata' | 'Ouro'
  displayOrder: number;
  commissionRate: number;             // percentage, e.g. 11.00
  minQuarterlyCentavos: number;
}

export interface MyTierProgress {
  currentTier: SellerTier;
  nextTier: SellerTier | null;        // null if at the top
  quarterVolumeCentavos: number;
  toNextTierCentavos: number;         // 0 if no next tier or already over threshold
  locked: boolean;
}

export interface AdminSellerWithTier {
  sellerId: string;
  storeName: string;
  tier: SellerTier;
  tierLocked: boolean;
  quarterVolumeCentavos: number;
}

/** Read all tier definitions, ordered Bronze → Ouro */
export async function getSellerTiers(): Promise<SellerTier[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('seller_tiers')
    .select('*')
    .order('display_order', { ascending: true });
  logIfError('getSellerTiers', error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map(t => ({
    id: t.id,
    name: t.name,
    displayOrder: t.display_order,
    commissionRate: Number(t.commission_rate),
    minQuarterlyCentavos: t.min_quarterly_centavos,
  }));
}

/** Lookup a single seller's tier (for public profile badge) */
export async function getSellerTier(sellerId: string): Promise<SellerTier | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('seller_profiles')
    .select('tier:seller_tiers(*)')
    .eq('id', sellerId)
    .maybeSingle();
  logIfError('getSellerTier', error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (data as any)?.tier;
  if (!t) return null;
  return {
    id: t.id,
    name: t.name,
    displayOrder: t.display_order,
    commissionRate: Number(t.commission_rate),
    minQuarterlyCentavos: t.min_quarterly_centavos,
  };
}

/** Current seller's tier + this quarter's progress to next tier */
export async function getMyTierProgress(): Promise<MyTierProgress | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [tiers, profileRes, volumeRes] = await Promise.all([
    getSellerTiers(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('seller_profiles')
      .select('tier_id, tier_locked')
      .eq('id', user.id)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('seller_quarterly_sales')
      .select('quarter_volume_centavos')
      .eq('seller_id', user.id)
      .maybeSingle(),
  ]);
  logIfError('getMyTierProgress.profile', profileRes.error);
  logIfError('getMyTierProgress.volume', volumeRes.error);

  if (!tiers.length) return null;
  const profile = profileRes.data;
  const currentTier = tiers.find(t => t.id === profile?.tier_id) ?? tiers[0];
  const nextTier = tiers.find(t => t.displayOrder === currentTier.displayOrder + 1) ?? null;
  const quarterVolume = volumeRes.data?.quarter_volume_centavos ?? 0;
  const toNext = nextTier ? Math.max(0, nextTier.minQuarterlyCentavos - quarterVolume) : 0;

  return {
    currentTier,
    nextTier,
    quarterVolumeCentavos: quarterVolume,
    toNextTierCentavos: toNext,
    locked: !!profile?.tier_locked,
  };
}

/** Admin: list all sellers with their current tier and current quarter sales */
export async function getAdminSellersWithTiers(): Promise<AdminSellerWithTier[]> {
  const tiers = await getSellerTiers();
  const tierMap = new Map(tiers.map(t => [t.id, t]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sellers, error } = await (supabase as any)
    .from('seller_profiles')
    .select('id, store_name, tier_id, tier_locked')
    .order('store_name', { ascending: true });
  logIfError('getAdminSellersWithTiers.sellers', error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sellerRows = (sellers ?? []) as any[];
  if (!sellerRows.length) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: volumes } = await (supabase as any)
    .from('seller_quarterly_sales')
    .select('seller_id, quarter_volume_centavos')
    .in('seller_id', sellerRows.map(s => s.id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volMap = new Map(((volumes ?? []) as any[]).map(v => [v.seller_id, v.quarter_volume_centavos]));

  return sellerRows.map(s => ({
    sellerId: s.id,
    storeName: s.store_name,
    tier: tierMap.get(s.tier_id) ?? tiers[0],
    tierLocked: !!s.tier_locked,
    quarterVolumeCentavos: (volMap.get(s.id) ?? 0) as number,
  }));
}

/** Admin: assign a seller to a specific tier (with optional lock) */
export async function setSellerTier(
  sellerId: string,
  tierId: string,
  locked: boolean,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('seller_profiles').update({
    tier_id: tierId,
    tier_locked: locked,
    tier_assigned_at: new Date().toISOString(),
    tier_assigned_by: user?.id ?? null,
  }).eq('id', sellerId);
  if (error) { logIfError('setSellerTier', error); return { success: false, error: error.message }; }
  return { success: true };
}

/** Admin: edit a tier definition (rate and/or threshold) */
export async function updateTierDefinition(
  tierId: string,
  commissionRate: number,
  minQuarterlyCentavos: number,
): Promise<{ success: true } | { success: false; error: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('seller_tiers').update({
    commission_rate: commissionRate,
    min_quarterly_centavos: minQuarterlyCentavos,
  }).eq('id', tierId);
  if (error) { logIfError('updateTierDefinition', error); return { success: false, error: error.message }; }
  return { success: true };
}

// ════════════════════════════════════════════════
// Address book (delivery addresses)
// ════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAddress(row: any): Address {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    recipientName: row.recipient_name,
    addressLine: row.address_line,
    addressNumber: row.address_number ?? undefined,
    complement: row.complement ?? undefined,
    neighborhood: row.neighborhood ?? undefined,
    city: row.city,
    state: row.state,
    zip: row.zip,
    isDefault: !!row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getMyAddresses(): Promise<Address[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  logIfError('getMyAddresses', error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map(mapAddress);
}

export async function getMyDefaultAddress(): Promise<Address | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .maybeSingle();
  logIfError('getMyDefaultAddress', error);
  return data ? mapAddress(data) : null;
}

export type AddressInput = {
  label: string;
  recipientName: string;
  addressLine: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zip: string;
  isDefault?: boolean;
};

// Demote any prior default for this user. Run before inserting/updating an
// address with is_default = true to keep the partial unique index happy.
async function clearOtherDefaults(userId: string, exceptId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', userId)
    .eq('is_default', true);
  if (exceptId) q = q.neq('id', exceptId);
  await q;
}

export async function createAddress(
  input: AddressInput,
): Promise<{ success: true; address: Address } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // First-ever address for the user is always the default, regardless of input.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  const shouldDefault = input.isDefault || count === 0;

  if (shouldDefault) await clearOtherDefaults(user.id);

  const row = {
    user_id: user.id,
    label: input.label,
    recipient_name: input.recipientName,
    address_line: input.addressLine,
    address_number: input.addressNumber ?? null,
    complement: input.complement ?? null,
    neighborhood: input.neighborhood ?? null,
    city: input.city,
    state: input.state,
    zip: input.zip.replace(/\D/g, ''),
    is_default: shouldDefault,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('addresses')
    .insert(row)
    .select('*')
    .single();
  if (error) { logIfError('createAddress', error); return { success: false, error: error.message }; }
  return { success: true, address: mapAddress(data) };
}

export async function updateAddress(
  addressId: string,
  input: Partial<AddressInput>,
): Promise<{ success: true; address: Address } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  if (input.isDefault) await clearOtherDefaults(user.id, addressId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  if (input.label !== undefined) updates.label = input.label;
  if (input.recipientName !== undefined) updates.recipient_name = input.recipientName;
  if (input.addressLine !== undefined) updates.address_line = input.addressLine;
  if (input.addressNumber !== undefined) updates.address_number = input.addressNumber || null;
  if (input.complement !== undefined) updates.complement = input.complement || null;
  if (input.neighborhood !== undefined) updates.neighborhood = input.neighborhood || null;
  if (input.city !== undefined) updates.city = input.city;
  if (input.state !== undefined) updates.state = input.state;
  if (input.zip !== undefined) updates.zip = input.zip.replace(/\D/g, '');
  if (input.isDefault !== undefined) updates.is_default = input.isDefault;
  updates.updated_at = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('addresses')
    .update(updates)
    .eq('id', addressId)
    .eq('user_id', user.id)
    .select('*')
    .single();
  if (error) { logIfError('updateAddress', error); return { success: false, error: error.message }; }
  return { success: true, address: mapAddress(data) };
}

export async function deleteAddress(
  addressId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // Look up the address to know whether to promote a new default.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('addresses')
    .select('is_default')
    .eq('id', addressId)
    .eq('user_id', user.id)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', user.id);
  if (error) { logIfError('deleteAddress', error); return { success: false, error: error.message }; }

  // If we just removed the default, promote the oldest remaining address.
  if (existing?.is_default) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: next } = await (supabase as any)
      .from('addresses')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('addresses')
        .update({ is_default: true })
        .eq('id', next.id);
    }
  }

  return { success: true };
}

export async function setDefaultAddress(
  addressId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };
  await clearOtherDefaults(user.id, addressId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('addresses')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', addressId)
    .eq('user_id', user.id);
  if (error) { logIfError('setDefaultAddress', error); return { success: false, error: error.message }; }
  return { success: true };
}

// ════════════════════════════════════════════════
// Shopping cart
// ════════════════════════════════════════════════

// Fetch the buyer's cart, joining listing + card_base + seller in one call so
// the cart page has everything it needs to render (photo, price, free-shipping
// flags, seller display name) without N+1 fetches.
export async function getMyCart(): Promise<CartItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('cart_items')
    .select(`
      id, added_at,
      listing:listings(
        id, seller_id, card_base_id, grade, grade_company, pristine,
        price, images, free_shipping, free_shipping_pac, free_shipping_sedex,
        language, tags, status, created_at,
        card_base:card_bases(id, name, set_name, number, language_group),
        seller:profiles!seller_id(id, nickname, full_name)
      )
    `)
    .eq('buyer_id', user.id)
    .order('added_at', { ascending: false });
  logIfError('getMyCart', error);

  // Fetch verified flags in a single pass to avoid N+1.
  const rows = (data ?? []) as unknown[];
  const sellerIds = Array.from(new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows.map(r => (r as any).listing?.seller_id).filter(Boolean)
  )) as string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: verifiedRows } = await (supabase as any)
    .from('seller_profiles')
    .select('id, verified')
    .in('id', sellerIds);
  const verifiedMap = new Map<string, boolean>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (verifiedRows ?? []).map((r: any) => [r.id, !!r.verified])
  );

  const items: CartItem[] = [];
  for (const r of rows) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = r as any;
    const listingRow = row.listing;
    if (!listingRow) continue;            // listing deleted — skip
    const cardBaseRow = listingRow.card_base;
    const sellerRow = listingRow.seller;
    items.push({
      id: row.id,
      addedAt: row.added_at,
      listing: mapListing(listingRow),
      cardBase: {
        id: cardBaseRow?.id ?? '',
        name: cardBaseRow?.name ?? '',
        set: cardBaseRow?.set_name ?? '',
        number: cardBaseRow?.number ?? '',
        languageGroup: cardBaseRow?.language_group ?? 'INT',
      },
      sellerId: listingRow.seller_id,
      sellerName: sellerRow?.nickname ?? sellerRow?.full_name ?? 'Vendedor',
      sellerVerified: verifiedMap.get(listingRow.seller_id) ?? false,
    });
  }
  return items;
}

export async function getMyCartCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('cart_items')
    .select('id', { count: 'exact', head: true })
    .eq('buyer_id', user.id);
  return count ?? 0;
}

export async function addToCart(
  listingId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  // Don't allow adding sold/cancelled/reserved listings or one's own listing.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing } = await (supabase as any)
    .from('listings')
    .select('status, seller_id')
    .eq('id', listingId)
    .maybeSingle();
  if (!listing) return { success: false, error: 'Anúncio não encontrado' };
  if (listing.seller_id === user.id) return { success: false, error: 'Você não pode comprar seu próprio anúncio' };
  if (listing.status !== 'active') return { success: false, error: 'Anúncio indisponível' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('cart_items')
    .insert({ buyer_id: user.id, listing_id: listingId });
  if (error) {
    // 23505 = unique violation: already in cart. Treat as success (idempotent).
    if (error.code === '23505') return { success: true };
    logIfError('addToCart', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function removeFromCart(
  cartItemId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('cart_items')
    .delete()
    .eq('id', cartItemId)
    .eq('buyer_id', user.id);
  if (error) { logIfError('removeFromCart', error); return { success: false, error: error.message }; }
  return { success: true };
}

export async function clearMyCart(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('cart_items').delete().eq('buyer_id', user.id);
}

// Per-seller shipping/insurance summary fed into the cart-checkout RPC.
// Costs are in centavos; shipping_method is 'PAC' or 'SEDEX'.
export interface SellerShipmentInput {
  seller_id: string;
  shipping_cost: number;
  shipping_method: 'PAC' | 'SEDEX' | null;
  insurance_opted_in: boolean;
  insurance_cost: number;
}

export type CheckoutCartResult =
  | { success: true; purchaseGroupId: string }
  | { success: false; error: string; unavailable?: string[] };

// Calls the atomic checkout_cart RPC: reserves all listings, snapshots the
// chosen address into a new purchase_group, creates N orders (one per cart
// item), and empties the cart. The buyer's cart context should refresh
// afterwards so the navbar count drops to 0.
export async function checkoutCart(
  addressId: string,
  shipments: SellerShipmentInput[],
): Promise<CheckoutCartResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('checkout_cart', {
    p_address_id: addressId,
    p_seller_shipments: shipments,
  });
  if (error) { logIfError('checkoutCart', error); return { success: false, error: error.message }; }
  const result = data as { success: boolean; purchase_group_id?: string; error?: string; unavailable?: string[] };
  if (!result.success) return { success: false, error: result.error ?? 'Erro ao iniciar checkout', unavailable: result.unavailable };
  return { success: true, purchaseGroupId: result.purchase_group_id! };
}
