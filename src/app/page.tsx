"use client";

import { Button } from '@/components/ui/button';
import { CardBaseCard } from '@/components/CardBaseCard';
import { SellerCard } from '@/components/SellerCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ChevronRight, ArrowRight, ShieldCheck, BadgeCheck, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCardBasesWithStats, getAllSellers, getRecentSales } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';
import type { CardBaseWithStats, Seller, SaleRecord } from '@/types';

type SaleWithCard = SaleRecord & {
  cardBaseId: string;
  cardName: string;
  cardSet: string;
  imageUrl?: string;
  seller?: Seller;
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  const months = Math.floor(days / 30);
  return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

function SparklineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,12 5,9 9,11 13,6 17,7 21,3 23,4" />
      <circle cx="23" cy="4" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Home() {
  const { tokenRefreshCount } = useAuth();
  const [allStats, setAllStats] = useState<CardBaseWithStats[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [recentSales, setRecentSales] = useState<SaleWithCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCardBasesWithStats(), getAllSellers(), getRecentSales()]).then(([stats, s, sales]) => {
      setAllStats(stats);
      setSellers(s);
      setRecentSales(sales.slice(0, 4));
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [tokenRefreshCount]);

  const highlightCards = allStats.slice(0, 5);
  const recentCards = [...allStats].slice(0, 5);
  const topSellers = sellers.filter(s => s.verified).sort((a, b) => b.totalSales - a.totalSales);

  return (
    <>
      {/* Hero — premium boutique feel, immersive on mobile, side-by-side on desktop */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="blob blob-accent w-[900px] h-[900px] -top-[400px] left-1/2 -translate-x-1/2 opacity-15 animate-float" />
          <div className="blob blob-purple w-[500px] h-[500px] bottom-0 -left-[200px] opacity-60 animate-float-slow" />
        </div>

        <div className="container relative mx-auto px-4 min-h-[calc(100vh-7rem)] lg:min-h-0 flex items-center py-8 lg:py-16">
          <div className="grid w-full gap-8 lg:gap-12 lg:grid-cols-[1.1fr_1fr] items-center">
            {/* Left — Text */}
            <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl leading-[1.05]">
                O maior marketplace de{' '}
                <span className="text-accent text-glow-accent">cartas graduadas</span>{' '}
                do Brasil.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg">
                Compre e venda com segurança, transparência e as melhores condições do mercado.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row pt-2">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 glow-accent" asChild>
                  <Link href="/marketplace">Ver cartas disponíveis <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button variant="outline" size="lg" className="border-white/10 hover:border-accent/30 hover:bg-accent/5" asChild>
                  <Link href="/como-funciona">Como funciona</Link>
                </Button>
              </div>
            </div>

            {/* Right — Slab collage */}
            <div className="relative order-1 lg:order-2">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-[280px] w-[280px] sm:h-[360px] sm:w-[360px] rounded-full bg-accent/10 blur-[100px]" />
              </div>
              <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[5/4] w-full max-w-md lg:max-w-none mx-auto rounded-2xl overflow-hidden">
                <Image
                  src="/hero-cards.jpg"
                  alt="Cartas Pokémon graduadas"
                  fill
                  priority
                  quality={95}
                  sizes="(max-width: 1024px) 90vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cartas Graduadas Disponíveis */}
      <section className="container mx-auto px-4 py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Cartas Graduadas Disponíveis</h2>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs text-accent">
              <Sparkles className="h-3 w-3" />
              1º marketplace brasileiro dedicado a cartas graduadas
            </div>
          </div>
          <Button variant="ghost" className="text-accent hover:text-accent/80 gap-1 self-start sm:self-auto" asChild>
            <Link href="/marketplace">Ver todas <ChevronRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        {loading ? (
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {highlightCards.map(item => (
              <CardBaseCard key={item.cardBase.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Trust badges */}
      <section className="container mx-auto px-4 py-8 lg:py-10">
        <div className="glass rounded-2xl px-6 py-6 lg:px-8 lg:py-7">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
                <ShieldCheck className="h-5 w-5 text-accent" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Pagamento protegido</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Seu pagamento seguro do início ao fim. Valor liberado ao vendedor apenas após a confirmação do recebimento.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
                <BadgeCheck className="h-5 w-5 text-accent" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Vendedores verificados</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Vendedores verificados contam com histórico comprovado e maior nível de confiança.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
                <Wallet className="h-5 w-5 text-accent" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Preços transparentes</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Acompanhe preços com base em vendas reais do mercado.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
                <SparklineIcon className="h-5 w-5 text-accent" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Histórico e gráfico de preços real</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Acompanhe a evolução real dos preços com base em vendas confirmadas no marketplace.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Últimas Vendas */}
      <section className="container mx-auto px-4 py-12 lg:py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Últimas Vendas</h2>
            <p className="text-sm text-muted-foreground mt-1">Vendas confirmadas no marketplace</p>
          </div>
          <Button variant="ghost" className="text-accent hover:text-accent/80 gap-1" asChild>
            <Link href="/marketplace/ultimas-vendas">Ver todas <ChevronRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        {loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
            ))}
          </div>
        ) : recentSales.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma venda registrada ainda.</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {recentSales.map((sale, i) => (
              <Link
                key={`${sale.cardBaseId}-${sale.date}-${i}`}
                href={`/card/${sale.cardBaseId}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-accent/30 hover:bg-white/[0.05] transition-all duration-200"
              >
                <div className="relative h-16 w-12 rounded-lg bg-gradient-to-br from-white/[0.06] to-white/[0.02] overflow-hidden shrink-0">
                  {sale.imageUrl ? (
                    <Image src={sale.imageUrl} alt={sale.cardName} fill className="object-contain p-0.5" sizes="48px" />
                  ) : (
                    <span className="flex items-center justify-center h-full text-2xl opacity-40">🃏</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{sale.cardName}</p>
                  <p className="text-base font-bold text-accent mt-0.5">R$ {formatPrice(sale.price)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    Vendido por <span className="text-foreground/80">{sale.sellerName}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">{timeAgo(sale.date)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Adicionadas recentemente */}
      <section className="container mx-auto px-4 py-12 lg:py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Adicionadas recentemente</h2>
            <p className="text-sm text-muted-foreground mt-1">As últimas cartas com anúncios no marketplace</p>
          </div>
          <Button variant="ghost" className="text-accent hover:text-accent/80 gap-1" asChild>
            <Link href="/marketplace/ultimos-anuncios">Ver todas <ChevronRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        {loading ? (
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {recentCards.map(item => (
              <CardBaseCard key={item.cardBase.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Vendedores verificados */}
      <section className="container mx-auto px-4 py-12 lg:py-16">
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
