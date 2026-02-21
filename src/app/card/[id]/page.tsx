"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SalesHistoryTable } from '@/components/SalesHistoryTable';
import { QnA } from '@/components/QnA';
import { ListingTable } from '@/components/ListingTable';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const PriceChart = dynamic(() => import('@/components/PriceChart').then(m => ({ default: m.PriceChart })), {
  ssr: false,
  loading: () => <div className="h-64 rounded-lg bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />,
});

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { getCardBase, getListingsForCard, getSalesHistory, getPriceHistory, getQuestions } from '@/lib/api';
import { sellers as allSellers } from '@/data/mock';
import { ArrowDown, ArrowUp, Minus, ShoppingCart } from 'lucide-react';
import type { CardBase, Listing, Seller, SaleRecord, PricePoint, Question } from '@/types';

export default function CardDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [cardBase, setCardBase] = useState<CardBase | null>(null);
  const [cardListings, setCardListings] = useState<Listing[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getCardBase(id),
      getListingsForCard(id),
      getSalesHistory(id),
      getPriceHistory(id),
      getQuestions(id),
    ]).then(([cb, ls, s, p, q]) => {
      setCardBase(cb);
      setCardListings(ls);
      setSales(s);
      setPrices(p);
      setQuestions(q);
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

  // Price stats
  const priceStats = useMemo(() => {
    if (cardListings.length === 0) return null;
    const listingPrices = cardListings.map(l => l.price);
    const min = Math.min(...listingPrices);
    const max = Math.max(...listingPrices);
    const avg = Math.round(listingPrices.reduce((a, b) => a + b, 0) / listingPrices.length);
    return { min, max, avg };
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
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left — Generic card image */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-3">
            <div className="relative aspect-[3/4] rounded-xl bg-gradient-to-b from-secondary to-background flex items-center justify-center border border-white/[0.06] overflow-hidden">
              {cardBase.imageUrl ? (
                <Image
                  src={cardBase.imageUrl}
                  alt={cardBase.name}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
              ) : (
                <span className="text-8xl opacity-20">🃏</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground/50 text-center italic">
              *Imagem meramente ilustrativa
            </p>

            {/* Card metadata */}
            <div className="glass rounded-xl p-4 space-y-2">
              {cardBase.rarity && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Raridade</span>
                  <span className="font-medium">{cardBase.rarity}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Set</span>
                <span className="font-medium">{cardBase.set}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Código</span>
                <span className="font-medium uppercase">{cardBase.setCode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Número</span>
                <span className="font-medium">{cardBase.number}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Card info + Tabs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              {cardBase.name} ({cardBase.number})
            </h1>
            <p className="text-muted-foreground mt-1">{cardBase.set}</p>
          </div>

          {/* Listing count + Price range */}
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-accent border-accent/30 gap-1.5">
                <ShoppingCart className="h-3 w-3" />
                {cardListings.length} {cardListings.length === 1 ? 'anúncio' : 'anúncios'}
              </Badge>
            </div>

            {priceStats && (
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                    <ArrowDown className="h-3 w-3 text-accent" /> Menor
                  </div>
                  <p className="font-bold text-accent">
                    R$ {priceStats.min.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-center border-x border-white/[0.06]">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                    <Minus className="h-3 w-3" /> Média
                  </div>
                  <p className="font-bold">
                    R$ {priceStats.avg.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                    <ArrowUp className="h-3 w-3 text-orange-400" /> Maior
                  </div>
                  <p className="font-bold text-orange-400">
                    R$ {priceStats.max.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tabs — Buy Now is default */}
          <Tabs defaultValue="buy" className="mt-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="buy">Comprar Agora ({cardListings.length})</TabsTrigger>
              <TabsTrigger value="sales">Histórico de vendas</TabsTrigger>
              <TabsTrigger value="prices">Gráfico de preços</TabsTrigger>
              <TabsTrigger value="questions">Perguntas ({questions.length})</TabsTrigger>
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
            <TabsContent value="questions">
              <QnA questions={questions} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
