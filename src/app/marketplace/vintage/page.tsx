"use client";

import { CardListing } from '@/components/CardListing';
import { cards } from '@/data/mock';
import { Clock } from 'lucide-react';

const vintageCards = cards.filter(c => c.tags?.includes('vintage')).sort((a, b) => b.price - a.price);

export default function VintagePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/20">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Vintage — Cartas Clássicas</h1>
            <p className="text-sm text-muted-foreground">{vintageCards.length} cartas de sets clássicos e raros</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {vintageCards.map(card => (
          <CardListing key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
