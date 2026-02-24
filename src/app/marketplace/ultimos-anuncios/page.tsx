"use client";

import { GradeBadge } from '@/components/GradeBadge';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { FlagIcon } from '@/components/FlagIcon';
import { listings, cardBases, sellers } from '@/data/mock';
import { Clock, Truck, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const recentListings = [...listings]
  .filter(l => l.status === 'active')
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export default function UltimosAnunciosPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
            <Clock className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Últimos Anúncios</h1>
            <p className="text-sm text-muted-foreground">{recentListings.length} anúncios recentes</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {recentListings.map(listing => {
          const cardBase = cardBases.find(cb => cb.id === listing.cardBaseId);
          const seller = sellers.find(s => s.id === listing.sellerId);
          if (!cardBase) return null;

          return (
            <Link
              key={listing.id}
              href={`/card/${cardBase.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-accent/30 hover:bg-white/[0.05] transition-all duration-200"
            >
              <div className="relative h-14 w-10 rounded-lg bg-gradient-to-br from-white/[0.06] to-white/[0.02] overflow-hidden shrink-0">
                {cardBase.imageUrl ? (
                  <Image src={cardBase.imageUrl} alt={cardBase.name} fill className="object-contain p-0.5" sizes="40px" />
                ) : (
                  <span className="flex items-center justify-center h-full text-xl opacity-40">🃏</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{cardBase.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">{cardBase.set}</p>
                  {seller && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      · {seller.name} {seller.verified && <VerifiedBadge />}
                    </span>
                  )}
                </div>
                {seller && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Star className="h-3 w-3 fill-gold text-gold" /> {seller.rating}
                    <span className="text-muted-foreground/40">·</span>
                    {seller.totalSales} vendas
                  </span>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <FlagIcon code={listing.language} />
                <GradeBadge grade={listing.grade} company={listing.gradeCompany} />
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-accent">R$ {listing.price.toLocaleString('pt-BR')}</p>
                {listing.freeShipping && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-accent">
                    <Truck className="h-2.5 w-2.5" /> Frete grátis
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
