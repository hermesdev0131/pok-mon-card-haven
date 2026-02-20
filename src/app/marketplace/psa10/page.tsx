"use client";

import { CardListing } from '@/components/CardListing';
import { cards } from '@/data/mock';
import { Award } from 'lucide-react';

const psa10Cards = cards.filter(c => c.grade === 10).sort((a, b) => b.price - a.price);

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
            <p className="text-sm text-muted-foreground">{psa10Cards.length} cartas com grading perfeito</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {psa10Cards.map(card => (
          <CardListing key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
