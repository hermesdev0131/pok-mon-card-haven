"use client";

import { CardBaseCard } from '@/components/CardBaseCard';
import { cardBases, listings } from '@/data/mock';
import { Award } from 'lucide-react';
import type { CardBaseWithStats } from '@/types';

// Find card bases that have at least one PSA 10 listing
const psa10Stats: CardBaseWithStats[] = cardBases
  .map(cb => {
    const psa10Listings = listings.filter(
      l => l.cardBaseId === cb.id && l.status === 'active' && l.gradeCompany === 'PSA' && l.grade === 10
    );
    const allActive = listings.filter(l => l.cardBaseId === cb.id && l.status === 'active');
    const prices = allActive.map(l => l.price);
    return {
      cardBase: cb,
      listingCount: allActive.length,
      lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
      highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
      hasPsa10: psa10Listings.length > 0,
    };
  })
  .filter(s => s.hasPsa10)
  .map(({ hasPsa10: _, ...rest }) => rest);

export default function PSA10Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
            <Award className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">PSA 10 — Nota Máxima</h1>
            <p className="text-sm text-muted-foreground">{psa10Stats.length} cartas com anúncios PSA 10</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {psa10Stats.map(item => (
          <CardBaseCard key={item.cardBase.id} item={item} />
        ))}
      </div>
    </div>
  );
}
