import Link from 'next/link';
import { GradeBadge } from './GradeBadge';
import { VerifiedBadge } from './VerifiedBadge';
import { Truck, ShoppingCart } from 'lucide-react';
import type { Card as CardType } from '@/types';
import { sellers } from '@/data/mock';

interface CardListingProps {
  card: CardType;
}

export function CardListing({ card }: CardListingProps) {
  const seller = sellers.find(s => s.id === card.sellerId);

  return (
    <Link href={`/card/${card.id}`} className="group block">
      <div className="overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] transition-all duration-300 hover:border-accent/30 hover:shadow-[0_4px_40px_hsl(var(--accent)/0.1)] hover:-translate-y-1">
        {/* Image area with overlay badges */}
        <div className="relative aspect-square bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center overflow-hidden">
          <div className="text-7xl opacity-30 group-hover:scale-110 transition-transform duration-500">🃏</div>

          {/* Grade badge — top-left overlay */}
          <div className="absolute top-3 left-3">
            <GradeBadge grade={card.grade} company={card.gradeCompany} />
          </div>

          {/* Free shipping — top-right overlay */}
          {card.freeShipping && (
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-accent/90 text-accent-foreground px-2.5 py-1 text-[10px] font-semibold">
              <Truck className="h-3 w-3" /> Frete grátis
            </div>
          )}

          {/* Quick action on hover */}
          <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground py-2.5 text-sm font-semibold shadow-lg shadow-accent/20">
              <ShoppingCart className="h-4 w-4" />
              Ver detalhes
            </div>
          </div>
        </div>

        {/* Product info */}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-1">{card.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{card.set}</p>

          {/* Price */}
          <p className="text-lg font-bold text-accent">
            R$ {card.price.toLocaleString('pt-BR')}
          </p>

          {/* Seller */}
          {seller && (
            <div className="flex items-center gap-1.5 pt-1">
              <div className="h-5 w-5 rounded-full bg-secondary border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                {seller.name.charAt(0)}
              </div>
              <span className="text-xs text-muted-foreground truncate">{seller.name}</span>
              {seller.verified && <VerifiedBadge />}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
