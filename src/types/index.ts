export type CardType = 'fire' | 'electric' | 'psychic' | 'dark' | 'dragon' | 'ghost' | 'flying' | 'grass' | 'water' | 'normal';

export interface Card {
  id: string;
  name: string;
  set: string;
  number: string;
  grade: number;
  gradeCompany: 'PSA' | 'BGS' | 'CGC';
  price: number;
  images: string[];
  sellerId: string;
  createdAt: string;
  type: CardType;
  freeShipping?: boolean;
  tags?: string[];
}

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  isNew: boolean;
  rating: number;
  totalSales: number;
  joinedAt: string;
}

export interface SaleRecord {
  date: string;
  price: number;
  grade: number;
  gradeCompany: string;
  buyerName: string;
}

export type OrderStatus = 'aguardando_pagamento' | 'pago' | 'enviado' | 'entregue' | 'disputa' | 'cancelado';

export interface Order {
  id: string;
  status: OrderStatus;
  cardId: string;
  cardName: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  price: number;
  createdAt: string;
}

export interface Question {
  id: string;
  cardId: string;
  userName: string;
  question: string;
  answer?: string;
  questionDate: string;
  answerDate?: string;
}

export interface Review {
  id: string;
  sellerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface PricePoint {
  month: string;
  raw?: number;
  psa9?: number;
  psa10?: number;
  bgs95?: number;
}
