"use client";

import { GradeBadge } from '@/components/GradeBadge';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getSeller, getSellerListings, getSellerReviews, replyToReview } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, ShoppingBag, Calendar, Truck, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/Pagination';
import type { CardBase, Listing, Seller, Review } from '@/types';

export default function SellerProfilePageGuarded() {
  return (
    <RequireAuth>
      <SellerProfilePage />
    </RequireAuth>
  );
}

function SellerProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user, tokenRefreshCount } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [sellerListings, setSellerListings] = useState<(Listing & { cardBase: CardBase })[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const { page, setPage, totalPages, paged: pagedListings, total, pageSize, setPageSize } = usePagination(sellerListings, 10);

  const isOwnProfile = user?.id === id;

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim() || replySubmitting) return;
    setReplySubmitting(true);
    const result = await replyToReview(reviewId, replyText.trim());
    setReplySubmitting(false);
    if (result.success) {
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, sellerReply: replyText.trim(), repliedAt: new Date().toISOString() } : r));
      setReplyingId(null);
      setReplyText('');
    }
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([getSeller(id), getSellerListings(id), getSellerReviews(id)]).then(([s, l, r]) => {
      setSeller(s);
      setSellerListings(l);
      setReviews(r);
      setLoading(false);
    });
  }, [id, tokenRefreshCount]);

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

      {/* Listings */}
      <h2 className="text-lg font-semibold mb-4">Anúncios ({sellerListings.length})</h2>
      <div className="space-y-3 mb-4">
        {pagedListings.map(listing => {
          const { cardBase } = listing;
          return (
            <Link
              key={listing.id}
              href={`/card/${cardBase.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-accent/30 hover:bg-white/[0.05] transition-all duration-200"
            >
              <div className="h-14 w-10 rounded-lg bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center shrink-0">
                <span className="text-xl opacity-40">🃏</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{cardBase.name}</p>
                <p className="text-xs text-muted-foreground">{cardBase.set} · #{cardBase.number}</p>
              </div>
              <div className="shrink-0">
                <GradeBadge grade={listing.grade} company={listing.gradeCompany} pristine={listing.pristine} />
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-accent">R$ {formatPrice(listing.price)}</p>
                {listing.freeShipping && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-accent">
                    <Truck className="h-2.5 w-2.5" /> Frete grátis
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        {sellerListings.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum anúncio ativo.</p>
        )}
      </div>
      <div className="mb-8">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} onPageSizeChange={setPageSize} />
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

              {/* Seller reply */}
              {r.sellerReply ? (
                <div className="ml-4 pl-3 border-l-2 border-accent/40 mt-3">
                  <span className="text-xs font-medium text-accent">{seller.name}</span>
                  {r.repliedAt && (
                    <span className="text-xs text-muted-foreground ml-2">{new Date(r.repliedAt).toLocaleDateString('pt-BR')}</span>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">{r.sellerReply}</p>
                </div>
              ) : isOwnProfile && (
                <div className="ml-4 pl-3 border-l-2 border-accent/20 mt-3">
                  {replyingId === r.id ? (
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Sua resposta..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="min-h-[50px] resize-none text-sm"
                      />
                      <div className="flex flex-col gap-1 self-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => { setReplyingId(null); setReplyText(''); }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className="text-xs"
                          disabled={!replyText.trim() || replySubmitting}
                          onClick={() => handleReply(r.id)}
                        >
                          {replySubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Responder'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-accent"
                      onClick={() => { setReplyingId(r.id); setReplyText(''); }}
                    >
                      Responder
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
