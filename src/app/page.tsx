"use client";

import { Button } from '@/components/ui/button';
import { CardBaseCard } from '@/components/CardBaseCard';
import { SellerCard } from '@/components/SellerCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, ArrowRight, Star, Sparkles, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCardBasesWithStats, getAllSellers } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';
import type { CardBaseWithStats, Seller } from '@/types';

export default function Home() {
  const { tokenRefreshCount } = useAuth();
  const [allStats, setAllStats] = useState<CardBaseWithStats[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCardBasesWithStats(), getAllSellers()]).then(([stats, s]) => {
      setAllStats(stats);
      setSellers(s);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [tokenRefreshCount]);

  const featuredCard = allStats.find(s => s.cardBase.name.includes('Umbreon')) ?? allStats[0];
  const highlightCards = allStats.slice(0, 5);
  const recentCards = [...allStats].slice(0, 5);
  const topSellers = sellers.filter(s => s.verified).sort((a, b) => b.totalSales - a.totalSales);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="animate-pulse space-y-12">
          <div className="h-80 rounded-2xl bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero — Product-focused like Rare Candy */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="blob blob-accent w-[900px] h-[900px] -top-[400px] left-1/2 -translate-x-1/2 opacity-20 animate-float" />
          <div className="blob blob-purple w-[500px] h-[500px] bottom-0 -left-[200px] animate-float-slow" />
          <div className="blob blob-cyan w-[400px] h-[400px] -bottom-[100px] right-0 animate-float" />
        </div>

        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            {/* Left — Text */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                1º marketplace brasileiro dedicado a cartas graduadas
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl leading-[1.1]">
                Encontre as cartas{' '}
                <span className="text-accent text-glow-accent">mais desejadas do mercado</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                PSA, CGC, Beckett, TAG, ManaFix, GBA e as principais grading companies reunidas em um só lugar. Transparência total, vendedores verificados e pagamento 100% protegido.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row pt-2">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 glow-accent" asChild>
                  <Link href="/marketplace/nacional">Explorar marketplace <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button variant="outline" size="lg" className="border-accent/30 text-accent hover:bg-accent/10" asChild>
                  <Link href="/sell">Vender carta</Link>
                </Button>
              </div>
            </div>

            {/* Right — Featured card spotlight */}
            <div className="relative flex justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-[300px] w-[300px] rounded-full bg-accent/10 blur-[80px]" />
              </div>
              {featuredCard && (
                <Link href={`/card/${featuredCard.cardBase.id}`} className="relative group">
                  <div className="glass glow-accent rounded-2xl p-6 space-y-4 transition-all duration-300 group-hover:shadow-[0_0_40px_hsl(var(--accent)/0.15)] group-hover:scale-[1.02]">
                    <div className="relative aspect-[3/4] w-56 mx-auto bg-gradient-to-b from-secondary to-background rounded-xl flex items-center justify-center overflow-hidden">
                      {featuredCard.cardBase.imageUrl ? (
                        <Image
                          src={featuredCard.cardBase.imageUrl}
                          alt={featuredCard.cardBase.name}
                          fill
                          quality={95}
                          className="object-contain p-3 group-hover:scale-[1.03] transition-transform duration-500"
                          sizes="224px"
                          priority
                        />
                      ) : (
                        <div className="text-8xl opacity-40 group-hover:scale-[1.03] transition-transform duration-500">🃏</div>
                      )}
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-xs text-accent font-medium uppercase tracking-wider">Destaque</p>
                      <h3 className="font-bold text-lg">{featuredCard.cardBase.name}</h3>
                      <p className="text-sm text-muted-foreground">{featuredCard.cardBase.set} · #{featuredCard.cardBase.number}</p>
                      <p className="text-sm text-muted-foreground">{featuredCard.listingCount} anúncios</p>
                      <p className="text-2xl font-bold text-accent text-glow-accent">
                        a partir de R$ {formatPrice(featuredCard.lowestPrice)}
                      </p>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Destaques</h2>
            <p className="text-sm text-muted-foreground mt-1">As cartas mais procuradas do marketplace</p>
          </div>
          <Button variant="ghost" className="text-accent hover:text-accent/80 gap-1" asChild>
            <Link href="/marketplace/nacional">Ver todas <ChevronRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {highlightCards.map(item => (
            <CardBaseCard key={item.cardBase.id} item={item} />
          ))}
        </div>
      </section>

      {/* Recently Listed */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Adicionadas recentemente</h2>
            <p className="text-sm text-muted-foreground mt-1">As últimas cartas com anúncios no marketplace</p>
          </div>
          <Button variant="ghost" className="text-accent hover:text-accent/80 gap-1" asChild>
            <Link href="/marketplace/nacional">Ver todas <ChevronRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {recentCards.map(item => (
            <CardBaseCard key={item.cardBase.id} item={item} />
          ))}
        </div>
      </section>

      {/* Top Sellers */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Vendedores verificados</h2>
            <p className="text-sm text-muted-foreground mt-1">Compre de vendedores com selo de confiança</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topSellers.map(seller => (
            <SellerCard key={seller.id} seller={seller} />
          ))}
        </div>
      </section>

      {/* Trust Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="blob blob-accent w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
        </div>
        <div className="container mx-auto px-4 py-16">
          <div className="glass rounded-2xl p-8 md:p-12">
            <div className="grid gap-8 md:grid-cols-3 text-center">
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">Pagamento protegido</h3>
                <p className="text-sm text-muted-foreground">Seu pagamento seguro do início ao fim. Valor liberado ao vendedor apenas após a confirmação do recebimento.</p>
              </div>
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
                  <Star className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">Vendedores verificados</h3>
                <p className="text-sm text-muted-foreground">Vendedores verificados contam com histórico comprovado e maior nível de confiança.</p>
              </div>
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">Preços transparentes</h3>
                <p className="text-sm text-muted-foreground">Acompanhe preços com base em vendas reais do mercado.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/[0.04]">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-8">Perguntas frequentes</h2>
          <div className="mx-auto max-w-2xl">
            <Accordion type="single" collapsible>
              {[
                { q: 'Como funciona o pagamento protegido?', a: 'O valor fica retido até que o comprador confirme o recebimento da carta. Assim, garantimos uma negociação segura para ambas as partes.' },
                { q: 'Como sei que o vendedor é confiável?', a: 'Vendedores verificados passam por um processo de validação e têm histórico de vendas público.' },
                { q: 'Posso devolver uma carta?', a: 'Em casos específicos, como divergência ou problema com o item, nossa equipe analisa a situação para garantir uma solução justa.' },
                { q: 'Quais empresas de grading são aceitas?', a: 'Aceitamos cartas graduadas pelas principais grading companies, incluindo PSA, CGC, Beckett, TAG, ARS, AGS, ManaFix, GBA.' },
              ].map(({ q, a }, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-sm font-medium">{q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </>
  );
}
