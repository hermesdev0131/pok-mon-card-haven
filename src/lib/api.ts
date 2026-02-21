import { cardBases, listings, sellers, salesHistory, priceHistory, orders, questions, reviews } from '@/data/mock';
import type { CardBase, Listing, CardBaseWithStats } from '@/types';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Card Bases ──

export async function getCardBasesWithStats(filters?: {
  search?: string;
  type?: string;
  sort?: string;
}): Promise<CardBaseWithStats[]> {
  await delay(300);
  let result = [...cardBases];

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(cb =>
      cb.name.toLowerCase().includes(s) ||
      cb.set.toLowerCase().includes(s) ||
      cb.number.includes(s)
    );
  }

  if (filters?.type) {
    result = result.filter(cb => cb.type === filters.type);
  }

  const stats = result.map(cb => {
    const activeListings = listings.filter(l => l.cardBaseId === cb.id && l.status === 'active');
    const prices = activeListings.map(l => l.price);
    return {
      cardBase: cb,
      listingCount: activeListings.length,
      lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
      highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
    };
  }).filter(s => s.listingCount > 0);

  if (filters?.sort === 'price_asc') stats.sort((a, b) => a.lowestPrice - b.lowestPrice);
  else if (filters?.sort === 'price_desc') stats.sort((a, b) => b.lowestPrice - a.lowestPrice);

  return stats;
}

export async function getCardBase(id: string) {
  await delay(50);
  return cardBases.find(cb => cb.id === id) || null;
}

// ── Listings ──

export async function getListingsForCard(cardBaseId: string): Promise<Listing[]> {
  await delay(200);
  return listings
    .filter(l => l.cardBaseId === cardBaseId && l.status === 'active')
    .sort((a, b) => a.price - b.price);
}

export async function getRecentListings(): Promise<(Listing & { cardBase: CardBase })[]> {
  await delay(300);
  const activeListings = [...listings]
    .filter(l => l.status === 'active')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return activeListings.map(l => ({
    ...l,
    cardBase: cardBases.find(cb => cb.id === l.cardBaseId)!,
  }));
}

// ── Sellers ──

export async function getSeller(id: string) {
  await delay(200);
  return sellers.find(s => s.id === id) || null;
}

export async function getSellerListings(sellerId: string) {
  await delay(300);
  return listings.filter(l => l.sellerId === sellerId && l.status === 'active');
}

export async function getSellerReviews(sellerId: string) {
  await delay(200);
  return reviews.filter(r => r.sellerId === sellerId);
}

export async function getAllSellers() {
  await delay(200);
  return sellers;
}

export async function getAllReviews() {
  await delay(200);
  return reviews;
}

// ── Sales & Price History ──

export async function getSalesHistory(cardBaseId: string) {
  await delay(200);
  return salesHistory[cardBaseId] || [];
}

export async function getPriceHistory(cardBaseId: string) {
  await delay(200);
  return priceHistory[cardBaseId] || [];
}

// ── Questions ──

export async function getQuestions(cardBaseId: string) {
  await delay(200);
  return questions.filter(q => q.cardId === cardBaseId);
}

// ── Orders ──

export async function getOrders() {
  await delay(300);
  return orders;
}

export async function getOrder(id: string) {
  await delay(200);
  return orders.find(o => o.id === id) || null;
}
