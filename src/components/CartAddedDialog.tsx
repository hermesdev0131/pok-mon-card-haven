"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

// Global confirmation dialog shown after a successful add-to-cart from any
// surface. Lets the buyer keep shopping (default) or jump to checkout. Mounted
// once at the app root so individual add-to-cart entry points don't have to
// own their own dialog state.
export function CartAddedDialog() {
  const router = useRouter();
  const { recentlyAddedAt, dismissRecentlyAdded, count } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (recentlyAddedAt > 0) setOpen(true);
  }, [recentlyAddedAt]);

  const handleClose = () => {
    setOpen(false);
    dismissRecentlyAdded();
  };

  const goToCart = () => {
    handleClose();
    router.push('/cart');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Carta adicionada ao carrinho
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Você tem {count} {count === 1 ? 'item' : 'itens'} no carrinho. Quer continuar comprando ou ir para o checkout?
        </p>
        {/* Mobile: stack vertically (each full width, no overflow possible
            even on the narrowest phone). Desktop (>=sm): row, 50/50 split.
            `flex-col-reverse` puts the primary action on TOP on mobile while
            keeping it on the RIGHT on desktop — standard dialog pattern. */}
        <div className="flex flex-col-reverse gap-2 mt-2 sm:flex-row">
          <Button variant="outline" className="w-full sm:flex-1" onClick={handleClose}>
            Continuar comprando
          </Button>
          <Button className="w-full sm:flex-1" onClick={goToCart}>
            <ShoppingCart className="h-4 w-4 mr-2" /> Ir para o carrinho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
