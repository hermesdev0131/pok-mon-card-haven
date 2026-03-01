"use client";

import { GradeBadge } from '@/components/GradeBadge';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { FlagIcon } from '@/components/FlagIcon';
import { TrendingUp, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getRecentSales } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';
import type { SaleRecord, Seller } from '@/types';

type SaleWithCard = SaleRecord & {
  cardBaseId: string;
  cardName: string;
  cardSet: string;
  imageUrl?: string;
  seller?: Seller;
};

export default function UltimasVendasPage() {
  const { tokenRefreshCount } = useAuth();
  const [allSales, setAllSales] = useState<SaleWithCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentSales().then(data => {
      setAllSales(data);
      setLoading(false);
    });
  }, [tokenRefreshCount]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Últimas Vendas</h1>
            <p className="text-sm text-muted-foreground">{allSales.length} vendas confirmadas no marketplace</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {allSales.map((sale, i) => (
            <Link
              key={`${sale.cardBaseId}-${sale.date}-${i}`}
              href={`/card/${sale.cardBaseId}`}
              className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-accent/30 hover:bg-white/[0.05] transition-all duration-200"
            >
              <div className="relative h-14 w-10 rounded-lg bg-gradient-to-br from-white/[0.06] to-white/[0.02] overflow-hidden shrink-0">
                {sale.imageUrl ? (
                  <Image src={sale.imageUrl} alt={sale.cardName} fill className="object-contain p-0.5" sizes="40px" />
                ) : (
                  <span className="flex items-center justify-center h-full text-xl opacity-40">🃏</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{sale.cardName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground truncate">{sale.cardSet}</p>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                    · {sale.sellerName} {sale.seller?.verified && <VerifiedBadge />}
                  </span>
                </div>
                {sale.seller && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Star className="h-3 w-3 fill-gold text-gold" /> {sale.seller.rating}
                    <span className="text-muted-foreground/40">·</span>
                    {sale.seller.totalSales} vendas
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 w-full sm:w-auto pl-14 sm:pl-0">
                <div className="flex items-center gap-2">
                  <FlagIcon code={sale.language} />
                  <GradeBadge grade={sale.grade} company={sale.gradeCompany} pristine={sale.pristine} />
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-accent">R$ {formatPrice(sale.price)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(sale.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
