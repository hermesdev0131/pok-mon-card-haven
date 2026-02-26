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
} from '@/types';
import type { Database } from '@/types/database';

// DB row types for explicit typing (Supabase type inference can collapse to `never` on chained queries)
type ListingRow = Database['public']['Tables']['listings']['Row'];
type CardBaseRow = Database['public']['Tables']['card_bases']['Row'];
type ConfirmedSaleRow = Database['public']['Tables']['confirmed_sales']['Row'];

const supabase = createClient();

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
function mapOrder(row: any): Order {
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
    buyerName: row.buyer?.full_name ?? 'Comprador',
    sellerId: row.seller_id,
    sellerName: row.seller?.store_name ?? 'Vendedor',
    price: row.price,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuestion(row: any, sellerName: string): Question {
  return {
    id: row.id,
    listingId: row.listing_id,
    sellerId: '', // not used in UI, but kept for type compat
    sellerName,
    userName: row.user?.full_name ?? 'Usuário',
    question: row.question,
    answer: row.answer ?? undefined,
    questionDate: row.created_at,
    answerDate: row.answered_at ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReview(row: any): Review {
  return {
    id: row.id,
    sellerId: row.seller_id,
    buyerName: row.buyer?.full_name ?? 'Comprador',
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
  // Fetch card bases
  let cbQuery = supabase.from('card_bases').select('*');
  if (filters?.search) {
    const s = filters.search;
    cbQuery = cbQuery.or(`name.ilike.%${s}%,set_name.ilike.%${s}%,number.ilike.%${s}%`);
  }
  if (filters?.type) {
    cbQuery = cbQuery.eq('type', filters.type as string);
  }
  const { data: cardRows } = await cbQuery;
  const cardBaseRows = (cardRows ?? []) as CardBaseRow[];
  if (!cardBaseRows.length) return [];

  // Fetch all active listings
  const { data: listingRows } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'active' as string);

  const listingsArr = (listingRows ?? []) as ListingRow[];

  // Group listings by card_base_id
  const listingsByCard: Record<string, number[]> = {};
  for (const l of listingsArr) {
    if (!listingsByCard[l.card_base_id]) listingsByCard[l.card_base_id] = [];
    listingsByCard[l.card_base_id].push(l.price);
  }

  // Build stats
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
  const { data } = await supabase
    .from('card_bases')
    .select('*')
    .eq('id', id)
    .single();
  return data ? mapCardBase(data) : null;
}

// ════════════════════════════════════════════════
// Listings
// ════════════════════════════════════════════════

export async function getListingsForCard(cardBaseId: string): Promise<Listing[]> {
  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('card_base_id', cardBaseId)
    .eq('status', 'active' as string)
    .order('price', { ascending: true });
  return ((data ?? []) as ListingRow[]).map(mapListing);
}

/** Recent listings with card base + seller info (for ultimos-anuncios page) */
export async function getRecentListings(): Promise<
  (Listing & { cardBase: CardBase; seller?: Seller })[]
> {
  const { data } = await supabase
    .from('listings')
    .select('*, card_bases(*), seller_profile:seller_profiles!seller_id(*, profiles!inner(full_name, avatar_url, created_at))')
    .eq('status', 'active' as string)
    .order('created_at', { ascending: false })
    .limit(30);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map(row => ({
    ...mapListing(row),
    cardBase: mapCardBase(row.card_bases),
    seller: row.seller_profile ? mapSeller(row.seller_profile) : undefined,
  }));
}

// ════════════════════════════════════════════════
// Sellers
// ════════════════════════════════════════════════

export async function getSeller(id: string): Promise<Seller | null> {
  const { data } = await supabase
    .from('seller_profiles')
    .select('*, profiles!inner(full_name, avatar_url, created_at)')
    .eq('id', id)
    .single();
  return data ? mapSeller(data) : null;
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
    .select('*, buyer:profiles!buyer_id(full_name)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(mapReview);
}

export async function getAllSellers(): Promise<Seller[]> {
  const { data } = await supabase
    .from('seller_profiles')
    .select('*, profiles!inner(full_name, avatar_url, created_at)');
  return (data ?? []).map(mapSeller);
}

/** All sellers with active listing count (for vendedores page) */
export async function getSellersWithListingCount(): Promise<(Seller & { listingCount: number })[]> {
  const [sellersRes, listingsRes] = await Promise.all([
    supabase.from('seller_profiles').select('*, profiles!inner(full_name, avatar_url, created_at)'),
    supabase.from('listings').select('*').eq('status', 'active' as string),
  ]);

  const sellers = (sellersRes.data ?? []).map(mapSeller);
  const listings = (listingsRes.data ?? []) as ListingRow[];

  // Count active listings per seller
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
    .select('*, buyer:profiles!buyer_id(full_name)')
    .order('created_at', { ascending: false });
  return (data ?? []).map(mapReview);
}

// ════════════════════════════════════════════════
// Sales & Price History
// ════════════════════════════════════════════════

export async function getSalesHistory(cardBaseId: string): Promise<SaleRecord[]> {
  const { data } = await supabase
    .from('confirmed_sales')
    .select('*')
    .eq('card_base_id', cardBaseId)
    .order('sold_at', { ascending: false });

  const rows = (data ?? []) as ConfirmedSaleRow[];
  if (!rows.length) return [];

  // Batch-fetch buyer and seller names
  const buyerIds = Array.from(new Set(rows.map(r => r.buyer_id)));
  const sellerIds = Array.from(new Set(rows.map(r => r.seller_id)));

  const [{ data: buyers }, { data: sellers }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', buyerIds),
    supabase.from('seller_profiles').select('id, store_name').in('id', sellerIds),
  ]);

  const buyerMap: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const b of (buyers ?? []) as any[]) buyerMap[b.id] = b.full_name ?? 'Comprador';
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
    buyerName: buyerMap[row.buyer_id] ?? 'Comprador',
    language: row.language,
  }));
}

export async function getPriceHistory(cardBaseId: string): Promise<PricePoint[]> {
  const { data } = await supabase
    .from('confirmed_sales')
    .select('*')
    .eq('card_base_id', cardBaseId)
    .order('sold_at', { ascending: true });

  const rows = (data ?? []) as ConfirmedSaleRow[];
  if (!rows.length) return [];

  // Aggregate by month / language / company / grade
  const groups: Record<string, { total: number; count: number }> = {};
  for (const row of rows) {
    const d = new Date(row.sold_at);
    const month = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      .replace('.', '')
      .replace(/^(\w)/, (_, c) => c.toUpperCase());
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
  const { data } = await supabase
    .from('confirmed_sales')
    .select('*')
    .order('sold_at', { ascending: false })
    .limit(30);

  const rows = (data ?? []) as ConfirmedSaleRow[];
  if (!rows.length) return [];

  // Batch-fetch related data
  const cardBaseIds = Array.from(new Set(rows.map(r => r.card_base_id)));
  const buyerIds = Array.from(new Set(rows.map(r => r.buyer_id)));
  const sellerIds = Array.from(new Set(rows.map(r => r.seller_id)));

  const [{ data: cardBases }, { data: buyers }, { data: sellerProfiles }] = await Promise.all([
    supabase.from('card_bases').select('*').in('id', cardBaseIds),
    supabase.from('profiles').select('id, full_name').in('id', buyerIds),
    supabase.from('seller_profiles').select('*, profiles!inner(full_name, avatar_url, created_at)').in('id', sellerIds),
  ]);

  const cbMap: Record<string, CardBaseRow> = {};
  for (const cb of (cardBases ?? []) as CardBaseRow[]) cbMap[cb.id] = cb;
  const buyerMap: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const b of (buyers ?? []) as any[]) buyerMap[b.id] = b.full_name ?? 'Comprador';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sellerMap: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const s of (sellerProfiles ?? []) as any[]) sellerMap[s.id] = s;

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
      buyerName: buyerMap[row.buyer_id] ?? 'Comprador',
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
  // Fetch questions with user name
  const { data: questions } = await supabase
    .from('questions')
    .select('*, user:profiles!user_id(full_name)')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: true });

  if (!questions?.length) return [];

  // Fetch the listing to get seller info
  const { data: listing } = await supabase
    .from('listings')
    .select('*, seller:seller_profiles!seller_id(store_name)')
    .eq('id', listingId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sellerName = (listing as any)?.seller?.store_name ?? 'Vendedor';

  return questions.map(q => mapQuestion(q, sellerName));
}

// ════════════════════════════════════════════════
// Orders
// ════════════════════════════════════════════════

const ORDER_SELECT = `
  *,
  listing:listings(card_base_id, grade, grade_company, card_base:card_bases(name)),
  buyer:profiles!buyer_id(full_name),
  seller:seller_profiles!seller_id(store_name)
`;

/** Orders for the current user (buyer or seller) */
export async function getMyOrders(): Promise<Order[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  return (data ?? []).map(mapOrder);
}

/** All orders (for admin page) */
export async function getAllOrders(): Promise<Order[]> {
  const { data } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false });

  return (data ?? []).map(mapOrder);
}

export async function getOrder(id: string): Promise<Order | null> {
  const { data } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', id)
    .single();

  return data ? mapOrder(data) : null;
}

// ════════════════════════════════════════════════
// Specialized queries for pages
// ════════════════════════════════════════════════

/** Card bases that have at least one PSA 10 active listing (for PSA10 page) */
export async function getCardBasesWithPSA10(): Promise<CardBaseWithStats[]> {
  // Fetch PSA 10 listing card_base_ids
  const { data: psa10Listings } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'active' as string)
    .eq('grade_company', 'PSA' as string)
    .eq('grade', 10);

  const psa10Rows = (psa10Listings ?? []) as ListingRow[];
  if (!psa10Rows.length) return [];

  const psa10CardIds = Array.from(new Set(psa10Rows.map(l => l.card_base_id)));

  // Fetch those card bases
  const { data: cardRows } = await supabase
    .from('card_bases')
    .select('*')
    .in('id', psa10CardIds);

  const cardRowsTyped = (cardRows ?? []) as CardBaseRow[];
  if (!cardRowsTyped.length) return [];

  // Fetch all active listings for these cards (not just PSA 10)
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
  const unique = Array.from(new Set(sellerIds));
  const { data } = await supabase
    .from('seller_profiles')
    .select('*, profiles!inner(full_name, avatar_url, created_at)')
    .in('id', unique);

  const map: Record<string, Seller> = {};
  for (const row of data ?? []) {
    const seller = mapSeller(row);
    map[seller.id] = seller;
  }
  return map;
}
