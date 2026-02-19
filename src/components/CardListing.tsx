import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { GradeBadge } from './GradeBadge';
import { VerifiedBadge } from './VerifiedBadge';
import { Badge } from '@/components/ui/badge';
import { Truck } from 'lucide-react';
import type { Card as CardType } from '@/types';
import { sellers } from '@/data/mock';

interface CardListingProps {
  card: CardType;
}

export function CardListing({ card }: CardListingProps) {
  const seller = sellers.find(s => s.id === card.sellerId);

  return (
    <Link href={`/card/${card.id}`}>
      <Card className="group overflow-hidden border-border/50 transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5">
        <div className="aspect-[3/4] bg-secondary flex items-center justify-center overflow-hidden">
          <div className="text-6xl opacity-30 group-hover:scale-110 transition-transform duration-300">🃏</div>
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">{card.name}</h3>
            <GradeBadge grade={card.grade} company={card.gradeCompany} />
          </div>
          <p className="text-xs text-muted-foreground">{card.set} · #{card.number}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="font-bold text-lg">
              R$ {card.price.toLocaleString('pt-BR')}
            </span>
            {card.freeShipping && (
              <Badge variant="outline" className="text-success border-success/30 gap-1 text-[10px]">
                <Truck className="h-3 w-3" /> Frete grátis
              </Badge>
            )}
          </div>
          {seller && (
            <div className="flex items-center gap-2 pt-1 border-t border-border/50">
              <span className="text-xs text-muted-foreground truncate">{seller.name}</span>
              {seller.verified && <VerifiedBadge />}
              <span className="text-xs text-muted-foreground ml-auto">⭐ {seller.rating}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
