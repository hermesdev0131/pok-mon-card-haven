"use client";

import { Button } from '@/components/ui/button';
import { CardBaseCard } from '@/components/CardBaseCard';
import { SellerCard } from '@/components/SellerCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ChevronRight, ArrowRight, ShieldCheck, BadgeCheck, Wallet } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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

function SparklineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,12 5,9 9,11 13,6 17,7 21,3 23,4" />
      <circle cx="23" cy="4" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CardCarousel({ items }: { items: CardBaseWithStats[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const first = el.children[0] as HTMLElement | undefined;
      if (!first) return;
      const stride = first.offsetWidth + 16;
      const index = Math.round(el.scrollLeft / stride);
      setActiveIndex(Math.min(Math.max(index, 0), items.length - 1));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [items.length]);

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const first = el.children[0] as HTMLElement | undefined;
    if (!first) return;
    const stride = first.offsetWidth + 16;
    el.scrollTo({ left: index * stride, behavior: 'smooth' });
  };

  return (
    <>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 md:grid md:gap-5 md:grid-cols-3 md:overflow-visible md:mx-0 md:px-0 md:pb-0 lg:grid-cols-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <div key={item.cardBase.id} className="shrink-0 w-[72%] sm:w-[48%] snap-start md:w-auto md:shrink">
            <CardBaseCard item={item} />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 mt-4 md:hidden">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollToIndex(i)}
            aria-label={`Ir para carta ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'w-6 bg-accent' : 'w-2 bg-foreground/20'
            }`}
          />
        ))}
      </div>
    </>
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

        <div className="container relative mx-auto px-4 min-h-[calc(100vh-7rem)] lg:min-h-0 flex items-center pt-8 pb-8 lg:pt-12 lg:pb-8">
          <div className="grid w-full grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-y-6 lg:gap-y-8 lg:gap-x-12 items-start">
            {/* Pill + Headline (mobile order 1, desktop top-left) */}
            <div className="space-y-6 lg:space-y-8 order-1 lg:col-start-1 lg:row-start-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                1º marketplace brasileiro dedicado a cartas graduadas
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl leading-[1.05]">
                O maior marketplace de{' '}
                <span className="text-accent text-glow-accent">cartas graduadas</span>{' '}
                do Brasil.
              </h1>
            </div>

            {/* Slab collage (mobile order 2, desktop right spanning both rows) */}
            <div className="relative order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:pt-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-[280px] w-[280px] sm:h-[360px] sm:w-[360px] rounded-full bg-accent/10 blur-[100px]" />
              </div>
              <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[3/2] w-full max-w-md lg:max-w-none mx-auto">
                {/* Left card */}
                <div className="absolute left-[10%] top-[15%] w-[36%] -rotate-[10deg] drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                  <Image
                    src="/hero-1.png"
                    alt="Carta graduada"
                    width={734}
                    height={1024}
                    priority
                    quality={95}
                    className="w-full h-auto"
                  />
                </div>
                {/* Center card (prominent) */}
                <div className="absolute left-1/2 top-0 w-[42%] -translate-x-1/2 rotate-[3deg] z-10 drop-shadow-[0_24px_50px_rgba(0,0,0,0.6)]">
                  <Image
                    src="/hero-2.png"
                    alt="Carta graduada"
                    width={734}
                    height={1024}
                    priority
                    quality={95}
                    className="w-full h-auto"
                  />
                </div>
                {/* Right card */}
                <div className="absolute right-[10%] top-[15%] w-[36%] rotate-[10deg] drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                  <Image
                    src="/hero-3.png"
                    alt="Carta graduada"
                    width={600}
                    height={825}
                    priority
                    quality={95}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>

            {/* Subtitle + Buttons (mobile order 3, desktop bottom-left) */}
            <div className="space-y-6 lg:space-y-8 order-3 lg:col-start-1 lg:row-start-2">
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
          </div>
        </div>
      </section>

      {/* Cartas Graduadas Disponíveis */}
      <section className="container mx-auto px-4 py-8 lg:pt-6 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">Cartas Graduadas Disponíveis</h2>
          </div>
          <Button variant="ghost" className="text-accent hover:text-accent/80 gap-1 self-start sm:self-auto" asChild>
            <Link href="/marketplace">Ver todas <ChevronRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        {loading ? (
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 md:grid md:gap-5 md:grid-cols-3 md:overflow-visible md:mx-0 md:px-0 md:pb-0 lg:grid-cols-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="shrink-0 w-[72%] sm:w-[48%] snap-start aspect-[4/5] rounded-2xl bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer md:w-auto md:shrink md:snap-align-none" />
            ))}
          </div>
        ) : (
          <CardCarousel items={highlightCards} />
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
                  <p className="text-[11px] text-muted-foreground mt-1">Vendido por</p>
                  <p className="text-xs font-semibold truncate">{sale.sellerName}</p>
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
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 md:grid md:gap-5 md:grid-cols-3 md:overflow-visible md:mx-0 md:px-0 md:pb-0 lg:grid-cols-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="shrink-0 w-[72%] sm:w-[48%] snap-start aspect-[4/5] rounded-2xl bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer md:w-auto md:shrink md:snap-align-none" />
            ))}
          </div>
        ) : (
          <CardCarousel items={recentCards} />
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
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
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
