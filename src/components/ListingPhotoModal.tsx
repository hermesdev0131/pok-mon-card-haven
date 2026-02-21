"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GradeBadge } from './GradeBadge';
import { VerifiedBadge } from './VerifiedBadge';
import type { Listing, Seller } from '@/types';

interface ListingPhotoModalProps {
  listing: Listing | null;
  seller?: Seller;
  open: boolean;
  onClose: () => void;
}

export function ListingPhotoModal({ listing, seller, open, onClose }: ListingPhotoModalProps) {
  if (!listing) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Fotos do vendedor
          </DialogTitle>
          {seller && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Vendido por:</span>
              <span className="font-medium text-foreground">{seller.name}</span>
              {seller.verified && <VerifiedBadge />}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-3">
          {/* Seller photo area */}
          {listing.images.length > 0 ? (
            <div className="grid gap-2">
              {listing.images.map((img, i) => (
                <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
                  <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-[3/4] rounded-lg bg-gradient-to-b from-secondary to-background flex flex-col items-center justify-center border border-white/[0.06]">
              <div className="text-6xl opacity-30 mb-3">📷</div>
              <p className="text-sm text-muted-foreground">Vendedor ainda não enviou fotos</p>
            </div>
          )}

          {/* Listing details */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <GradeBadge grade={listing.grade} company={listing.gradeCompany} />
            <span className="font-bold text-accent text-lg">
              R$ {listing.price.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
