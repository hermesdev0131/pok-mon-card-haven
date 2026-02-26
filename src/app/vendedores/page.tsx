"use client";

import { SellerCard } from '@/components/SellerCard';
import { Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSellersWithListingCount } from '@/lib/api';
import type { Seller } from '@/types';

type SellerWithCount = Seller & { listingCount: number };

export default function VendedoresPage() {
  const [sellers, setSellers] = useState<SellerWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSellersWithListingCount().then(data => {
      setSellers(data.sort((a, b) => b.totalSales - a.totalSales));
      setLoading(false);
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
            <Users className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Vendedores</h1>
            <p className="text-sm text-muted-foreground">{sellers.length} vendedores no marketplace</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-secondary bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sellers.map(seller => (
            <div key={seller.id} className="space-y-3">
              <SellerCard seller={seller} />
              {seller.listingCount > 0 && (
                <p className="text-xs text-muted-foreground px-1">{seller.listingCount} {seller.listingCount === 1 ? 'anúncio ativo' : 'anúncios ativos'}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
