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
import { useState, useEffect } from 'react';
import { getCardBase, getListingsForCard, getSalesHistory, getPriceHistory, getSellersForListings } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';

import type { CardBase, Listing, Seller, SaleRecord, PricePoint } from '@/types';

export default function CardDetailPageGuarded() {
  return (
    <RequireAuth>
      <CardDetailPage />
    </RequireAuth>
  );
}

function CardDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [cardBase, setCardBase] = useState<CardBase | null>(null);
  const [cardListings, setCardListings] = useState<Listing[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [sellersMap, setSellersMap] = useState<Record<string, Seller>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getCardBase(id),
      getListingsForCard(id),
      getSalesHistory(id),
      getPriceHistory(id),
    ]).then(async ([cb, ls, s, p]) => {
      setCardBase(cb);
      setCardListings(ls);
      setSales(s);
      setPrices(p);
      // Fetch sellers for the listings
      const sellerIds = Array.from(new Set(ls.map(l => l.sellerId)));
      const sellers = await getSellersForListings(sellerIds);
      setSellersMap(sellers);
      setLoading(false);
    });
  }, [id]);

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

  const cardImage = (
    <div className="group/img relative aspect-[3/4] rounded-xl bg-gradient-to-b from-secondary to-background flex items-center justify-center border border-white/[0.06] overflow-hidden">
      {cardBase.imageUrl ? (
        <Image
          src={cardBase.imageUrl}
          alt={cardBase.name}
          fill
          unoptimized
          className="object-contain p-3 group-hover/img:scale-[1.03] transition-transform duration-500"
          sizes="(max-width: 1024px) 120px, 400px"
          priority
        />
      ) : (
        <span className="text-8xl opacity-20">🃏</span>
      )}
    </div>
  );

  const cardHeader = (
    <div>
      <h1 className="text-xl font-bold lg:text-3xl">
        {cardBase.name} ({cardBase.number})
      </h1>
      <div className="flex flex-wrap items-center gap-2 mt-1">
        <p className="text-sm text-muted-foreground">{cardBase.set}</p>
        <span className="text-muted-foreground/30">·</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[11px] font-medium text-accent">
          {cardListings.length} {cardListings.length === 1 ? 'anúncio' : 'anúncios'}
        </span>
      </div>
    </div>
  );

  const cardTabs = (
    <Tabs defaultValue="buy" className="mt-4">
      <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden">
        <TabsTrigger value="buy" className="shrink-0"><span className="lg:hidden">Comprar ({cardListings.length})</span><span className="hidden lg:inline">Comprar Agora ({cardListings.length})</span></TabsTrigger>
        <TabsTrigger value="sales" className="shrink-0"><span className="lg:hidden">Hist. Vendas</span><span className="hidden lg:inline">Histórico de Vendas</span></TabsTrigger>
        <TabsTrigger value="prices" className="shrink-0"><span className="lg:hidden">Hist. Preços</span><span className="hidden lg:inline">Histórico de Preços</span></TabsTrigger>
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
  );

  return (
    <div className="container mx-auto px-4 py-8 overflow-x-hidden">
      {/* Mobile layout: compact image + title side by side, then tabs */}
      <div className="lg:hidden space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-[120px] shrink-0">
            {cardImage}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            {cardHeader}
          </div>
        </div>
        {cardTabs}
      </div>

      {/* Desktop layout: large image sidebar + content */}
      <div className="hidden lg:grid grid-cols-[400px_1fr] gap-8">
        <div>
          <div className="sticky top-24">
            {cardImage}
          </div>
        </div>
        <div className="space-y-6">
          {cardHeader}
          {cardTabs}
        </div>
      </div>
    </div>
  );
}
