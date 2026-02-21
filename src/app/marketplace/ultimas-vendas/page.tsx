"use client";

import { salesHistory } from '@/data/mock';
import { cardBases } from '@/data/mock';
import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

// Flatten all sale records with card base info
const allSales = Object.entries(salesHistory).flatMap(([cardBaseId, records]) => {
  const cardBase = cardBases.find(cb => cb.id === cardBaseId);
  if (!cardBase) return [];
  return records.map(record => ({
    ...record,
    cardBaseId,
    cardName: cardBase.name,
    cardSet: cardBase.set,
  }));
}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export default function UltimasVendasPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Últimas Vendas</h1>
            <p className="text-sm text-muted-foreground">{allSales.length} vendas confirmadas no marketplace</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {allSales.map((sale, i) => (
          <Link
            key={`${sale.cardBaseId}-${sale.date}-${i}`}
            href={`/card/${sale.cardBaseId}`}
            className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-accent/30 hover:bg-white/[0.05] transition-all duration-200"
          >
            <div className="h-14 w-10 rounded-lg bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center shrink-0">
              <span className="text-xl opacity-40">🃏</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{sale.cardName}</p>
              <p className="text-xs text-muted-foreground">{sale.cardSet}</p>
            </div>

            <div className="text-center shrink-0">
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${sale.grade === 10 ? 'bg-accent/10 text-accent' : 'bg-secondary text-secondary-foreground'}`}>
                {sale.gradeCompany} {sale.grade}
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="font-bold text-accent">R$ {sale.price.toLocaleString('pt-BR')}</p>
              <p className="text-[11px] text-muted-foreground">
                {new Date(sale.date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
