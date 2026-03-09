'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, MessageCircle, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { StatusPill } from '@/components/StatusPill';
import Link from 'next/link';
import { getOrder, cancelOrder } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';

export default function Checkout() {
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentStatus = searchParams.get('status');
  const { user, tokenRefreshCount } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const verifyAttempts = useRef(0);
  const isBuyer = !!(user && order && user.id === order.buyerId);

  // Fetch order on mount
  useEffect(() => {
    if (params.orderId) {
      getOrder(params.orderId).then(o => {
        setOrder(o);
        setLoading(false);
      });
    }
  }, [params.orderId, tokenRefreshCount]);

  // When returning from MP with ?status=success, verify payment
  useEffect(() => {
    if (!order || !isBuyer || order.status !== 'aguardando_pagamento') return;
    if (paymentStatus !== 'success' && paymentStatus !== 'pending') return;

    setVerifying(true);
    verifyAttempts.current = 0;

    const verify = async () => {
      try {
        const res = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id }),
        });
        const data = await res.json();

        if (data.status && data.status !== 'awaiting_payment') {
          // Status updated — refresh order
          const updated = await getOrder(order.id);
          setOrder(updated);
          setVerifying(false);
          return;
        }

        // Still awaiting — retry up to 6 times (30 seconds total)
        verifyAttempts.current++;
        if (verifyAttempts.current < 6) {
          setTimeout(verify, 5000);
        } else {
          setVerifying(false);
        }
      } catch {
        setVerifying(false);
      }
    };

    verify();
  }, [order?.id, order?.status, isBuyer, paymentStatus]);

  const handlePay = useCallback(async () => {
    if (!order) return;
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch('/api/payment/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) { setPayError(data.error ?? 'Erro ao iniciar pagamento'); setPaying(false); return; }
      window.location.href = data.checkoutUrl;
    } catch {
      setPayError('Erro de conexão. Tente novamente.');
      setPaying(false);
    }
  }, [order]);

  const handleCancel = useCallback(async () => {
    if (!order) return;
    setCancelling(true);
    const result = await cancelOrder(order.id);
    setCancelling(false);
    if (result.success) {
      router.push('/me');
    } else {
      setPayError('error' in result ? result.error : 'Erro ao cancelar pedido');
    }
  }, [order, router]);

  // Determine if we're in post-payment state (returned from MP)
  const isPostPayment = isBuyer && (paymentStatus === 'success' || paymentStatus === 'pending');

  return (
    <RequireAuth>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">
          {!loading && order && !isBuyer ? 'Detalhes do pedido' : 'Finalizar compra'}
        </h1>

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
            {order.status === 'pago' ? (
              <>
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Pagamento confirmado!</p>
                <p className="text-sm text-muted-foreground mb-2">Pedido #{order.id.slice(0, 8)}</p>
                <p className="font-semibold mb-2">{order.cardName}</p>
                <p className="text-sm text-muted-foreground mb-6">
                  {isBuyer
                    ? 'O vendedor será notificado para preparar o envio.'
                    : 'Prepare o envio do produto.'}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-2">Pedido #{order.id.slice(0, 8)}</p>
                <p className="font-semibold mb-4">{order.cardName}</p>
                <StatusPill status={order.status} />
              </>
            )}
            <div className="mt-6">
              <Button asChild variant="outline"><Link href="/me">Ver meus pedidos</Link></Button>
            </div>
          </div>
        )}

        {!loading && order && order.status === 'aguardando_pagamento' && (
          <>
            {/* Post-payment verifying state */}
            {isPostPayment && (
              <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                {verifying ? (
                  <>
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                    Verificando pagamento...
                  </>
                ) : paymentStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    Pagamento realizado! A confirmação pode levar alguns instantes.
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 shrink-0" />
                    Pagamento pendente. Você receberá uma confirmação assim que for aprovado.
                  </>
                )}
              </div>
            )}

            {/* Failure banner */}
            {isBuyer && paymentStatus === 'failure' && (
              <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <XCircle className="h-5 w-5 shrink-0" />
                Pagamento recusado. Verifique os dados e tente novamente.
              </div>
            )}

            {/* Item summary */}
            <Card className="glass mb-6">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-20 w-16 rounded bg-secondary border border-white/[0.06] flex items-center justify-center text-3xl opacity-30">🃏</div>
                <div className="flex-1">
                  <p className="font-semibold">{order.cardName}</p>
                  <p className="text-sm text-muted-foreground">
                    {isBuyer ? `Vendedor: ${order.sellerName}` : `Comprador: ${order.buyerName}`}
                  </p>
                </div>
                <p className="text-xl font-bold text-accent">R$ {formatPrice(order.price)}</p>
              </CardContent>
            </Card>

            {/* Price summary */}
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

            {isBuyer ? (
              <>
                {payError && (
                  <p className="text-sm text-destructive mb-3 text-center">{payError}</p>
                )}

                {/* Hide pay button after successful payment, show it for failure/initial */}
                {!isPostPayment && (
                  <>
                    <Button size="lg" className="w-full mb-3" onClick={handlePay} disabled={paying}>
                      {paying
                        ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Aguarde...</>
                        : 'Pagar com Mercado Pago'}
                    </Button>

                    {/* Cancel order */}
                    <div className="flex justify-center mb-4">
                      {confirmCancel ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Tem certeza?</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={cancelling}
                            onClick={handleCancel}
                          >
                            {cancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Sim, cancelar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setConfirmCancel(false)}
                          >
                            Voltar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground/60 hover:text-destructive"
                          onClick={() => setConfirmCancel(true)}
                        >
                          Cancelar pedido
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {/* After payment: show link to orders */}
                {isPostPayment && !verifying && (
                  <div className="flex justify-center mb-4">
                    <Button asChild variant="outline">
                      <Link href="/me">Ver meus pedidos</Link>
                    </Button>
                  </div>
                )}

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
            ) : (
              /* Seller view — read-only status */
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                  <Clock className="h-4 w-4 shrink-0" />
                  Aguardando pagamento do comprador
                </div>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/me">Voltar ao perfil</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </RequireAuth>
  );
}
