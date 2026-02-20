import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from './VerifiedBadge';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingBag } from 'lucide-react';
import type { Seller } from '@/types';

export function SellerCard({ seller }: { seller: Seller }) {
  return (
    <Card className="glass">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary border border-white/[0.06] flex items-center justify-center text-lg font-bold text-muted-foreground">
            {seller.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">{seller.name}</span>
              {seller.isNew && <Badge variant="secondary" className="text-[10px]">Novo</Badge>}
            </div>
            {seller.verified && <VerifiedBadge />}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="h-3 w-3 text-gold" />{seller.rating}</span>
          <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{seller.totalSales} vendas</span>
        </div>
        <Button variant="outline" size="sm" className="w-full border-accent/20 text-accent hover:bg-accent/10" asChild>
          <Link href={`/seller/${seller.id}`}>Ver perfil</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
