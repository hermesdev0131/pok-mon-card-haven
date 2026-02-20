"use client";

import { CardListing } from '@/components/CardListing';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getSeller, getSellerCards, getSellerReviews } from '@/lib/api';
import { Star, ShoppingBag, Calendar } from 'lucide-react';
import type { Card as CardType, Seller, Review } from '@/types';

export default function SellerProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [seller, setSeller] = useState<Seller | null>(null);
  const [cards, setCards] = useState<CardType[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getSeller(id), getSellerCards(id), getSellerReviews(id)]).then(([s, c, r]) => {
      setSeller(s);
      setCards(c);
      setReviews(r);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="container mx-auto px-4 py-12"><div className="animate-pulse h-40 rounded-lg bg-secondary" /></div>;
  if (!seller) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Vendedor não encontrado.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-secondary border border-white/[0.06] flex items-center justify-center text-2xl font-bold text-muted-foreground">
          {seller.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{seller.name}</h1>
            {seller.verified && <VerifiedBadge />}
            {seller.isNew && <Badge variant="secondary" className="text-xs">Novo</Badge>}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-gold" />{seller.rating}</span>
            <span className="flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" />{seller.totalSales} vendas</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Desde {new Date(seller.joinedAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Cards */}
      <h2 className="text-lg font-semibold mb-4">Anúncios ({cards.length})</h2>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-12">
        {cards.map(c => <CardListing key={c.id} card={c} />)}
      </div>

      {/* Reviews */}
      <h2 className="text-lg font-semibold mb-4">Avaliações ({reviews.length})</h2>
      <div className="space-y-3">
        {reviews.map(r => (
          <Card key={r.id} className="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">{r.buyerName}</span>
                <div className="flex gap-0.5">{Array(r.rating).fill(0).map((_, i) => <Star key={i} className="h-3 w-3 fill-gold text-gold" />)}</div>
                <span className="text-xs text-muted-foreground ml-auto">{new Date(r.date).toLocaleDateString('pt-BR')}</span>
              </div>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
