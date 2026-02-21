"use client";

import { SellerCard } from '@/components/SellerCard';
import { sellers, listings } from '@/data/mock';
import { Users } from 'lucide-react';

const sortedSellers = [...sellers].sort((a, b) => b.totalSales - a.totalSales);

export default function VendedoresPage() {
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

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedSellers.map(seller => {
          const sellerListingCount = listings.filter(l => l.sellerId === seller.id && l.status === 'active').length;
          return (
            <div key={seller.id} className="space-y-3">
              <SellerCard seller={seller} />
              {sellerListingCount > 0 && (
                <p className="text-xs text-muted-foreground px-1">{sellerListingCount} {sellerListingCount === 1 ? 'anúncio ativo' : 'anúncios ativos'}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
