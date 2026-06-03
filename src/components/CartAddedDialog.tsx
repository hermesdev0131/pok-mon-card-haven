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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Carta adicionada ao carrinho
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Você tem {count} {count === 1 ? 'item' : 'itens'} no carrinho. Quer continuar comprando ou ir para o checkout?
        </p>
        {/* Plain flex row so each button gets equal width via flex-1.
            Shadcn's DialogFooter has `sm:justify-end` baked in, which makes
            buttons keep their natural width and overflow when labels are long. */}
        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Continuar comprando
          </Button>
          <Button className="flex-1" onClick={goToCart}>
            <ShoppingCart className="h-4 w-4 mr-2" /> Ir para o carrinho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
