import type { Card, Seller, SaleRecord, Order, Question, Review, PricePoint } from '@/types';

export const sellers: Seller[] = [
  { id: 's1', name: 'CardMaster BR', avatar: '', verified: true, isNew: false, rating: 4.9, totalSales: 287, joinedAt: '2022-03-15' },
  { id: 's2', name: 'PokéCollector SP', avatar: '', verified: true, isNew: false, rating: 4.7, totalSales: 156, joinedAt: '2022-08-20' },
  { id: 's3', name: 'TCG Premium', avatar: '', verified: false, isNew: true, rating: 5.0, totalSales: 12, joinedAt: '2024-11-01' },
  { id: 's4', name: 'Graded Cards BR', avatar: '', verified: true, isNew: false, rating: 4.8, totalSales: 421, joinedAt: '2021-06-10' },
];

export const cards: Card[] = [
  { id: 'c1', name: 'Charizard VMAX', set: 'Darkness Ablaze', number: '020/189', grade: 10, gradeCompany: 'PSA', price: 2850, images: [], sellerId: 's1', createdAt: '2024-12-01', type: 'fire' },
  { id: 'c2', name: 'Pikachu VMAX Rainbow', set: 'Vivid Voltage', number: '188/185', grade: 10, gradeCompany: 'PSA', price: 1200, images: [], sellerId: 's2', createdAt: '2024-12-05', type: 'electric' },
  { id: 'c3', name: 'Mew VMAX Alt Art', set: 'Fusion Strike', number: '268/264', grade: 9.5, gradeCompany: 'BGS', price: 3500, images: [], sellerId: 's1', createdAt: '2024-11-28', type: 'psychic', freeShipping: true },
  { id: 'c4', name: 'Umbreon VMAX Alt Art', set: 'Evolving Skies', number: '215/203', grade: 9, gradeCompany: 'PSA', price: 8900, images: [], sellerId: 's4', createdAt: '2024-11-15', type: 'dark' },
  { id: 'c5', name: 'Rayquaza VMAX Alt Art', set: 'Evolving Skies', number: '218/203', grade: 9.5, gradeCompany: 'CGC', price: 4200, images: [], sellerId: 's3', createdAt: '2024-12-10', type: 'dragon' },
  { id: 'c6', name: 'Giratina VSTAR Alt Art', set: 'Lost Origin', number: '131/196', grade: 10, gradeCompany: 'PSA', price: 2100, images: [], sellerId: 's4', createdAt: '2024-12-08', type: 'ghost' },
  { id: 'c7', name: 'Lugia VSTAR Alt Art', set: 'Silver Tempest', number: '186/195', grade: 10, gradeCompany: 'PSA', price: 5600, images: [], sellerId: 's2', createdAt: '2024-11-20', type: 'flying', freeShipping: true },
  { id: 'c8', name: 'Charizard ex SAR', set: 'Pokémon 151', number: '199/165', grade: 10, gradeCompany: 'PSA', price: 3200, images: [], sellerId: 's4', createdAt: '2024-12-12', type: 'fire' },
];

export const salesHistory: Record<string, SaleRecord[]> = {
  c1: [
    { date: '2024-11-15', price: 2700, grade: 10, gradeCompany: 'PSA', buyerName: 'João M.' },
    { date: '2024-10-22', price: 2650, grade: 10, gradeCompany: 'PSA', buyerName: 'Pedro S.' },
    { date: '2024-09-10', price: 2500, grade: 9, gradeCompany: 'PSA', buyerName: 'Ana L.' },
    { date: '2024-08-05', price: 2800, grade: 10, gradeCompany: 'PSA', buyerName: 'Lucas R.' },
    { date: '2024-07-18', price: 1800, grade: 9, gradeCompany: 'PSA', buyerName: 'Mariana F.' },
  ],
  c4: [
    { date: '2024-11-01', price: 8500, grade: 9, gradeCompany: 'PSA', buyerName: 'Carlos T.' },
    { date: '2024-09-15', price: 8200, grade: 9, gradeCompany: 'PSA', buyerName: 'Fernanda R.' },
    { date: '2024-08-20', price: 9100, grade: 10, gradeCompany: 'PSA', buyerName: 'Bruno M.' },
  ],
  c8: [
    { date: '2024-12-01', price: 3100, grade: 10, gradeCompany: 'PSA', buyerName: 'Rafael S.' },
    { date: '2024-11-10', price: 2900, grade: 10, gradeCompany: 'PSA', buyerName: 'Camila T.' },
  ],
};

export const priceHistory: Record<string, PricePoint[]> = {
  c1: [
    { month: 'Jul 24', raw: 800, psa9: 1800, psa10: 2800 },
    { month: 'Ago 24', raw: 850, psa9: 1900, psa10: 2850 },
    { month: 'Set 24', raw: 820, psa9: 2000, psa10: 2700 },
    { month: 'Out 24', raw: 900, psa9: 2100, psa10: 2650 },
    { month: 'Nov 24', raw: 880, psa9: 2200, psa10: 2700 },
    { month: 'Dez 24', raw: 950, psa9: 2300, psa10: 2850 },
  ],
  c4: [
    { month: 'Jul 24', psa9: 7500, psa10: 12000 },
    { month: 'Ago 24', psa9: 7800, psa10: 12500 },
    { month: 'Set 24', psa9: 8200, psa10: 13000 },
    { month: 'Out 24', psa9: 8000, psa10: 12800 },
    { month: 'Nov 24', psa9: 8500, psa10: 13200 },
    { month: 'Dez 24', psa9: 8900, psa10: 13500 },
  ],
};

export const orders: Order[] = [
  { id: 'o1', status: 'entregue', cardId: 'c1', cardName: 'Charizard VMAX PSA 10', buyerId: 'u1', buyerName: 'João M.', sellerId: 's1', sellerName: 'CardMaster BR', price: 2700, createdAt: '2024-11-15' },
  { id: 'o2', status: 'enviado', cardId: 'c2', cardName: 'Pikachu VMAX Rainbow PSA 10', buyerId: 'u2', buyerName: 'Pedro S.', sellerId: 's2', sellerName: 'PokéCollector SP', price: 1200, createdAt: '2024-12-01' },
  { id: 'o3', status: 'pago', cardId: 'c4', cardName: 'Umbreon VMAX Alt Art PSA 9', buyerId: 'u3', buyerName: 'Ana L.', sellerId: 's4', sellerName: 'Graded Cards BR', price: 8900, createdAt: '2024-12-10' },
  { id: 'o4', status: 'aguardando_pagamento', cardId: 'c6', cardName: 'Giratina VSTAR Alt Art PSA 10', buyerId: 'u4', buyerName: 'Lucas R.', sellerId: 's4', sellerName: 'Graded Cards BR', price: 2100, createdAt: '2024-12-15' },
  { id: 'o5', status: 'disputa', cardId: 'c5', cardName: 'Rayquaza VMAX Alt Art CGC 9.5', buyerId: 'u5', buyerName: 'Mariana F.', sellerId: 's3', sellerName: 'TCG Premium', price: 4200, createdAt: '2024-11-28' },
];

export const questions: Question[] = [
  { id: 'q1', cardId: 'c1', userName: 'Pedro S.', question: 'A carta tem algum defeito visível no case?', answer: 'Não, o case está em perfeito estado, sem riscos ou marcas.', questionDate: '2024-12-05', answerDate: '2024-12-05' },
  { id: 'q2', cardId: 'c1', userName: 'Ana L.', question: 'Aceita troca por outra PSA 10?', answer: 'No momento estou aceitando apenas venda direta.', questionDate: '2024-12-08', answerDate: '2024-12-09' },
  { id: 'q3', cardId: 'c1', userName: 'Lucas R.', question: 'Qual o prazo de envio após o pagamento?', questionDate: '2024-12-12' },
  { id: 'q4', cardId: 'c4', userName: 'Carlos T.', question: 'Essa é a versão alt art com o Umbreon no fundo noturno?', answer: 'Sim, é a versão alt art 215/203, considerada uma das mais bonitas do set.', questionDate: '2024-11-20', answerDate: '2024-11-20' },
];

export const reviews: Review[] = [
  { id: 'r1', sellerId: 's1', buyerName: 'João M.', rating: 5, comment: 'Carta chegou em perfeito estado, embalagem impecável! Super recomendo.', date: '2024-11-20' },
  { id: 'r2', sellerId: 's1', buyerName: 'Pedro S.', rating: 5, comment: 'Vendedor super atencioso, envio rápido. Voltarei a comprar!', date: '2024-10-15' },
  { id: 'r3', sellerId: 's4', buyerName: 'Ana L.', rating: 4, comment: 'Carta conforme anunciado, mas demorou um pouco para enviar.', date: '2024-11-25' },
  { id: 'r4', sellerId: 's2', buyerName: 'Mariana F.', rating: 5, comment: 'Excelente experiência! Carta linda e envio super cuidadoso.', date: '2024-12-01' },
  { id: 'r5', sellerId: 's4', buyerName: 'Bruno M.', rating: 5, comment: 'Melhor vendedor de cartas graduadas do Brasil. Sério mesmo.', date: '2024-10-08' },
];

export function getSellerForCard(cardId: string): Seller | undefined {
  const card = cards.find(c => c.id === cardId);
  if (!card) return undefined;
  return sellers.find(s => s.id === card.sellerId);
}
