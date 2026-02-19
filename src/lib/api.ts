import { cards, sellers, salesHistory, priceHistory, orders, questions, reviews } from '@/data/mock';
import type { Card } from '@/types';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function getCards(filters?: {
  search?: string;
  grade?: number;
  minPrice?: number;
  maxPrice?: number;
  verified?: boolean;
  sort?: string;
}): Promise<Card[]> {
  await delay(300);
  let result = [...cards];

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(c =>
      c.name.toLowerCase().includes(s) ||
      c.set.toLowerCase().includes(s) ||
      c.number.includes(s)
    );
  }
  if (filters?.grade) result = result.filter(c => c.grade === filters.grade);
  if (filters?.minPrice) result = result.filter(c => c.price >= filters.minPrice!);
  if (filters?.maxPrice) result = result.filter(c => c.price <= filters.maxPrice!);
  if (filters?.verified) {
    const verifiedIds = sellers.filter(s => s.verified).map(s => s.id);
    result = result.filter(c => verifiedIds.includes(c.sellerId));
  }

  if (filters?.sort === 'price_asc') result.sort((a, b) => a.price - b.price);
  else if (filters?.sort === 'price_desc') result.sort((a, b) => b.price - a.price);
  else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return result;
}

export async function getCard(id: string) {
  await delay(200);
  return cards.find(c => c.id === id) || null;
}

export async function getSeller(id: string) {
  await delay(200);
  return sellers.find(s => s.id === id) || null;
}

export async function getSellerCards(sellerId: string) {
  await delay(300);
  return cards.filter(c => c.sellerId === sellerId);
}

export async function getSellerReviews(sellerId: string) {
  await delay(200);
  return reviews.filter(r => r.sellerId === sellerId);
}

export async function getSalesHistory(cardId: string) {
  await delay(200);
  return salesHistory[cardId] || [];
}

export async function getPriceHistory(cardId: string) {
  await delay(200);
  return priceHistory[cardId] || [];
}

export async function getQuestions(cardId: string) {
  await delay(200);
  return questions.filter(q => q.cardId === cardId);
}

export async function getOrders() {
  await delay(300);
  return orders;
}

export async function getOrder(id: string) {
  await delay(200);
  return orders.find(o => o.id === id) || null;
}

export async function getAllSellers() {
  await delay(200);
  return sellers;
}

export async function getAllReviews() {
  await delay(200);
  return reviews;
}
