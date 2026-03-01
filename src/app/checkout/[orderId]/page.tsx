'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, MessageCircle, Loader2 } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { StatusPill } from '@/components/StatusPill';
import Link from 'next/link';
import { getOrder } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';

export default function Checkout() {
  const params = useParams<{ orderId: string }>();
  const { tokenRefreshCount } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.orderId) {
      getOrder(params.orderId).then(o => {
        setOrder(o);
        setLoading(false);
      });
    }
  }, [params.orderId, tokenRefreshCount]);

  return (
    <RequireAuth>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Finalizar compra</h1>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && !order && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Pedido não encontrado.</p>
            <Button asChild variant="outline"><Link href="/me">Ver meus pedidos</Link></Button>
          </div>
        )}

        {!loading && order && order.status !== 'aguardando_pagamento' && (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground mb-2">Pedido #{order.id.slice(0, 8)}</p>
            <p className="font-semibold mb-4">{order.cardName}</p>
            <StatusPill status={order.status} />
            <div className="mt-6">
              <Button asChild variant="outline"><Link href="/me">Ver meus pedidos</Link></Button>
            </div>
          </div>
        )}

        {!loading && order && order.status === 'aguardando_pagamento' && (
          <>
            {/* Item summary */}
            <Card className="glass mb-6">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-20 w-16 rounded bg-secondary border border-white/[0.06] flex items-center justify-center text-3xl opacity-30">🃏</div>
                <div className="flex-1">
                  <p className="font-semibold">{order.cardName}</p>
                  <p className="text-sm text-muted-foreground">Vendedor: {order.sellerName}</p>
                </div>
                <p className="text-xl font-bold text-accent">R$ {formatPrice(order.price)}</p>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="glass mb-6">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {formatPrice(order.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="text-muted-foreground">A calcular</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-accent">R$ {formatPrice(order.price)}</span>
                </div>
              </CardContent>
            </Card>

            <Button size="lg" className="w-full mb-4" disabled>
              Pagar com Mercado Pago (em breve)
            </Button>

            {/* Trust signals */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-accent shrink-0" />
                <span>Pagamento retido até confirmação do recebimento</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4 text-accent shrink-0" />
                <span>Suporte via WhatsApp em caso de problemas</span>
              </div>
            </div>
          </>
        )}
      </div>
    </RequireAuth>
  );
}
