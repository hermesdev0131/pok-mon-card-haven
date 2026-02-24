"use client";

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GradeBadge } from './GradeBadge';
import { VerifiedBadge } from './VerifiedBadge';
import { ListingPhotoModal } from './ListingPhotoModal';
import { QnA } from './QnA';
import { Button } from '@/components/ui/button';
import { FlagIcon } from './FlagIcon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Truck, ShoppingCart, Image as ImageIcon, Star, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { getQuestionsForListing } from '@/lib/api';
import type { Listing, Seller, Question } from '@/types';

interface ListingTableProps {
  listings: Listing[];
  sellers: Record<string, Seller>;
}

export function ListingTable({ listings, sellers }: ListingTableProps) {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [qnaListing, setQnaListing] = useState<Listing | null>(null);
  const [qnaQuestions, setQnaQuestions] = useState<Question[]>([]);

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
      <div className="overflow-x-auto">
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
            {listings.map((listing) => {
              const seller = sellers[listing.sellerId];
              return (
                <TableRow key={listing.id} className="group/row hover:bg-white/[0.02]">
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
                          </span>
                        )}
                        {listing.freeShipping && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-accent mt-2">
                            <Truck className="h-2.5 w-2.5" /> Frete grátis
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Grade */}
                  <TableCell>
                    <GradeBadge grade={listing.grade} company={listing.gradeCompany} />
                  </TableCell>

                  {/* Language */}
                  <TableCell>
                    <FlagIcon code={listing.language} />
                  </TableCell>

                  {/* Price */}
                  <TableCell className="text-right">
                    <span className="font-bold text-accent">
                      R$ {listing.price.toLocaleString('pt-BR')}
                    </span>
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
                        className="h-8 w-8 bg-accent text-accent-foreground hover:bg-accent/90"
                        asChild
                        title="Comprar"
                      >
                        <Link href={`/checkout/o-new`}>
                          <ShoppingCart className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Photo modal */}
      <ListingPhotoModal
        listing={selectedListing}
        seller={selectedListing ? sellers[selectedListing.sellerId] : undefined}
        open={!!selectedListing}
        onClose={() => setSelectedListing(null)}
      />

      {/* Q&A modal */}
      <Dialog open={!!qnaListing} onOpenChange={(open) => !open && setQnaListing(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              Perguntas — {qnaListing && sellers[qnaListing.sellerId]?.name}
            </DialogTitle>
          </DialogHeader>
          <QnA questions={qnaQuestions} />
        </DialogContent>
      </Dialog>
    </>
  );
}
