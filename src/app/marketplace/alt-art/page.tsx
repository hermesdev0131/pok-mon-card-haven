"use client";

import { CardListing } from '@/components/CardListing';
import { cards } from '@/data/mock';
import { Palette } from 'lucide-react';

const altArtCards = cards.filter(c => c.tags?.includes('alt-art')).sort((a, b) => b.price - a.price);

export default function AltArtPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/10 ring-1 ring-pink-500/20">
            <Palette className="h-5 w-5 text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Alt Art — Ilustrações Alternativas</h1>
            <p className="text-sm text-muted-foreground">{altArtCards.length} cartas com arte alternativa exclusiva</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {altArtCards.map(card => (
          <CardListing key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
