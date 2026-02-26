"use client";

import { CardBaseCard } from '@/components/CardBaseCard';
import { Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCardBasesWithPSA10 } from '@/lib/api';
import type { CardBaseWithStats } from '@/types';

export default function PSA10Page() {
  const [stats, setStats] = useState<CardBaseWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCardBasesWithPSA10().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
            <Award className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">PSA 10 — Nota Máxima</h1>
            <p className="text-sm text-muted-foreground">{stats.length} cartas com anúncios PSA 10</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-2xl bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {stats.map(item => (
            <CardBaseCard key={item.cardBase.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
