"use client";

import { Button } from '@/components/ui/button';
import { CardBaseCard } from '@/components/CardBaseCard';
import { SellerCard } from '@/components/SellerCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, ArrowRight, Flame, Zap, Ghost, Moon, Star, Sparkles, ChevronRight } from 'lucide-react';
import { cardBases, listings, sellers } from '@/data/mock';
import type { CardBaseWithStats } from '@/types';

// Build card base stats from mock data
function buildStats(): CardBaseWithStats[] {
  return cardBases.map(cb => {
    const activeListings = listings.filter(l => l.cardBaseId === cb.id && l.status === 'active');
    const prices = activeListings.map(l => l.price);
    return {
      cardBase: cb,
      listingCount: activeListings.length,
      lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
      highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
    };
  }).filter(s => s.listingCount > 0);
}

const allStats = buildStats();
const featuredCard = allStats.find(s => s.cardBase.id === 'cb4')!; // Umbreon VMAX
const highlightCards = allStats.slice(0, 5);
const recentCards = [...allStats].slice(0, 5);
const topSellers = sellers.filter(s => s.verified).sort((a, b) => b.totalSales - a.totalSales);

const categories = [
  { name: 'Fire', label: 'Fogo', icon: Flame, color: 'from-orange-500/20 to-red-600/10 border-orange-500/20', iconColor: 'text-orange-400', count: cardBases.filter(c => c.type === 'fire').length },
  { name: 'Electric', label: 'Elétrico', icon: Zap, color: 'from-yellow-500/20 to-amber-600/10 border-yellow-500/20', iconColor: 'text-yellow-400', count: cardBases.filter(c => c.type === 'electric').length },
  { name: 'Psychic', label: 'Psíquico', icon: Sparkles, color: 'from-pink-500/20 to-purple-600/10 border-pink-500/20', iconColor: 'text-pink-400', count: cardBases.filter(c => c.type === 'psychic').length },
  { name: 'Dark', label: 'Sombrio', icon: Moon, color: 'from-purple-500/20 to-indigo-600/10 border-purple-500/20', iconColor: 'text-purple-400', count: cardBases.filter(c => c.type === 'dark').length },
  { name: 'Ghost', label: 'Fantasma', icon: Ghost, color: 'from-indigo-500/20 to-violet-600/10 border-indigo-500/20', iconColor: 'text-indigo-400', count: cardBases.filter(c => c.type === 'ghost').length },
  { name: 'Dragon', label: 'Dragão', icon: Flame, color: 'from-cyan-500/20 to-blue-600/10 border-cyan-500/20', iconColor: 'text-cyan-400', count: cardBases.filter(c => c.type === 'dragon').length },
];

export default function Home() {
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
                Marketplace #1 de cartas graduadas
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl leading-[1.1]">
                Encontre cartas{' '}
                <span className="text-accent text-glow-accent">raras e exclusivas</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                PSA, CGC, Beckett, TAG e mais — todas as grading companies. Preços transparentes, vendedores verificados e pagamento protegido.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row pt-2">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 glow-accent" asChild>
                  <Link href="/marketplace">Explorar marketplace <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
              <Link href={`/card/${featuredCard.cardBase.id}`} className="relative group">
                <div className="glass glow-accent rounded-2xl p-6 space-y-4 transition-all duration-300 group-hover:shadow-[0_0_40px_hsl(var(--accent)/0.15)] group-hover:scale-[1.02]">
                  <div className="relative aspect-[3/4] w-56 mx-auto bg-gradient-to-b from-secondary to-background rounded-xl flex items-center justify-center overflow-hidden">
                    {featuredCard.cardBase.imageUrl ? (
                      <Image
                        src={featuredCard.cardBase.imageUrl}
                        alt={featuredCard.cardBase.name}
                        fill
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
                      a partir de R$ {featuredCard.lowestPrice.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Link>
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
            <Link href="/marketplace">Ver todas <ChevronRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {highlightCards.map(item => (
            <CardBaseCard key={item.cardBase.id} item={item} />
          ))}
        </div>
      </section>

      {/* Browse by Category */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Explorar por tipo</h2>
            <p className="text-sm text-muted-foreground mt-1">Encontre cartas do seu tipo favorito</p>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map(({ label, icon: Icon, color, iconColor, count }) => (
            <Link key={label} href="/marketplace">
              <div className={`overflow-hidden rounded-2xl bg-gradient-to-br ${color} border border-white/[0.06] hover:scale-[1.03] transition-all duration-300 cursor-pointer p-5 text-center space-y-2`}>
                <Icon className={`h-8 w-8 mx-auto ${iconColor}`} />
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{count} {count === 1 ? 'carta' : 'cartas'}</p>
              </div>
            </Link>
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
            <Link href="/marketplace">Ver todas <ChevronRight className="h-4 w-4" /></Link>
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
                <p className="text-sm text-muted-foreground">Valor retido até a confirmação do recebimento</p>
              </div>
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
                  <Star className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">Vendedores verificados</h3>
                <p className="text-sm text-muted-foreground">Todos passam por processo de validação</p>
              </div>
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">Preços transparentes</h3>
                <p className="text-sm text-muted-foreground">Histórico real de vendas e gráficos de preço</p>
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
                { q: 'Como funciona o pagamento protegido?', a: 'O valor fica retido até o comprador confirmar o recebimento da carta em bom estado.' },
                { q: 'Como sei que o vendedor é confiável?', a: 'Vendedores verificados passam por um processo de validação e têm histórico de vendas público.' },
                { q: 'Posso devolver uma carta?', a: 'Sim, se a carta não corresponder ao anúncio, você pode abrir uma disputa e solicitar reembolso.' },
                { q: 'Quais empresas de grading são aceitas?', a: 'Aceitamos cartas graduadas por PSA, CGC, Beckett, TAG, ARS, Mana Fix, BGA, Capy e Taverna.' },
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
