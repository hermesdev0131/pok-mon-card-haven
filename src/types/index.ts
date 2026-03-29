// Card types — matches card_types lookup table. New types can be added via admin.
export type CardType = 'fire' | 'water' | 'grass' | 'electric' | 'psychic' | 'fighting' | 'dark' | 'steel' | 'dragon' | 'fairy' | 'ghost' | 'flying' | 'normal' | 'colorless';

// Grade companies — matches grade_companies lookup table. New companies can be added via admin.
export type GradeCompany = 'PSA' | 'CGC' | 'Beckett' | 'TAG' | 'ARS' | 'ManaFix' | 'GBA' | 'Capy' | 'Taverna';

// Lookup table row types (for fetching from Supabase)
export interface CardTypeRow {
  code: string;
  label: string;
  color: string | null;
  sortOrder: number;
}

export interface GradeCompanyRow {
  code: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  active: boolean;
  sortOrder: number;
}

// Language group for card bases: INT = international (EN/PT share sets), JP = Japanese (own sets)
export type CardLanguageGroup = 'INT' | 'JP';

// The Pokemon card itself — generic, not a specific graded copy
export interface CardBase {
  id: string;
  name: string;
  set: string;
  setCode: string;
  number: string;
  type: CardType;
  rarity?: string;
  imageUrl?: string; // official/generic card art
  languageGroup: CardLanguageGroup; // INT = EN/PT sets, JP = Japanese sets
}

// A specific graded copy listed for sale by a seller
export interface Listing {
  id: string;
  cardBaseId: string;
  sellerId: string;
  grade: number;
  gradeCompany: GradeCompany;
  pristine?: boolean; // Pristine 10 (CGC, TAG, Beckett)
  price: number;
  images: string[];
  freeShipping?: boolean;
  language: CardLanguage;
  tags?: string[];
  status: 'active' | 'sold' | 'reserved' | 'cancelled';
  createdAt: string;
}

// Aggregated info for a card base (used in catalog grid)
export interface CardBaseWithStats {
  cardBase: CardBase;
  listingCount: number;
  lowestPrice: number;
  highestPrice: number;
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
  pristine?: boolean; // Pristine 10 (CGC, TAG, Beckett)
  sellerName: string;
  buyerName: string;
  language: CardLanguage;
}

export type OrderStatus = 'aguardando_pagamento' | 'pago' | 'enviado' | 'entregue' | 'concluido' | 'disputa' | 'cancelado';

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
  shippingCost: number;
  freeShipping?: boolean;
  createdAt: string;
  listingImageUrl?: string;
  trackingCode?: string;
  mpPaymentId?: string;
  paidAt?: string;
}

export interface ShippingOption {
  id: number;
  name: string;
  price: number;          // centavos
  deliveryDays: number | null;
  company: string;
}

export interface Question {
  id: string;
  listingId: string;
  sellerId: string;
  sellerName: string;
  userName: string;
  question: string;
  answer?: string;
  questionDate: string;
  answerDate?: string;
  cardName?: string;
  cardBaseId?: string;
}

export interface Review {
  id: string;
  orderId: string;
  sellerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  sellerReply?: string;
  repliedAt?: string;
  date: string;
}

export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  content: string;
  readAt?: string;
  createdAt: string;
  isOwn: boolean;
}

export type DisputeStatus = 'open' | 'resolved_buyer' | 'resolved_seller' | 'escalated' | 'closed';

export interface Dispute {
  id: string;
  orderId: string;
  openedBy: string;
  openedByName: string;
  reason: string;
  description?: string;
  sellerResponse?: string;
  status: DisputeStatus;
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

// MVP languages
export type CardLanguage = 'PT' | 'EN' | 'JP';

// Normalized price point — one record per month/language/company/grade combination
export interface PricePoint {
  month: string;
  language: CardLanguage;
  company: string;  // 'NM' | 'PSA' | 'CGC' | 'Beckett' | 'TAG' | etc.
  grade: number;    // 0 for NM (ungraded), 7-10 for graded
  pristine: boolean;
  avgPrice: number;
  salesCount: number; // number of cards sold that month
}
