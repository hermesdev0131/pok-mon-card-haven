"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { CardBaseCard } from '@/components/CardBaseCard';
import { SellerCard } from '@/components/SellerCard';
import { searchAll } from '@/lib/api';
import type { CardBaseWithStats, Seller } from '@/types';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(queryParam);
  const [cards, setCards] = useState<CardBaseWithStats[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!queryParam.trim()) {
      setCards([]);
      setSellers([]);
      return;
    }
    setLoading(true);
    searchAll(queryParam).then(({ cards, sellers }) => {
      setCards(cards);
      setSellers(sellers);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [queryParam]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  function handleClear() {
    setQuery('');
    router.push('/search');
  }

  const totalResults = cards.length + sellers.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Search bar (refine query) */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cartas, sets, vendedores..."
            className="w-full h-11 rounded-full bg-secondary border border-border pl-11 pr-28 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:bg-background focus:border-accent/40 focus:shadow-[0_0_0_3px_hsl(var(--accent)/0.10)]"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpar busca"
              className="absolute right-20 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 rounded-full bg-accent text-accent-foreground text-sm font-semibold transition-colors hover:bg-accent/90"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Header / status */}
      {!queryParam.trim() ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-base text-muted-foreground">Digite algo para buscar cartas, sets ou vendedores.</p>
        </div>
      ) : loading ? (
        <div className="space-y-6">
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Resultados para &ldquo;{queryParam}&rdquo;</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalResults === 0
                ? 'Nenhum resultado encontrado.'
                : `${cards.length} ${cards.length === 1 ? 'carta' : 'cartas'} · ${sellers.length} ${sellers.length === 1 ? 'vendedor' : 'vendedores'}`}
            </p>
          </div>

          {totalResults === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-base text-muted-foreground">
                Nenhum resultado para &ldquo;{queryParam}&rdquo;.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente outra palavra-chave ou verifique a ortografia.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Cards section */}
              {cards.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">
                    Cartas <span className="text-muted-foreground font-normal text-sm">({cards.length})</span>
                  </h2>
                  <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {cards.map((item) => (
                      <CardBaseCard key={item.cardBase.id} item={item} />
                    ))}
                  </div>
                </section>
              )}

              {/* Sellers section */}
              {sellers.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">
                    Vendedores <span className="text-muted-foreground font-normal text-sm">({sellers.length})</span>
                  </h2>
                  <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                    {sellers.map((seller) => (
                      <SellerCard key={seller.id} seller={seller} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8" />}>
      <SearchPageContent />
    </Suspense>
  );
}
