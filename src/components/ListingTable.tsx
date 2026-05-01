"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GradeBadge } from './GradeBadge';
import { VerifiedBadge } from './VerifiedBadge';
import { ListingPhotoModal } from './ListingPhotoModal';
import { QnA } from './QnA';
import { Button } from '@/components/ui/button';
import { FlagIcon } from './FlagIcon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Truck, ShoppingCart, Image as ImageIcon, Star, MessageCircle, Loader2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getQuestionsForListing, createOrder } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from './Pagination';
import type { Listing, Seller, Question } from '@/types';

interface ListingTableProps {
  listings: Listing[];
  sellers: Record<string, Seller>;
}

export function ListingTable({ listings, sellers }: ListingTableProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [qnaListing, setQnaListing] = useState<Listing | null>(null);
  const [qnaQuestions, setQnaQuestions] = useState<Question[]>([]);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const { page, setPage, totalPages, paged, total, pageSize, setPageSize } = usePagination(listings, 10);

  const handleBuy = async (listing: Listing) => {
    if (!user) { router.push('/login'); return; }
    setBuyingId(listing.id);
    setBuyError(null);
    const result = await createOrder(listing.id);
    setBuyingId(null);
    if (!result.success) { setBuyError(result.error); return; }
    router.push(`/checkout/${result.orderId}`);
  };

  useEffect(() => {
    if (qnaListing) {
      getQuestionsForListing(qnaListing.id).then(setQnaQuestions);
    } else {
      setQnaQuestions([]);
    }
  }, [qnaListing]);

  if (!listings.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingCart className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-muted-foreground text-sm">Nenhum anúncio disponível para esta carta.</p>
      </div>
    );
  }

  return (
    <>
      {buyError && (
        <div className="flex items-center justify-between gap-2 mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <span>{buyError}</span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-destructive/10" onClick={() => setBuyError(null)}>✕</Button>
        </div>
      )}
      {/* Desktop: table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendedor</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Idioma</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-center w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((listing) => {
              const seller = sellers[listing.sellerId];
              const isAvailable = listing.status === 'active';
              return (
                <TableRow key={listing.id} className={`group/row hover:bg-white/[0.02] ${!isAvailable ? 'opacity-50' : ''}`}>
                  {/* Seller */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-secondary border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                        {seller?.name.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/seller/${listing.sellerId}`}
                            className="text-sm font-medium hover:text-accent transition-colors truncate"
                          >
                            {seller?.name || 'Vendedor'}
                          </Link>
                          {seller?.verified && <VerifiedBadge />}
                        </div>
                        {seller && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-gold text-gold" /> {seller.rating}
                            <span className="text-muted-foreground/40">·</span>
                            {seller.totalSales} vendas
                            {listing.freeShipping && (
                              <>
                                <span className="text-muted-foreground/40 ml-1">·</span>
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-accent ml-1">
                                  <Truck className="h-2.5 w-2.5" /> Frete grátis
                                </span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Grade */}
                  <TableCell>
                    <GradeBadge grade={listing.grade} company={listing.gradeCompany} pristine={listing.pristine} />
                  </TableCell>

                  {/* Language */}
                  <TableCell>
                    <FlagIcon code={listing.language} />
                  </TableCell>

                  {/* Price */}
                  <TableCell className="text-right">
                    <span className={`font-bold ${isAvailable ? 'text-accent' : 'text-muted-foreground'}`}>
                      R$ {formatPrice(listing.price)}
                    </span>
                    {!isAvailable && (
                      <Badge variant="outline" className="ml-2 text-[10px] border-amber-500/30 text-amber-400">
                        Reservado
                      </Badge>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedListing(listing)}
                        title="Ver fotos"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setQnaListing(listing)}
                        title="Perguntar ao vendedor"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        className={`h-8 w-8 ${isAvailable ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                        title={isAvailable ? 'Comprar' : 'Indisponível'}
                        disabled={!isAvailable || buyingId === listing.id}
                        onClick={() => isAvailable && handleBuy(listing)}
                      >
                        {buyingId === listing.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : isAvailable
                            ? <ShoppingCart className="h-4 w-4" />
                            : <Lock className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: card-based layout */}
      <div className="lg:hidden space-y-3">
        {paged.map((listing) => {
          const seller = sellers[listing.sellerId];
          const isAvailable = listing.status === 'active';
          return (
            <div
              key={listing.id}
              className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-accent/30 ${!isAvailable ? 'opacity-60' : ''}`}
            >
              {/* Seller row + Grade/Flag */}
              <div className="flex items-start gap-3 mb-4">
                <div className="h-9 w-9 rounded-full bg-secondary border border-white/[0.06] flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                  {seller?.name.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/seller/${listing.sellerId}`}
                      className="text-sm font-semibold hover:text-accent transition-colors truncate"
                    >
                      {seller?.name || 'Vendedor'}
                    </Link>
                    {seller?.verified && <VerifiedBadge />}
                  </div>
                  {seller && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      <span>{seller.rating}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{seller.totalSales} vendas</span>
                      {listing.freeShipping && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="inline-flex items-center gap-0.5 text-accent">
                            <Truck className="h-3 w-3" /> Frete grátis
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <GradeBadge grade={listing.grade} company={listing.gradeCompany} pristine={listing.pristine} />
                  <FlagIcon code={listing.language} />
                </div>
              </div>

              {/* Price (full width, prominent) */}
              <div className="flex items-baseline justify-between gap-2 mb-4">
                <span className={`text-2xl font-bold ${isAvailable ? 'text-accent' : 'text-muted-foreground'}`}>
                  R$ {formatPrice(listing.price)}
                </span>
                {!isAvailable && (
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                    Reservado
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 flex-1 border-white/10 hover:border-accent/30 hover:bg-accent/5"
                  onClick={() => setSelectedListing(listing)}
                >
                  <ImageIcon className="h-3.5 w-3.5" /> Fotos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 flex-1 border-white/10 hover:border-accent/30 hover:bg-accent/5"
                  onClick={() => setQnaListing(listing)}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Mensagem
                </Button>
                <Button
                  size="sm"
                  className={`gap-1.5 flex-1 ${isAvailable ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                  disabled={!isAvailable || buyingId === listing.id}
                  onClick={() => isAvailable && handleBuy(listing)}
                >
                  {buyingId === listing.id ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Comprando</>
                  ) : isAvailable ? (
                    <><ShoppingCart className="h-3.5 w-3.5" /> Comprar</>
                  ) : (
                    <><Lock className="h-3.5 w-3.5" /> Indisponível</>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} onPageSizeChange={setPageSize} />

      {/* Photo modal */}
      <ListingPhotoModal
        listing={selectedListing}
        seller={selectedListing ? sellers[selectedListing.sellerId] : undefined}
        open={!!selectedListing}
        onClose={() => setSelectedListing(null)}
      />

      {/* Q&A modal */}
      <Dialog open={!!qnaListing} onOpenChange={(open) => { if (!open) { setQnaListing(null); setQnaQuestions([]); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              Perguntas — {qnaListing && sellers[qnaListing.sellerId]?.name}
            </DialogTitle>
          </DialogHeader>
          {qnaListing && (
            <QnA
              key={qnaListing.id}
              questions={qnaQuestions}
              listingId={qnaListing.id}
              sellerId={qnaListing.sellerId}
              onQuestionSent={() => {
                getQuestionsForListing(qnaListing.id).then(setQnaQuestions);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
