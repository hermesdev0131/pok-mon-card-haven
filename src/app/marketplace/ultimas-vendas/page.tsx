"use client";

import { salesHistory, cardBases, sellers } from '@/data/mock';
import { GradeBadge } from '@/components/GradeBadge';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { FlagIcon } from '@/components/FlagIcon';
import { TrendingUp, Star } from 'lucide-react';
import Image from 'next/image';
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
    imageUrl: cardBase.imageUrl,
    seller: sellers.find(s => s.name === record.sellerName),
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
            className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-accent/30 hover:bg-white/[0.05] transition-all duration-200"
          >
            <div className="relative h-14 w-10 rounded-lg bg-gradient-to-br from-white/[0.06] to-white/[0.02] overflow-hidden shrink-0">
              {sale.imageUrl ? (
                <Image src={sale.imageUrl} alt={sale.cardName} fill className="object-contain p-0.5" sizes="40px" />
              ) : (
                <span className="flex items-center justify-center h-full text-xl opacity-40">🃏</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{sale.cardName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground truncate">{sale.cardSet}</p>
                <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  · {sale.sellerName} {sale.seller?.verified && <VerifiedBadge />}
                </span>
              </div>
              {sale.seller && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Star className="h-3 w-3 fill-gold text-gold" /> {sale.seller.rating}
                  <span className="text-muted-foreground/40">·</span>
                  {sale.seller.totalSales} vendas
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 w-full sm:w-auto pl-14 sm:pl-0">
              <div className="flex items-center gap-2">
                <FlagIcon code={sale.language} />
                <GradeBadge grade={sale.grade} company={sale.gradeCompany} pristine={sale.pristine} />
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-accent">R$ {sale.price.toLocaleString('pt-BR')}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(sale.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
