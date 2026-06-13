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

// Language group for card bases: INT = international (EN/PT share sets),
// JP = Japanese (own sets), ZH = Chinese (own sets), KR = Korean (deferred, no data yet)
export type CardLanguageGroup = 'INT' | 'JP' | 'ZH' | 'KR';

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
  // Legacy "any method is free" flag — kept for display surfaces that still
  // show a generic "Frete grátis" badge. Per-method flags are authoritative.
  freeShipping?: boolean;
  freeShippingPac?: boolean;
  freeShippingSedex?: boolean;
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
  lastSalePrice?: number; // most recent confirmed sale; only set when listingCount === 0
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
  // Method chosen by the buyer at checkout (e.g. 'PAC' or 'SEDEX'). Null until
  // the buyer selects a shipping option.
  shippingMethod?: string;
  // Legacy "any method free" flag — true when either per-method flag is set.
  freeShipping?: boolean;
  freeShippingPac?: boolean;
  freeShippingSedex?: boolean;
  // Buyer opted into Correios package insurance at checkout (paid by buyer).
  insuranceOptedIn?: boolean;
  insuranceCost?: number;
  // When this order was created via a cart purchase, points to the
  // purchase_group that holds the delivery address snapshot + combined
  // payment. Legacy single-listing orders leave this undefined.
  purchaseGroupId?: string;
  // Snapshot of the delivery address from the parent purchase_group, captured
  // at checkout time. Only present for cart orders. Sellers read this to
  // know where to ship; buyers see what was already locked in.
  deliveryAddress?: {
    recipientName: string;
    addressLine: string;
    addressNumber?: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    zip: string;
  };
  createdAt: string;
  listingImageUrl?: string;
  trackingCode?: string;
  mpPaymentId?: string;
  paidAt?: string;
}

// Buyer's saved delivery address. Multiple per user; exactly one can be the
// default (enforced at the DB level by a partial unique index).
export interface Address {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  addressLine: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Persisted cart item enriched with the data needed to render it: the
// listing (with the seller's photo and per-method free-shipping flags), the
// catalog card, and the seller's display name. The cart page groups these
// by sellerId in memory.
export interface CartItem {
  id: string;            // cart_items.id
  addedAt: string;
  listing: Listing;
  cardBase: Pick<CardBase, 'id' | 'name' | 'set' | 'number' | 'languageGroup'>;
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
  sellerRating: number;
  sellerTotalSales: number;
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

// In-app notification shown in the bell dropdown and /me/notificacoes.
export interface AppNotification {
  id: string;
  type: string;       // 'new_order' | 'payment_confirmed' | 'dispute_opened' | ...
  title: string;
  body: string;
  link?: string;      // relative URL to the relevant page
  read: boolean;
  createdAt: string;
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

// Listing languages — the language of the seller's specific copy
export type CardLanguage = 'PT' | 'EN' | 'JP' | 'ZH';

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
