"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GradeBadge } from '@/components/GradeBadge';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { SalesHistoryTable } from '@/components/SalesHistoryTable';
import { PriceChart } from '@/components/PriceChart';
import { QnA } from '@/components/QnA';
import { CardListing } from '@/components/CardListing';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCard, getSeller, getSalesHistory, getPriceHistory, getQuestions, getCards } from '@/lib/api';
import { Shield, Star, ShoppingBag, Truck } from 'lucide-react';
import type { Card as CardType, Seller, SaleRecord, PricePoint, Question } from '@/types';

export default function CardDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [card, setCard] = useState<CardType | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [similar, setSimilar] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getCard(id),
      getSalesHistory(id),
      getPriceHistory(id),
      getQuestions(id),
    ]).then(([c, s, p, q]) => {
      setCard(c);
      setSales(s);
      setPrices(p);
      setQuestions(q);
      if (c) {
        getSeller(c.sellerId).then(setSeller);
        getCards().then(all => setSimilar(all.filter(a => a.id !== c.id).slice(0, 4)));
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-96 rounded-lg bg-secondary" />
          <div className="h-8 w-1/3 rounded bg-secondary" />
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Carta não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Image */}
        <div className="lg:col-span-2">
          <div className="aspect-[3/4] rounded-lg bg-secondary flex items-center justify-center sticky top-24">
            <span className="text-8xl opacity-20">🃏</span>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-3 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <GradeBadge grade={card.grade} company={card.gradeCompany} />
              {card.freeShipping && (
                <Badge variant="outline" className="text-success border-success/30 gap-1 text-xs">
                  <Truck className="h-3 w-3" /> Frete grátis
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">{card.name}</h1>
            <p className="text-muted-foreground">{card.set} · #{card.number}</p>
          </div>

          <div className="text-3xl font-extrabold">R$ {card.price.toLocaleString('pt-BR')}</div>

          <Button size="lg" className="w-full sm:w-auto gap-2" asChild>
            <Link href={`/checkout/o-new`}>
              <Shield className="h-4 w-4" /> Comprar com pagamento protegido
            </Link>
          </Button>

          {/* Seller */}
          {seller && (
            <Card className="border-border/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-muted-foreground">
                  {seller.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{seller.name}</span>
                    {seller.verified && <VerifiedBadge />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-accent" />{seller.rating}</span>
                    <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{seller.totalSales} vendas</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/seller/${seller.id}`}>Ver perfil</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="sales" className="mt-8">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="sales">Histórico de vendas</TabsTrigger>
              <TabsTrigger value="prices">Gráfico de preços</TabsTrigger>
              <TabsTrigger value="questions">Perguntas ({questions.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="sales"><SalesHistoryTable sales={sales} /></TabsContent>
            <TabsContent value="prices"><PriceChart data={prices} /></TabsContent>
            <TabsContent value="questions"><QnA questions={questions} /></TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold mb-6">Cartas semelhantes</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {similar.map(c => <CardListing key={c.id} card={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}
