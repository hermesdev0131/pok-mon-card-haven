"use client";

import { GradeBadge } from '@/components/GradeBadge';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { FlagIcon } from '@/components/FlagIcon';
import { Clock, Truck, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getRecentListings } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { CardBase, Listing, Seller } from '@/types';

type RecentListing = Listing & { cardBase: CardBase; seller?: Seller };

export default function UltimosAnunciosPage() {
  const [recentListings, setRecentListings] = useState<RecentListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentListings().then(data => {
      setRecentListings(data);
      setLoading(false);
    });
  }, []);

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

      {loading ? (
        <div className="space-y-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {recentListings.map(listing => {
            const { cardBase, seller } = listing;

            return (
              <Link
                key={listing.id}
                href={`/card/${cardBase.id}`}
                className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-accent/30 hover:bg-white/[0.05] transition-all duration-200"
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
                    <p className="text-xs text-muted-foreground truncate">{cardBase.set}</p>
                    {seller && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
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

                <div className="flex items-center justify-between gap-3 w-full sm:w-auto pl-14 sm:pl-0">
                  <div className="flex items-center gap-2">
                    <FlagIcon code={listing.language} />
                    <GradeBadge grade={listing.grade} company={listing.gradeCompany} pristine={listing.pristine} />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-accent">R$ {formatPrice(listing.price)}</p>
                    {listing.freeShipping && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-accent">
                        <Truck className="h-2.5 w-2.5" /> Frete grátis
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
