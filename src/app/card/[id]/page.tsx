"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesHistoryTable } from '@/components/SalesHistoryTable';

import { ListingTable } from '@/components/ListingTable';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const PriceChart = dynamic(() => import('@/components/PriceChart').then(m => ({ default: m.PriceChart })), {
  ssr: false,
  loading: () => <div className="h-64 rounded-lg bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />,
});

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { getCardBase, getListingsForCard, getSalesHistory, getPriceHistory } from '@/lib/api';
import { sellers as allSellers } from '@/data/mock';

import type { CardBase, Listing, Seller, SaleRecord, PricePoint } from '@/types';

export default function CardDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [cardBase, setCardBase] = useState<CardBase | null>(null);
  const [cardListings, setCardListings] = useState<Listing[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getCardBase(id),
      getListingsForCard(id),
      getSalesHistory(id),
      getPriceHistory(id),
    ]).then(([cb, ls, s, p]) => {
      setCardBase(cb);
      setCardListings(ls);
      setSales(s);
      setPrices(p);
      setLoading(false);
    });
  }, [id]);

  // Build seller lookup for the listings
  const sellersMap = useMemo(() => {
    const map: Record<string, Seller> = {};
    cardListings.forEach(l => {
      const seller = allSellers.find(s => s.id === l.sellerId);
      if (seller) map[seller.id] = seller;
    });
    return map;
  }, [cardListings]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-96 rounded-lg bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
          <div className="h-8 w-1/3 rounded bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
        </div>
      </div>
    );
  }

  if (!cardBase) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Carta não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        {/* Left — Card image */}
        <div>
          <div className="sticky top-24 space-y-3">
            <div className="group/img relative aspect-[3/4] rounded-xl bg-gradient-to-b from-secondary to-background flex items-center justify-center border border-white/[0.06] overflow-hidden">
              {cardBase.imageUrl ? (
                <Image
                  src={cardBase.imageUrl}
                  alt={cardBase.name}
                  fill
                  unoptimized
                  className="object-contain p-3 group-hover/img:scale-[1.03] transition-transform duration-500"
                  sizes="400px"
                  priority
                />
              ) : (
                <span className="text-8xl opacity-20">🃏</span>
              )}
            </div>
       
          </div>
        </div>

        {/* Right — Card info + Tabs */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              {cardBase.name} ({cardBase.number})
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">{cardBase.set}</p>
              <span className="text-muted-foreground/30">·</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[11px] font-medium text-accent">
                {cardListings.length} {cardListings.length === 1 ? 'anúncio' : 'anúncios'}
              </span>
            </div>
          </div>

          {/* Tabs — Buy Now is default */}
          <Tabs defaultValue="buy" className="mt-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="buy">Comprar Agora ({cardListings.length})</TabsTrigger>
              <TabsTrigger value="sales">Histórico de vendas</TabsTrigger>
              <TabsTrigger value="prices">Gráfico de preços</TabsTrigger>
            </TabsList>

            <TabsContent value="buy">
              <ListingTable listings={cardListings} sellers={sellersMap} />
            </TabsContent>
            <TabsContent value="sales">
              <SalesHistoryTable sales={sales} />
            </TabsContent>
            <TabsContent value="prices">
              <PriceChart data={prices} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
