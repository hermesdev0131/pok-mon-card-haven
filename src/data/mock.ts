import type { CardBase, Listing, Seller, SaleRecord, Order, Question, Review, PricePoint } from '@/types';

export const sellers: Seller[] = [
  { id: 's1', name: 'CardMaster BR', avatar: '', verified: true, isNew: false, rating: 4.9, totalSales: 287, joinedAt: '2022-03-15' },
  { id: 's2', name: 'PokéCollector SP', avatar: '', verified: true, isNew: false, rating: 4.7, totalSales: 156, joinedAt: '2022-08-20' },
  { id: 's3', name: 'TCG Premium', avatar: '', verified: false, isNew: true, rating: 5.0, totalSales: 12, joinedAt: '2024-11-01' },
  { id: 's4', name: 'Graded Cards BR', avatar: '', verified: true, isNew: false, rating: 4.8, totalSales: 421, joinedAt: '2021-06-10' },
  { id: 's5', name: 'PokéRaro', avatar: '', verified: true, isNew: false, rating: 4.6, totalSales: 89, joinedAt: '2023-02-14' },
  { id: 's6', name: 'MasterGrade TCG', avatar: '', verified: false, isNew: true, rating: 4.5, totalSales: 7, joinedAt: '2024-12-01' },
];

// Card bases — the generic Pokemon card, not a specific graded copy
// INT = EN/PT (same sets), JP = Japanese (own sets/numbering)
// Images: high-res from TCGdex, stored locally in /public/cards/{en,jp}/
export const cardBases: CardBase[] = [
  // ── International (EN/PT) ──
  { id: 'cb1', name: 'Charizard VMAX', set: 'Darkness Ablaze', setCode: 'DAA', number: '020/189', type: 'fire', rarity: 'VMAX', languageGroup: 'INT', imageUrl: '/cards/en/charizard-vmax-swsh3-20.png' },
  { id: 'cb2', name: 'Pikachu VMAX Rainbow', set: 'Vivid Voltage', setCode: 'VV', number: '188/185', type: 'electric', rarity: 'Secret Rare', languageGroup: 'INT', imageUrl: '/cards/en/pikachu-vmax-swsh4-188.png' },
  { id: 'cb3', name: 'Mew VMAX Alt Art', set: 'Fusion Strike', setCode: 'FST', number: '268/264', type: 'psychic', rarity: 'Alt Art', languageGroup: 'INT', imageUrl: '/cards/en/mew-vmax-swsh8-268.png' },
  { id: 'cb4', name: 'Umbreon VMAX Alt Art', set: 'Evolving Skies', setCode: 'EVS', number: '215/203', type: 'dark', rarity: 'Alt Art', languageGroup: 'INT', imageUrl: '/cards/en/umbreon-vmax-swsh7-215.png' },
  { id: 'cb5', name: 'Rayquaza VMAX Alt Art', set: 'Evolving Skies', setCode: 'EVS', number: '218/203', type: 'dragon', rarity: 'Alt Art', languageGroup: 'INT', imageUrl: '/cards/en/rayquaza-vmax-swsh7-218.png' },
  { id: 'cb6', name: 'Giratina VSTAR Alt Art', set: 'Lost Origin', setCode: 'LOR', number: '131/196', type: 'ghost', rarity: 'Alt Art', languageGroup: 'INT', imageUrl: '/cards/en/giratina-vstar-swsh11-131.png' },
  { id: 'cb7', name: 'Lugia VSTAR Alt Art', set: 'Silver Tempest', setCode: 'SIT', number: '186/195', type: 'flying', rarity: 'Alt Art', languageGroup: 'INT', imageUrl: '/cards/en/lugia-vstar-swsh12-186.png' },
  { id: 'cb8', name: 'Charizard ex SAR', set: 'Pokémon 151', setCode: '151', number: '199/165', type: 'fire', rarity: 'SAR', languageGroup: 'INT', imageUrl: '/cards/en/charizard-ex-sv3pt5-199.png' },
  { id: 'cb9', name: 'Charizard Base Set', set: 'Base Set', setCode: 'BS', number: '4/102', type: 'fire', rarity: 'Holo Rare', languageGroup: 'INT', imageUrl: '/cards/en/charizard-base-4.png' },
  { id: 'cb10', name: 'Blastoise Base Set', set: 'Base Set', setCode: 'BS', number: '2/102', type: 'water', rarity: 'Holo Rare', languageGroup: 'INT', imageUrl: '/cards/en/blastoise-base-2.png' },
  { id: 'cb11', name: 'Venusaur Base Set', set: 'Base Set', setCode: 'BS', number: '15/102', type: 'grass', rarity: 'Holo Rare', languageGroup: 'INT', imageUrl: '/cards/en/venusaur-base-15.png' },
  { id: 'cb12', name: 'Gengar VMAX Alt Art', set: 'Fusion Strike', setCode: 'FST', number: '271/264', type: 'ghost', rarity: 'Alt Art', languageGroup: 'INT', imageUrl: '/cards/en/gengar-vmax-swsh8-271.png' },

  // ── Japanese (own sets/numbering) ──
  // Images: TCGdex JP when available, EN fallback when JP not indexed
  { id: 'cb1-jp', name: 'Charizard VMAX', set: 'Starter Set VMAX Charizard', setCode: 'sA', number: '002/021', type: 'fire', rarity: 'VMAX', languageGroup: 'JP', imageUrl: '/cards/en/charizard-vmax-swsh3-20.png' },
  { id: 'cb3-jp', name: 'Mew VMAX Alt Art', set: 'Fusion Arts', setCode: 's8', number: '114/100', type: 'psychic', rarity: 'Alt Art', languageGroup: 'JP', imageUrl: '/cards/jp/mew-vmax-s12a-054.png' },
  { id: 'cb4-jp', name: 'Umbreon VMAX Alt Art', set: 'Eevee Heroes', setCode: 's6a', number: '095/069', type: 'dark', rarity: 'Alt Art', languageGroup: 'JP', imageUrl: '/cards/en/umbreon-vmax-swsh7-215.png' },
  { id: 'cb7-jp', name: 'Lugia VSTAR Alt Art', set: 'Paradigm Trigger', setCode: 's12', number: '118/098', type: 'flying', rarity: 'Alt Art', languageGroup: 'JP', imageUrl: '/cards/jp/lugia-vstar-s12-118.png' },
  { id: 'cb8-jp', name: 'Charizard ex SAR', set: 'Pokémon Card 151', setCode: 'sv2a', number: '185/165', type: 'fire', rarity: 'SAR', languageGroup: 'JP', imageUrl: '/cards/jp/charizard-ex-sv2a-185.png' },
];

// Listings — specific graded copies for sale. Multiple sellers can list the same card base.
export const listings: Listing[] = [
  // cb1 — Charizard VMAX (4 listings)
  { id: 'l1', cardBaseId: 'cb1', sellerId: 's1', grade: 10, gradeCompany: 'PSA', price: 2850, images: ['/cards/en/charizard-vmax-swsh3-20.png', '/cards/en/charizard-vmax-swsh3-20.png'], freeShipping: false, language: 'PT', tags: ['graduada'], status: 'active', createdAt: '2024-12-01' },
  { id: 'l2', cardBaseId: 'cb1', sellerId: 's4', grade: 9, gradeCompany: 'PSA', price: 1800, images: ['/cards/en/charizard-vmax-swsh3-20.png'], freeShipping: true, language: 'EN', tags: ['graduada'], status: 'active', createdAt: '2024-12-08' },
  { id: 'l3', cardBaseId: 'cb1', sellerId: 's5', grade: 10, gradeCompany: 'CGC', pristine: true, price: 3400, images: [], freeShipping: false, language: 'PT', tags: ['graduada'], status: 'active', createdAt: '2024-12-10' },
  { id: 'l4', cardBaseId: 'cb1-jp', sellerId: 's6', grade: 9, gradeCompany: 'TAG', price: 1500, images: [], freeShipping: false, language: 'JP', tags: ['graduada'], status: 'active', createdAt: '2024-12-12' },

  // cb2 — Pikachu VMAX Rainbow (2 listings)
  { id: 'l5', cardBaseId: 'cb2', sellerId: 's2', grade: 10, gradeCompany: 'PSA', price: 1200, images: [], freeShipping: false, language: 'EN', tags: ['graduada'], status: 'active', createdAt: '2024-12-05' },
  { id: 'l6', cardBaseId: 'cb2', sellerId: 's1', grade: 9.5, gradeCompany: 'Beckett', price: 1050, images: [], freeShipping: true, language: 'PT', tags: ['graduada'], status: 'active', createdAt: '2024-12-09' },

  // cb3 — Mew VMAX Alt Art (2 listings)
  { id: 'l7', cardBaseId: 'cb3-jp', sellerId: 's1', grade: 9.5, gradeCompany: 'Beckett', price: 3500, images: [], freeShipping: true, language: 'JP', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-11-28' },
  { id: 'l8', cardBaseId: 'cb3', sellerId: 's4', grade: 10, gradeCompany: 'PSA', price: 4200, images: [], freeShipping: false, language: 'EN', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-12-03' },

  // cb4 — Umbreon VMAX Alt Art (5 listings)
  { id: 'l9', cardBaseId: 'cb4', sellerId: 's4', grade: 9, gradeCompany: 'PSA', price: 8900, images: [], freeShipping: false, language: 'PT', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-11-15' },
  { id: 'l10', cardBaseId: 'cb4', sellerId: 's1', grade: 10, gradeCompany: 'PSA', price: 13500, images: ['/cards/en/umbreon-vmax-swsh7-215.png', '/cards/en/umbreon-vmax-swsh7-215.png', '/cards/en/umbreon-vmax-swsh7-215.png', '/cards/en/umbreon-vmax-swsh7-215.png'], freeShipping: true, language: 'EN', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-12-01' },
  { id: 'l11', cardBaseId: 'cb4', sellerId: 's5', grade: 9, gradeCompany: 'Beckett', price: 8600, images: [], freeShipping: false, language: 'PT', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-12-05' },
  { id: 'l12', cardBaseId: 'cb4-jp', sellerId: 's2', grade: 10, gradeCompany: 'CGC', pristine: true, price: 18500, images: [], freeShipping: true, language: 'JP', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-12-08' },
  { id: 'l13', cardBaseId: 'cb4', sellerId: 's6', grade: 8, gradeCompany: 'TAG', price: 6200, images: [], freeShipping: false, language: 'PT', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-12-10' },

  // cb5 — Rayquaza VMAX Alt Art (2 listings)
  { id: 'l14', cardBaseId: 'cb5', sellerId: 's3', grade: 9.5, gradeCompany: 'CGC', price: 4200, images: [], freeShipping: false, language: 'EN', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-12-10' },
  { id: 'l15', cardBaseId: 'cb5', sellerId: 's4', grade: 10, gradeCompany: 'PSA', price: 5800, images: [], freeShipping: true, language: 'PT', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-12-12' },

  // cb6 — Giratina VSTAR Alt Art (2 listings)
  { id: 'l16', cardBaseId: 'cb6', sellerId: 's4', grade: 10, gradeCompany: 'PSA', price: 2100, images: [], freeShipping: false, language: 'PT', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-12-08' },
  { id: 'l17', cardBaseId: 'cb6', sellerId: 's2', grade: 9, gradeCompany: 'PSA', price: 1650, images: [], freeShipping: false, language: 'EN', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-12-11' },

  // cb7 — Lugia VSTAR Alt Art (3 listings)
  { id: 'l18', cardBaseId: 'cb7', sellerId: 's2', grade: 10, gradeCompany: 'PSA', price: 5600, images: [], freeShipping: true, language: 'EN', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-11-20' },
  { id: 'l19', cardBaseId: 'cb7', sellerId: 's5', grade: 9, gradeCompany: 'Beckett', price: 4100, images: [], freeShipping: false, language: 'PT', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-12-02' },
  { id: 'l20', cardBaseId: 'cb7-jp', sellerId: 's3', grade: 9.5, gradeCompany: 'CGC', price: 4800, images: [], freeShipping: false, language: 'JP', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-12-06' },

  // cb8 — Charizard ex SAR (2 listings)
  { id: 'l21', cardBaseId: 'cb8-jp', sellerId: 's4', grade: 10, gradeCompany: 'PSA', price: 3200, images: [], freeShipping: false, language: 'JP', tags: ['graduada'], status: 'active', createdAt: '2024-12-12' },
  { id: 'l22', cardBaseId: 'cb8', sellerId: 's1', grade: 9, gradeCompany: 'PSA', price: 2400, images: [], freeShipping: false, language: 'PT', tags: ['graduada'], status: 'active', createdAt: '2024-12-14' },

  // cb9 — Charizard Base Set (1 listing)
  { id: 'l23', cardBaseId: 'cb9', sellerId: 's4', grade: 8, gradeCompany: 'PSA', price: 15000, images: ['/cards/en/charizard-base-4.png', '/cards/en/charizard-base-4.png', '/cards/en/charizard-base-4.png'], freeShipping: true, language: 'EN', tags: ['vintage', 'graduada'], status: 'active', createdAt: '2024-12-02' },

  // cb10 — Blastoise Base Set (2 listings)
  { id: 'l24', cardBaseId: 'cb10', sellerId: 's1', grade: 9, gradeCompany: 'PSA', price: 6500, images: [], freeShipping: false, language: 'EN', tags: ['vintage', 'graduada'], status: 'active', createdAt: '2024-11-25' },
  { id: 'l25', cardBaseId: 'cb10', sellerId: 's5', grade: 7, gradeCompany: 'Beckett', price: 3200, images: [], freeShipping: false, language: 'EN', tags: ['vintage', 'graduada'], status: 'active', createdAt: '2024-12-04' },

  // cb11 — Venusaur Base Set (1 listing)
  { id: 'l26', cardBaseId: 'cb11', sellerId: 's2', grade: 7, gradeCompany: 'Beckett', price: 3800, images: [], freeShipping: false, language: 'EN', tags: ['vintage', 'graduada'], status: 'active', createdAt: '2024-12-03' },

  // cb12 — Gengar VMAX Alt Art (2 listings)
  { id: 'l27', cardBaseId: 'cb12', sellerId: 's4', grade: 10, gradeCompany: 'PSA', price: 4800, images: [], freeShipping: true, language: 'EN', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-11-10' },
  { id: 'l28', cardBaseId: 'cb12', sellerId: 's1', grade: 9, gradeCompany: 'CGC', price: 3200, images: [], freeShipping: false, language: 'PT', tags: ['alt-art', 'graduada'], status: 'active', createdAt: '2024-12-05' },
];

// Sales history keyed by card base ID
export const salesHistory: Record<string, SaleRecord[]> = {
  cb1: [
    { date: '2024-11-15', price: 2700, grade: 10, gradeCompany: 'PSA', sellerName: 'CardMaster BR', buyerName: 'João M.', language: 'PT' },
    { date: '2024-10-22', price: 2650, grade: 10, gradeCompany: 'PSA', sellerName: 'PokéCollector SP', buyerName: 'Pedro S.', language: 'PT' },
    { date: '2024-09-10', price: 2500, grade: 9, gradeCompany: 'PSA', sellerName: 'CardMaster BR', buyerName: 'Ana L.', language: 'EN' },
    { date: '2024-08-05', price: 2800, grade: 10, gradeCompany: 'PSA', sellerName: 'Graded Cards BR', buyerName: 'Lucas R.', language: 'EN' },
    { date: '2024-07-18', price: 1800, grade: 9, gradeCompany: 'PSA', sellerName: 'PokéCollector SP', buyerName: 'Mariana F.', language: 'PT' },
  ],
  cb4: [
    { date: '2024-12-05', price: 17800, grade: 10, gradeCompany: 'CGC', pristine: true, sellerName: 'Graded Cards BR', buyerName: 'Ricardo L.', language: 'PT' },
    { date: '2024-11-01', price: 8500, grade: 9, gradeCompany: 'PSA', sellerName: 'Graded Cards BR', buyerName: 'Carlos T.', language: 'PT' },
    { date: '2024-09-15', price: 8200, grade: 9, gradeCompany: 'PSA', sellerName: 'CardMaster BR', buyerName: 'Fernanda R.', language: 'EN' },
    { date: '2024-08-20', price: 9100, grade: 10, gradeCompany: 'PSA', sellerName: 'TCG Premium', buyerName: 'Bruno M.', language: 'PT' },
  ],
  cb8: [
    { date: '2024-11-10', price: 2900, grade: 10, gradeCompany: 'PSA', sellerName: 'PokéCollector SP', buyerName: 'Camila T.', language: 'PT' },
  ],
  'cb8-jp': [
    { date: '2024-12-01', price: 3100, grade: 10, gradeCompany: 'PSA', sellerName: 'CardMaster BR', buyerName: 'Rafael S.', language: 'JP' },
  ],
};

// Price history keyed by card base ID — each point includes language for filtering
export const priceHistory: Record<string, PricePoint[]> = {
  cb1: [
    // PT — Charizard VMAX — NM (ungraded near-mint)
    { month: 'Jul 24', language: 'PT', company: 'NM', grade: 0, avgPrice: 800, salesCount: 12 },
    { month: 'Ago 24', language: 'PT', company: 'NM', grade: 0, avgPrice: 850, salesCount: 9 },
    { month: 'Set 24', language: 'PT', company: 'NM', grade: 0, avgPrice: 820, salesCount: 14 },
    { month: 'Out 24', language: 'PT', company: 'NM', grade: 0, avgPrice: 900, salesCount: 11 },
    { month: 'Nov 24', language: 'PT', company: 'NM', grade: 0, avgPrice: 880, salesCount: 8 },
    { month: 'Dez 24', language: 'PT', company: 'NM', grade: 0, avgPrice: 950, salesCount: 10 },
    // PT — PSA grades 7-10
    { month: 'Jul 24', language: 'PT', company: 'PSA', grade: 7, avgPrice: 1100, salesCount: 4 },
    { month: 'Ago 24', language: 'PT', company: 'PSA', grade: 7, avgPrice: 1150, salesCount: 3 },
    { month: 'Set 24', language: 'PT', company: 'PSA', grade: 7, avgPrice: 1120, salesCount: 5 },
    { month: 'Out 24', language: 'PT', company: 'PSA', grade: 7, avgPrice: 1200, salesCount: 2 },
    { month: 'Nov 24', language: 'PT', company: 'PSA', grade: 7, avgPrice: 1180, salesCount: 4 },
    { month: 'Dez 24', language: 'PT', company: 'PSA', grade: 7, avgPrice: 1250, salesCount: 3 },
    { month: 'Jul 24', language: 'PT', company: 'PSA', grade: 8, avgPrice: 1400, salesCount: 6 },
    { month: 'Ago 24', language: 'PT', company: 'PSA', grade: 8, avgPrice: 1450, salesCount: 5 },
    { month: 'Set 24', language: 'PT', company: 'PSA', grade: 8, avgPrice: 1500, salesCount: 7 },
    { month: 'Out 24', language: 'PT', company: 'PSA', grade: 8, avgPrice: 1550, salesCount: 4 },
    { month: 'Nov 24', language: 'PT', company: 'PSA', grade: 8, avgPrice: 1600, salesCount: 5 },
    { month: 'Dez 24', language: 'PT', company: 'PSA', grade: 8, avgPrice: 1650, salesCount: 6 },
    { month: 'Jul 24', language: 'PT', company: 'PSA', grade: 9, avgPrice: 1800, salesCount: 8 },
    { month: 'Ago 24', language: 'PT', company: 'PSA', grade: 9, avgPrice: 1900, salesCount: 6 },
    { month: 'Set 24', language: 'PT', company: 'PSA', grade: 9, avgPrice: 2000, salesCount: 9 },
    { month: 'Out 24', language: 'PT', company: 'PSA', grade: 9, avgPrice: 2100, salesCount: 7 },
    { month: 'Nov 24', language: 'PT', company: 'PSA', grade: 9, avgPrice: 2200, salesCount: 5 },
    { month: 'Dez 24', language: 'PT', company: 'PSA', grade: 9, avgPrice: 2300, salesCount: 8 },
    { month: 'Jul 24', language: 'PT', company: 'PSA', grade: 10, avgPrice: 2800, salesCount: 3 },
    { month: 'Ago 24', language: 'PT', company: 'PSA', grade: 10, avgPrice: 2850, salesCount: 2 },
    { month: 'Set 24', language: 'PT', company: 'PSA', grade: 10, avgPrice: 2700, salesCount: 4 },
    { month: 'Out 24', language: 'PT', company: 'PSA', grade: 10, avgPrice: 2650, salesCount: 3 },
    { month: 'Nov 24', language: 'PT', company: 'PSA', grade: 10, avgPrice: 2700, salesCount: 2 },
    { month: 'Dez 24', language: 'PT', company: 'PSA', grade: 10, avgPrice: 2850, salesCount: 4 },
    // PT — CGC grades 8-10
    { month: 'Jul 24', language: 'PT', company: 'CGC', grade: 8, avgPrice: 1350, salesCount: 3 },
    { month: 'Ago 24', language: 'PT', company: 'CGC', grade: 8, avgPrice: 1400, salesCount: 2 },
    { month: 'Set 24', language: 'PT', company: 'CGC', grade: 8, avgPrice: 1380, salesCount: 4 },
    { month: 'Out 24', language: 'PT', company: 'CGC', grade: 8, avgPrice: 1450, salesCount: 3 },
    { month: 'Nov 24', language: 'PT', company: 'CGC', grade: 8, avgPrice: 1500, salesCount: 2 },
    { month: 'Dez 24', language: 'PT', company: 'CGC', grade: 8, avgPrice: 1520, salesCount: 3 },
    { month: 'Jul 24', language: 'PT', company: 'CGC', grade: 9, avgPrice: 1750, salesCount: 5 },
    { month: 'Ago 24', language: 'PT', company: 'CGC', grade: 9, avgPrice: 1800, salesCount: 4 },
    { month: 'Set 24', language: 'PT', company: 'CGC', grade: 9, avgPrice: 1900, salesCount: 6 },
    { month: 'Out 24', language: 'PT', company: 'CGC', grade: 9, avgPrice: 1950, salesCount: 3 },
    { month: 'Nov 24', language: 'PT', company: 'CGC', grade: 9, avgPrice: 2050, salesCount: 5 },
    { month: 'Dez 24', language: 'PT', company: 'CGC', grade: 9, avgPrice: 2100, salesCount: 4 },
    { month: 'Set 24', language: 'PT', company: 'CGC', grade: 10, avgPrice: 2600, salesCount: 2 },
    { month: 'Out 24', language: 'PT', company: 'CGC', grade: 10, avgPrice: 2550, salesCount: 1 },
    { month: 'Nov 24', language: 'PT', company: 'CGC', grade: 10, avgPrice: 2650, salesCount: 3 },
    { month: 'Dez 24', language: 'PT', company: 'CGC', grade: 10, avgPrice: 2700, salesCount: 2 },
    // PT — Mana Fix grades 8-9
    { month: 'Set 24', language: 'PT', company: 'Mana Fix', grade: 8, avgPrice: 1200, salesCount: 2 },
    { month: 'Out 24', language: 'PT', company: 'Mana Fix', grade: 8, avgPrice: 1250, salesCount: 3 },
    { month: 'Nov 24', language: 'PT', company: 'Mana Fix', grade: 8, avgPrice: 1280, salesCount: 1 },
    { month: 'Dez 24', language: 'PT', company: 'Mana Fix', grade: 8, avgPrice: 1300, salesCount: 2 },
    { month: 'Set 24', language: 'PT', company: 'Mana Fix', grade: 9, avgPrice: 1550, salesCount: 3 },
    { month: 'Out 24', language: 'PT', company: 'Mana Fix', grade: 9, avgPrice: 1600, salesCount: 2 },
    { month: 'Nov 24', language: 'PT', company: 'Mana Fix', grade: 9, avgPrice: 1650, salesCount: 4 },
    { month: 'Dez 24', language: 'PT', company: 'Mana Fix', grade: 9, avgPrice: 1700, salesCount: 2 },
    // PT — TAG grades 9-10
    { month: 'Out 24', language: 'PT', company: 'TAG', grade: 9, avgPrice: 1500, salesCount: 2 },
    { month: 'Nov 24', language: 'PT', company: 'TAG', grade: 9, avgPrice: 1550, salesCount: 3 },
    { month: 'Dez 24', language: 'PT', company: 'TAG', grade: 9, avgPrice: 1600, salesCount: 2 },
    { month: 'Out 24', language: 'PT', company: 'TAG', grade: 10, avgPrice: 2200, salesCount: 1 },
    { month: 'Nov 24', language: 'PT', company: 'TAG', grade: 10, avgPrice: 2300, salesCount: 2 },
    { month: 'Dez 24', language: 'PT', company: 'TAG', grade: 10, avgPrice: 2350, salesCount: 1 },
    // PT — BGA grades 8-9
    { month: 'Ago 24', language: 'PT', company: 'BGA', grade: 8, avgPrice: 1150, salesCount: 2 },
    { month: 'Set 24', language: 'PT', company: 'BGA', grade: 8, avgPrice: 1180, salesCount: 3 },
    { month: 'Out 24', language: 'PT', company: 'BGA', grade: 8, avgPrice: 1200, salesCount: 1 },
    { month: 'Nov 24', language: 'PT', company: 'BGA', grade: 8, avgPrice: 1220, salesCount: 2 },
    { month: 'Dez 24', language: 'PT', company: 'BGA', grade: 8, avgPrice: 1250, salesCount: 2 },
    { month: 'Ago 24', language: 'PT', company: 'BGA', grade: 9, avgPrice: 1480, salesCount: 2 },
    { month: 'Set 24', language: 'PT', company: 'BGA', grade: 9, avgPrice: 1520, salesCount: 3 },
    { month: 'Out 24', language: 'PT', company: 'BGA', grade: 9, avgPrice: 1550, salesCount: 1 },
    { month: 'Nov 24', language: 'PT', company: 'BGA', grade: 9, avgPrice: 1580, salesCount: 2 },
    { month: 'Dez 24', language: 'PT', company: 'BGA', grade: 9, avgPrice: 1620, salesCount: 2 },
    // EN — NM + PSA
    { month: 'Jul 24', language: 'EN', company: 'NM', grade: 0, avgPrice: 1050, salesCount: 8 },
    { month: 'Ago 24', language: 'EN', company: 'NM', grade: 0, avgPrice: 1100, salesCount: 6 },
    { month: 'Set 24', language: 'EN', company: 'NM', grade: 0, avgPrice: 1080, salesCount: 10 },
    { month: 'Out 24', language: 'EN', company: 'NM', grade: 0, avgPrice: 1150, salesCount: 7 },
    { month: 'Nov 24', language: 'EN', company: 'NM', grade: 0, avgPrice: 1120, salesCount: 5 },
    { month: 'Dez 24', language: 'EN', company: 'NM', grade: 0, avgPrice: 1200, salesCount: 9 },
    { month: 'Jul 24', language: 'EN', company: 'PSA', grade: 9, avgPrice: 2300, salesCount: 5 },
    { month: 'Ago 24', language: 'EN', company: 'PSA', grade: 9, avgPrice: 2450, salesCount: 4 },
    { month: 'Set 24', language: 'EN', company: 'PSA', grade: 9, avgPrice: 2550, salesCount: 6 },
    { month: 'Out 24', language: 'EN', company: 'PSA', grade: 9, avgPrice: 2700, salesCount: 3 },
    { month: 'Nov 24', language: 'EN', company: 'PSA', grade: 9, avgPrice: 2800, salesCount: 5 },
    { month: 'Dez 24', language: 'EN', company: 'PSA', grade: 9, avgPrice: 2950, salesCount: 4 },
    { month: 'Jul 24', language: 'EN', company: 'PSA', grade: 10, avgPrice: 3600, salesCount: 2 },
    { month: 'Ago 24', language: 'EN', company: 'PSA', grade: 10, avgPrice: 3700, salesCount: 3 },
    { month: 'Set 24', language: 'EN', company: 'PSA', grade: 10, avgPrice: 3550, salesCount: 2 },
    { month: 'Out 24', language: 'EN', company: 'PSA', grade: 10, avgPrice: 3500, salesCount: 1 },
    { month: 'Nov 24', language: 'EN', company: 'PSA', grade: 10, avgPrice: 3600, salesCount: 3 },
    { month: 'Dez 24', language: 'EN', company: 'PSA', grade: 10, avgPrice: 3750, salesCount: 2 },
    // EN — CGC 9-10
    { month: 'Jul 24', language: 'EN', company: 'CGC', grade: 9, avgPrice: 2200, salesCount: 3 },
    { month: 'Ago 24', language: 'EN', company: 'CGC', grade: 9, avgPrice: 2350, salesCount: 4 },
    { month: 'Set 24', language: 'EN', company: 'CGC', grade: 9, avgPrice: 2400, salesCount: 2 },
    { month: 'Out 24', language: 'EN', company: 'CGC', grade: 9, avgPrice: 2500, salesCount: 3 },
    { month: 'Nov 24', language: 'EN', company: 'CGC', grade: 9, avgPrice: 2600, salesCount: 5 },
    { month: 'Dez 24', language: 'EN', company: 'CGC', grade: 9, avgPrice: 2700, salesCount: 3 },
  ],
  cb4: [
    // PT — Umbreon VMAX Alt Art — PSA grades 7-10
    { month: 'Jul 24', language: 'PT', company: 'PSA', grade: 7, avgPrice: 4500, salesCount: 3 },
    { month: 'Ago 24', language: 'PT', company: 'PSA', grade: 7, avgPrice: 4700, salesCount: 2 },
    { month: 'Set 24', language: 'PT', company: 'PSA', grade: 7, avgPrice: 4900, salesCount: 4 },
    { month: 'Out 24', language: 'PT', company: 'PSA', grade: 7, avgPrice: 4800, salesCount: 2 },
    { month: 'Nov 24', language: 'PT', company: 'PSA', grade: 7, avgPrice: 5100, salesCount: 3 },
    { month: 'Dez 24', language: 'PT', company: 'PSA', grade: 7, avgPrice: 5300, salesCount: 2 },
    { month: 'Jul 24', language: 'PT', company: 'PSA', grade: 8, avgPrice: 5800, salesCount: 4 },
    { month: 'Ago 24', language: 'PT', company: 'PSA', grade: 8, avgPrice: 6100, salesCount: 3 },
    { month: 'Set 24', language: 'PT', company: 'PSA', grade: 8, avgPrice: 6400, salesCount: 5 },
    { month: 'Out 24', language: 'PT', company: 'PSA', grade: 8, avgPrice: 6200, salesCount: 2 },
    { month: 'Nov 24', language: 'PT', company: 'PSA', grade: 8, avgPrice: 6600, salesCount: 4 },
    { month: 'Dez 24', language: 'PT', company: 'PSA', grade: 8, avgPrice: 6900, salesCount: 3 },
    { month: 'Jul 24', language: 'PT', company: 'PSA', grade: 9, avgPrice: 7500, salesCount: 6 },
    { month: 'Ago 24', language: 'PT', company: 'PSA', grade: 9, avgPrice: 7800, salesCount: 5 },
    { month: 'Set 24', language: 'PT', company: 'PSA', grade: 9, avgPrice: 8200, salesCount: 7 },
    { month: 'Out 24', language: 'PT', company: 'PSA', grade: 9, avgPrice: 8000, salesCount: 4 },
    { month: 'Nov 24', language: 'PT', company: 'PSA', grade: 9, avgPrice: 8500, salesCount: 5 },
    { month: 'Dez 24', language: 'PT', company: 'PSA', grade: 9, avgPrice: 8900, salesCount: 6 },
    { month: 'Jul 24', language: 'PT', company: 'PSA', grade: 10, avgPrice: 12000, salesCount: 2 },
    { month: 'Ago 24', language: 'PT', company: 'PSA', grade: 10, avgPrice: 12500, salesCount: 1 },
    { month: 'Set 24', language: 'PT', company: 'PSA', grade: 10, avgPrice: 13000, salesCount: 3 },
    { month: 'Out 24', language: 'PT', company: 'PSA', grade: 10, avgPrice: 12800, salesCount: 2 },
    { month: 'Nov 24', language: 'PT', company: 'PSA', grade: 10, avgPrice: 13200, salesCount: 1 },
    { month: 'Dez 24', language: 'PT', company: 'PSA', grade: 10, avgPrice: 13500, salesCount: 2 },
    // PT — CGC 9-10
    { month: 'Jul 24', language: 'PT', company: 'CGC', grade: 9, avgPrice: 7200, salesCount: 4 },
    { month: 'Ago 24', language: 'PT', company: 'CGC', grade: 9, avgPrice: 7500, salesCount: 3 },
    { month: 'Set 24', language: 'PT', company: 'CGC', grade: 9, avgPrice: 7800, salesCount: 5 },
    { month: 'Out 24', language: 'PT', company: 'CGC', grade: 9, avgPrice: 7600, salesCount: 2 },
    { month: 'Nov 24', language: 'PT', company: 'CGC', grade: 9, avgPrice: 8000, salesCount: 4 },
    { month: 'Dez 24', language: 'PT', company: 'CGC', grade: 9, avgPrice: 8400, salesCount: 3 },
    { month: 'Set 24', language: 'PT', company: 'CGC', grade: 10, avgPrice: 11500, salesCount: 1 },
    { month: 'Out 24', language: 'PT', company: 'CGC', grade: 10, avgPrice: 11800, salesCount: 2 },
    { month: 'Nov 24', language: 'PT', company: 'CGC', grade: 10, avgPrice: 12200, salesCount: 1 },
    { month: 'Dez 24', language: 'PT', company: 'CGC', grade: 10, avgPrice: 12600, salesCount: 2 },
    // PT — Mana Fix 9
    { month: 'Set 24', language: 'PT', company: 'Mana Fix', grade: 9, avgPrice: 6800, salesCount: 2 },
    { month: 'Out 24', language: 'PT', company: 'Mana Fix', grade: 9, avgPrice: 7000, salesCount: 3 },
    { month: 'Nov 24', language: 'PT', company: 'Mana Fix', grade: 9, avgPrice: 7200, salesCount: 2 },
    { month: 'Dez 24', language: 'PT', company: 'Mana Fix', grade: 9, avgPrice: 7500, salesCount: 1 },
    // PT — TAG 9
    { month: 'Out 24', language: 'PT', company: 'TAG', grade: 9, avgPrice: 6500, salesCount: 2 },
    { month: 'Nov 24', language: 'PT', company: 'TAG', grade: 9, avgPrice: 6800, salesCount: 3 },
    { month: 'Dez 24', language: 'PT', company: 'TAG', grade: 9, avgPrice: 7100, salesCount: 1 },
    // PT — BGA 9
    { month: 'Set 24', language: 'PT', company: 'BGA', grade: 9, avgPrice: 6400, salesCount: 2 },
    { month: 'Out 24', language: 'PT', company: 'BGA', grade: 9, avgPrice: 6600, salesCount: 1 },
    { month: 'Nov 24', language: 'PT', company: 'BGA', grade: 9, avgPrice: 6900, salesCount: 2 },
    { month: 'Dez 24', language: 'PT', company: 'BGA', grade: 9, avgPrice: 7200, salesCount: 1 },
    // EN — PSA 9-10
    { month: 'Jul 24', language: 'EN', company: 'PSA', grade: 9, avgPrice: 10200, salesCount: 4 },
    { month: 'Ago 24', language: 'EN', company: 'PSA', grade: 9, avgPrice: 10500, salesCount: 3 },
    { month: 'Set 24', language: 'EN', company: 'PSA', grade: 9, avgPrice: 11000, salesCount: 5 },
    { month: 'Out 24', language: 'EN', company: 'PSA', grade: 9, avgPrice: 10800, salesCount: 2 },
    { month: 'Nov 24', language: 'EN', company: 'PSA', grade: 9, avgPrice: 11500, salesCount: 4 },
    { month: 'Dez 24', language: 'EN', company: 'PSA', grade: 9, avgPrice: 12000, salesCount: 3 },
    { month: 'Jul 24', language: 'EN', company: 'PSA', grade: 10, avgPrice: 16500, salesCount: 1 },
    { month: 'Ago 24', language: 'EN', company: 'PSA', grade: 10, avgPrice: 17000, salesCount: 2 },
    { month: 'Set 24', language: 'EN', company: 'PSA', grade: 10, avgPrice: 17500, salesCount: 1 },
    { month: 'Out 24', language: 'EN', company: 'PSA', grade: 10, avgPrice: 17200, salesCount: 2 },
    { month: 'Nov 24', language: 'EN', company: 'PSA', grade: 10, avgPrice: 18000, salesCount: 1 },
    { month: 'Dez 24', language: 'EN', company: 'PSA', grade: 10, avgPrice: 18500, salesCount: 2 },
  ],
  // JP — Charizard VMAX (Japanese set) — standalone data for cb1-jp
  'cb1-jp': [
    { month: 'Jul 24', language: 'JP', company: 'PSA', grade: 10, avgPrice: 2200, salesCount: 2 },
    { month: 'Ago 24', language: 'JP', company: 'PSA', grade: 10, avgPrice: 2250, salesCount: 1 },
    { month: 'Set 24', language: 'JP', company: 'PSA', grade: 10, avgPrice: 2300, salesCount: 3 },
    { month: 'Out 24', language: 'JP', company: 'PSA', grade: 10, avgPrice: 2150, salesCount: 2 },
    { month: 'Nov 24', language: 'JP', company: 'PSA', grade: 10, avgPrice: 2350, salesCount: 1 },
    { month: 'Dez 24', language: 'JP', company: 'PSA', grade: 10, avgPrice: 2400, salesCount: 3 },
    { month: 'Jul 24', language: 'JP', company: 'PSA', grade: 9, avgPrice: 1400, salesCount: 3 },
    { month: 'Ago 24', language: 'JP', company: 'PSA', grade: 9, avgPrice: 1450, salesCount: 2 },
    { month: 'Set 24', language: 'JP', company: 'PSA', grade: 9, avgPrice: 1500, salesCount: 4 },
    { month: 'Out 24', language: 'JP', company: 'PSA', grade: 9, avgPrice: 1480, salesCount: 2 },
    { month: 'Nov 24', language: 'JP', company: 'PSA', grade: 9, avgPrice: 1550, salesCount: 3 },
    { month: 'Dez 24', language: 'JP', company: 'PSA', grade: 9, avgPrice: 1600, salesCount: 2 },
  ],
  // JP — Umbreon VMAX Alt Art (Japanese set) — standalone data for cb4-jp
  'cb4-jp': [
    { month: 'Jul 24', language: 'JP', company: 'PSA', grade: 9, avgPrice: 7000, salesCount: 3 },
    { month: 'Ago 24', language: 'JP', company: 'PSA', grade: 9, avgPrice: 7300, salesCount: 2 },
    { month: 'Set 24', language: 'JP', company: 'PSA', grade: 9, avgPrice: 7600, salesCount: 4 },
    { month: 'Out 24', language: 'JP', company: 'PSA', grade: 9, avgPrice: 7400, salesCount: 2 },
    { month: 'Nov 24', language: 'JP', company: 'PSA', grade: 9, avgPrice: 7800, salesCount: 3 },
    { month: 'Dez 24', language: 'JP', company: 'PSA', grade: 9, avgPrice: 8200, salesCount: 2 },
    { month: 'Jul 24', language: 'JP', company: 'PSA', grade: 10, avgPrice: 9500, salesCount: 1 },
    { month: 'Ago 24', language: 'JP', company: 'PSA', grade: 10, avgPrice: 9800, salesCount: 2 },
    { month: 'Set 24', language: 'JP', company: 'PSA', grade: 10, avgPrice: 10200, salesCount: 1 },
    { month: 'Out 24', language: 'JP', company: 'PSA', grade: 10, avgPrice: 10000, salesCount: 2 },
    { month: 'Nov 24', language: 'JP', company: 'PSA', grade: 10, avgPrice: 10500, salesCount: 1 },
    { month: 'Dez 24', language: 'JP', company: 'PSA', grade: 10, avgPrice: 10800, salesCount: 2 },
  ],
};

export const orders: Order[] = [
  { id: 'o1', status: 'entregue', cardId: 'cb1', cardName: 'Charizard VMAX PSA 10', buyerId: 'u1', buyerName: 'João M.', sellerId: 's1', sellerName: 'CardMaster BR', price: 2700, createdAt: '2024-11-15' },
  { id: 'o2', status: 'enviado', cardId: 'cb2', cardName: 'Pikachu VMAX Rainbow PSA 10', buyerId: 'u2', buyerName: 'Pedro S.', sellerId: 's2', sellerName: 'PokéCollector SP', price: 1200, createdAt: '2024-12-01' },
  { id: 'o3', status: 'pago', cardId: 'cb4', cardName: 'Umbreon VMAX Alt Art PSA 9', buyerId: 'u3', buyerName: 'Ana L.', sellerId: 's4', sellerName: 'Graded Cards BR', price: 8900, createdAt: '2024-12-10' },
  { id: 'o4', status: 'aguardando_pagamento', cardId: 'cb6', cardName: 'Giratina VSTAR Alt Art PSA 10', buyerId: 'u4', buyerName: 'Lucas R.', sellerId: 's4', sellerName: 'Graded Cards BR', price: 2100, createdAt: '2024-12-15' },
  { id: 'o5', status: 'disputa', cardId: 'cb5', cardName: 'Rayquaza VMAX Alt Art CGC 9.5', buyerId: 'u5', buyerName: 'Mariana F.', sellerId: 's3', sellerName: 'TCG Premium', price: 4200, createdAt: '2024-11-28' },
];

export const questions: Question[] = [
  // l1 — Charizard VMAX PSA 10 by CardMaster BR
  { id: 'q1', listingId: 'l1', sellerId: 's1', sellerName: 'CardMaster BR', userName: 'Pedro S.', question: 'A carta tem algum defeito visível no case?', answer: 'Não, o case está em perfeito estado, sem riscos ou marcas.', questionDate: '2024-12-05', answerDate: '2024-12-05' },
  { id: 'q2', listingId: 'l1', sellerId: 's1', sellerName: 'CardMaster BR', userName: 'Ana L.', question: 'Aceita troca por outra PSA 10?', answer: 'No momento estou aceitando apenas venda direta.', questionDate: '2024-12-08', answerDate: '2024-12-09' },
  // l2 — Charizard VMAX PSA 9 by Graded Cards BR
  { id: 'q3', listingId: 'l2', sellerId: 's4', sellerName: 'Graded Cards BR', userName: 'Lucas R.', question: 'Qual o prazo de envio após o pagamento?', questionDate: '2024-12-12' },
  // l10 — Umbreon VMAX PSA 10 by CardMaster BR
  { id: 'q4', listingId: 'l10', sellerId: 's1', sellerName: 'CardMaster BR', userName: 'Carlos T.', question: 'Essa é a versão alt art com o Umbreon no fundo noturno?', answer: 'Sim, é a versão alt art 215/203, considerada uma das mais bonitas do set.', questionDate: '2024-11-20', answerDate: '2024-11-20' },
  // l9 — Umbreon VMAX PSA 9 by Graded Cards BR
  { id: 'q5', listingId: 'l9', sellerId: 's4', sellerName: 'Graded Cards BR', userName: 'Fernanda M.', question: 'O subgrade de centralização está acima de 8?', answer: 'Sim, o subgrade de centering é 8.5.', questionDate: '2024-12-01', answerDate: '2024-12-02' },
];

export const reviews: Review[] = [
  { id: 'r1', sellerId: 's1', buyerName: 'João M.', rating: 5, comment: 'Carta chegou em perfeito estado, embalagem impecável! Super recomendo.', date: '2024-11-20' },
  { id: 'r2', sellerId: 's1', buyerName: 'Pedro S.', rating: 5, comment: 'Vendedor super atencioso, envio rápido. Voltarei a comprar!', date: '2024-10-15' },
  { id: 'r3', sellerId: 's4', buyerName: 'Ana L.', rating: 4, comment: 'Carta conforme anunciado, mas demorou um pouco para enviar.', date: '2024-11-25' },
  { id: 'r4', sellerId: 's2', buyerName: 'Mariana F.', rating: 5, comment: 'Excelente experiência! Carta linda e envio super cuidadoso.', date: '2024-12-01' },
  { id: 'r5', sellerId: 's4', buyerName: 'Bruno M.', rating: 5, comment: 'Melhor vendedor de cartas graduadas do Brasil. Sério mesmo.', date: '2024-10-08' },
];
