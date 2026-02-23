"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GradeBadge } from './GradeBadge';
import { VerifiedBadge } from './VerifiedBadge';
import { Camera } from 'lucide-react';
import type { Listing, Seller } from '@/types';

const IMAGE_LABELS = ['Frente', 'Verso', 'Label', 'Case'] as const;

interface ListingPhotoModalProps {
  listing: Listing | null;
  seller?: Seller;
  open: boolean;
  onClose: () => void;
}

export function ListingPhotoModal({ listing, seller, open, onClose }: ListingPhotoModalProps) {
  const [selected, setSelected] = useState(0);

  if (!listing) return null;

  const hasImages = listing.images.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setSelected(0); } }}>
      <DialogContent className="glass sm:max-w-md max-h-[90vh] overflow-y-auto">
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
          {hasImages ? (
            <>
              {/* Main image */}
              <div className="max-h-[50vh] rounded-lg overflow-hidden bg-gradient-to-b from-secondary to-background border border-white/[0.06] flex items-center justify-center">
                <img
                  src={listing.images[selected]}
                  alt={IMAGE_LABELS[selected] || `Foto ${selected + 1}`}
                  className="max-h-[50vh] w-auto object-contain"
                />
              </div>

              {/* Thumbnails */}
              {listing.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {listing.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className={`relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary border-2 transition-all duration-150 ${
                        selected === i
                          ? 'border-accent shadow-[0_0_10px_hsl(var(--accent)/0.2)]'
                          : 'border-white/[0.06] hover:border-white/[0.15]'
                      }`}
                    >
                      <img src={img} alt={IMAGE_LABELS[i] || `Foto ${i + 1}`} className="w-full h-full object-contain" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-center py-0.5 font-medium">
                        {IMAGE_LABELS[i] || `Foto ${i + 1}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Single image label */}
              {listing.images.length === 1 && (
                <p className="text-xs text-muted-foreground text-center">{IMAGE_LABELS[0]}</p>
              )}
            </>
          ) : (
            <div className="h-[40vh] rounded-lg bg-gradient-to-b from-secondary to-background flex flex-col items-center justify-center border border-white/[0.06]">
              <Camera className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Vendedor ainda não enviou fotos</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Frente · Verso · Label · Case</p>
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
