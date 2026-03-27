'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, MessageCircle, Loader2, CheckCircle2, XCircle, Clock, Package, Truck, AlertTriangle } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { StatusPill } from '@/components/StatusPill';
import Link from 'next/link';
import { getOrder, cancelOrder, shipOrder, confirmDelivery, updateOrderShipping, getSellerCep } from '@/lib/api';
import { OrderMessages } from '@/components/OrderMessages';
import { ReviewForm } from '@/components/ReviewForm';
import { OpenDisputeForm } from '@/components/OpenDisputeForm';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';
import type { Order, ShippingOption } from '@/types';

export default function Checkout() {
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentStatus = searchParams.get('status');
  const { user, profile, tokenRefreshCount } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [shipping, setShipping] = useState(false);
  const [shipError, setShipError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmDeliveryOpen, setConfirmDeliveryOpen] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [buyerCep, setBuyerCep] = useState('');
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<number | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const verifyAttempts = useRef(0);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const isBuyer = !!(user && order && user.id === order.buyerId);
  const isSeller = !!(user && order && user.id === order.sellerId);

  // Fetch order on mount
  useEffect(() => {
    if (params.orderId) {
      getOrder(params.orderId).then(o => {
        setOrder(o);
        setLoading(false);
      });
    }
  }, [params.orderId, tokenRefreshCount]);

  // Auto-fill buyer CEP from profile and auto-calculate shipping
  const autoCalcDone = useRef(false);
  useEffect(() => {
    if (!order || !profile || !isBuyer || order.status !== 'aguardando_pagamento') return;
    if (order.shippingCost > 0 || order.freeShipping) return;
    if (autoCalcDone.current) return;
    if (profile.address_zip && !buyerCep) {
      const cep = profile.address_zip.replace(/\D/g, '');
      setBuyerCep(cep);
      // Auto-calculate shipping
      autoCalcDone.current = true;
      (async () => {
        setCalculatingShipping(true);
        try {
          const sellerCep = await getSellerCep(order.sellerId);
          const res = await fetch('/api/shipping/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ originZip: sellerCep || '01001000', destinationZip: cep }),
          });
          const data = await res.json();
          setCalculatingShipping(false);
          if (res.ok && data.options?.length) {
            setShippingOptions(data.options);
            setIsFallback(data.fallback ?? false);
            if (data.options.length === 1) {
              const opt = data.options[0];
              setSelectedShipping(0);
              const result = await updateOrderShipping(order.id, opt.price);
              if (result.success) setOrder(prev => prev ? { ...prev, shippingCost: opt.price } : prev);
            }
          }
        } catch {
          setCalculatingShipping(false);
        }
      })();
    }
  }, [order, profile, isBuyer, buyerCep]);

  // Countdown timer for awaiting_payment orders (30 min expiry)
  useEffect(() => {
    if (!order || order.status !== 'aguardando_pagamento') { setTimeLeft(null); return; }
    const expiresAt = new Date(order.createdAt).getTime() + 20 * 60 * 1000;
    const tick = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeft(null);
        // Refetch order — it may have been expired by the DB function
        getOrder(order.id).then(o => { if (o) setOrder(o); });
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [order?.id, order?.status, order?.createdAt]);

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
          const updated = await getOrder(order.id);
          setOrder(updated);
          setVerifying(false);
          return;
        }

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

  const handleCalculateShipping = useCallback(async () => {
    if (!order || !buyerCep.replace(/\D/g, '').match(/^\d{8}$/)) {
      setShippingError('CEP inválido (8 dígitos)');
      return;
    }
    setCalculatingShipping(true);
    setShippingError(null);
    setShippingOptions([]);
    setSelectedShipping(null);
    try {
      // Fetch seller's CEP from their profile
      const sellerCep = await getSellerCep(order.sellerId);
      const originZip = sellerCep || '01001000'; // fallback to SP

      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originZip, destinationZip: buyerCep.replace(/\D/g, '') }),
      });
      const data = await res.json();
      setCalculatingShipping(false);
      if (!res.ok) { setShippingError(data.error ?? 'Erro ao calcular frete'); return; }

      setShippingOptions(data.options ?? []);
      setIsFallback(data.fallback ?? false);

      // Auto-select if only one option
      if (data.options?.length === 1) {
        handleSelectShipping(data.options[0], 0);
      }
    } catch {
      setShippingError('Erro de conexão');
      setCalculatingShipping(false);
    }
  }, [order, buyerCep]);

  const handleSelectShipping = async (option: ShippingOption, index: number) => {
    if (!order) return;
    setSelectedShipping(index);
    const result = await updateOrderShipping(order.id, option.price);
    if (result.success) {
      setOrder(prev => prev ? { ...prev, shippingCost: option.price } : prev);
    }
  };

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

  const handleShip = useCallback(async () => {
    if (!order || !trackingCode.trim()) return;
    setShipping(true);
    setShipError(null);
    const result = await shipOrder(order.id, trackingCode.trim());
    setShipping(false);
    if (result.success) {
      const updated = await getOrder(order.id);
      setOrder(updated);
    } else {
      setShipError('error' in result ? result.error : 'Erro ao registrar envio');
    }
  }, [order, trackingCode]);

  const handleConfirmDelivery = useCallback(async () => {
    if (!order) return;
    setConfirming(true);
    setDeliveryError(null);
    const result = await confirmDelivery(order.id);
    setConfirming(false);
    if (result.success) {
      const updated = await getOrder(order.id);
      setOrder(updated);
      setConfirmDeliveryOpen(false);
    } else {
      setDeliveryError('error' in result ? result.error : 'Erro ao confirmar recebimento');
    }
  }, [order]);

  const isPostPayment = isBuyer && (paymentStatus === 'success' || paymentStatus === 'pending');

  const pageTitle = !loading && order
    ? (isSeller ? 'Detalhes do pedido' : 'Finalizar compra')
    : 'Finalizar compra';

  return (
    <RequireAuth>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{pageTitle}</h1>

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

        {/* ====== Non-awaiting-payment states ====== */}
        {!loading && order && order.status !== 'aguardando_pagamento' && (
          <>
            {/* Order info card */}
            <Card className="glass mb-6">
              <CardContent className="flex items-center gap-4 p-4">
                {order.listingImageUrl ? (
                  <img src={order.listingImageUrl} alt={order.cardName} className="h-20 w-16 rounded object-cover border border-white/[0.06]" />
                ) : (
                  <div className="h-20 w-16 rounded bg-secondary border border-white/[0.06] flex items-center justify-center text-3xl opacity-30"><span>{'🃏'}</span></div>
                )}
                <div className="flex-1">
                  <p className="font-semibold">{order.cardName}</p>
                  <p className="text-sm text-muted-foreground">
                    {isBuyer ? `Vendedor: ${order.sellerName}` : `Comprador: ${order.buyerName}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pedido #{order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-accent">R$ {formatPrice(order.price)}</p>
                  <StatusPill status={order.status} />
                </div>
              </CardContent>
            </Card>

            {/* Payment confirmed — seller shipping flow */}
            {order.status === 'pago' && isSeller && (
              <Card className="glass mb-6">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Pagamento confirmado! Prepare o envio do produto.</span>
                  </div>
                  <div className="space-y-2">
                    <Label>Código de rastreamento</Label>
                    <Input
                      placeholder="Ex: BR123456789BR"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                    />
                  </div>
                  {shipError && (
                    <p className="text-sm text-destructive">{shipError}</p>
                  )}
                  <Button
                    className="w-full"
                    disabled={!trackingCode.trim() || shipping}
                    onClick={handleShip}
                  >
                    {shipping
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> <span>Registrando...</span></>
                      : <><Package className="h-4 w-4 mr-2" /> <span>Marcar como enviado</span></>}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payment confirmed — buyer view */}
            {order.status === 'pago' && isBuyer && (
              <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>Pagamento confirmado! O vendedor está preparando o envio.</span>
              </div>
            )}

            {/* Shipped — show tracking info + confirm delivery for buyer */}
            {order.status === 'enviado' && (
              <Card className="glass mb-6">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                    <Truck className="h-4 w-4 shrink-0" />
                    <span>Pedido enviado!</span>
                  </div>
                  {order.trackingCode && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Código de rastreamento</span>
                      <span className="font-mono font-medium">{order.trackingCode}</span>
                    </div>
                  )}
                  {isBuyer && (
                    <>
                      {deliveryError && (
                        <p className="text-sm text-destructive">{deliveryError}</p>
                      )}
                      {confirmDeliveryOpen ? (
                        <div className="space-y-3 pt-2">
                          <p className="text-sm text-muted-foreground">
                            Confirme apenas após receber e verificar o produto. Esta ação não pode ser desfeita.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              disabled={confirming}
                              onClick={handleConfirmDelivery}
                            >
                              {confirming
                                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> <span>Confirmando...</span></>
                                : <><CheckCircle2 className="h-4 w-4 mr-2" /> <span>Sim, recebi o produto</span></>}
                            </Button>
                            <Button
                              variant="outline"
                              disabled={confirming}
                              onClick={() => setConfirmDeliveryOpen(false)}
                            >
                              Voltar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => setConfirmDeliveryOpen(true)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          <span>Confirmar recebimento</span>
                        </Button>
                      )}
                    </>
                  )}
                  {isSeller && (
                    <p className="text-xs text-muted-foreground">
                      Aguardando o comprador confirmar o recebimento.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Delivered — awaiting admin release */}
            {order.status === 'entregue' && (
              <Card className="glass mb-6">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{isBuyer ? 'Recebimento confirmado!' : 'Comprador confirmou o recebimento!'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isSeller
                      ? 'O pagamento será liberado em breve pela plataforma.'
                      : 'O pagamento será liberado ao vendedor pela plataforma.'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Completed — funds released */}
            {order.status === 'concluido' && (
              <Card className="glass mb-6">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{isSeller ? 'Pagamento liberado!' : 'Pedido concluído!'}</span>
                  </div>
                  {isSeller && (
                    <p className="text-sm text-muted-foreground">
                      <span>O valor de </span>
                      <span className="font-semibold text-accent">R$ {formatPrice(order.price)}</span>
                      <span> foi creditado na sua conta.</span>
                    </p>
                  )}
                  {isBuyer && (
                    <p className="text-sm text-muted-foreground">
                      <span>O pagamento foi liberado ao vendedor. Obrigado pela compra!</span>
                    </p>
                  )}
                  {order.trackingCode && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Código de rastreamento</span>
                      <span className="font-mono font-medium">{order.trackingCode}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Generic status for other states */}
            {order.status !== 'pago' && order.status !== 'enviado' && order.status !== 'entregue' && order.status !== 'concluido' && (
              <div className="text-center mb-6">
                <StatusPill status={order.status} />
              </div>
            )}

            {/* Review form — buyer on completed orders */}
            {order.status === 'concluido' && isBuyer && (
              <div className="mb-6">
                <ReviewForm orderId={order.id} sellerId={order.sellerId} />
              </div>
            )}

            {/* Open dispute — buyer/seller on shipped or delivered orders */}
            {(order.status === 'enviado' || order.status === 'entregue') && (
              <div className="mb-6 flex justify-end">
                <OpenDisputeForm
                  orderId={order.id}
                  role={isSeller ? 'seller' : 'buyer'}
                  onDisputeOpened={async () => {
                    const updated = await getOrder(order.id);
                    if (updated) setOrder(updated);
                  }}
                />
              </div>
            )}

            {/* Private messages — visible on all post-payment statuses */}
            {order.status !== 'cancelado' && (
              <div className="mb-6">
                <OrderMessages orderId={order.id} readOnly={order.status === 'concluido'} />
              </div>
            )}

            <div className="flex justify-center">
              <Button asChild variant="outline">
                <Link href="/me">Ver meus pedidos</Link>
              </Button>
            </div>
          </>
        )}

        {/* ====== Awaiting payment state ====== */}
        {!loading && order && order.status === 'aguardando_pagamento' && (
          <>
            {/* Post-payment verifying state */}
            {isPostPayment && (
              <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                {verifying ? (
                  <>
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                    <span>Verificando pagamento...</span>
                  </>
                ) : paymentStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>Pagamento realizado! A confirmação pode levar alguns instantes.</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 shrink-0" />
                    <span>Pagamento pendente. Você receberá uma confirmação assim que for aprovado.</span>
                  </>
                )}
              </div>
            )}

            {/* Failure banner */}
            {isBuyer && paymentStatus === 'failure' && (
              <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <XCircle className="h-5 w-5 shrink-0" />
                <span>Pagamento recusado. Verifique os dados e tente novamente.</span>
              </div>
            )}

            {/* Item summary */}
            <Card className="glass mb-6">
              <CardContent className="flex items-center gap-4 p-4">
                {order.listingImageUrl ? (
                  <img src={order.listingImageUrl} alt={order.cardName} className="h-20 w-16 rounded object-cover border border-white/[0.06]" />
                ) : (
                  <div className="h-20 w-16 rounded bg-secondary border border-white/[0.06] flex items-center justify-center text-3xl opacity-30"><span>{'🃏'}</span></div>
                )}
                <div className="flex-1">
                  <p className="font-semibold">{order.cardName}</p>
                  <p className="text-sm text-muted-foreground">
                    {isBuyer ? `Vendedor: ${order.sellerName}` : `Comprador: ${order.buyerName}`}
                  </p>
                </div>
                <p className="text-xl font-bold text-accent">R$ {formatPrice(order.price)}</p>
              </CardContent>
            </Card>

            {/* Shipping calculator — only for buyer, before payment */}
            {isBuyer && !isPostPayment && !order.freeShipping && (
              <Card className="glass mb-6">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2"><Truck className="h-4 w-4 text-accent" /> Calcular frete</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Seu CEP (ex: 01001-000)"
                      value={buyerCep}
                      onChange={(e) => setBuyerCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className="flex-1 h-9 rounded-md bg-white/[0.06] border border-white/[0.08] px-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent/30"
                      maxLength={9}
                    />
                    <Button
                      size="sm"
                      disabled={buyerCep.length < 8 || calculatingShipping}
                      onClick={handleCalculateShipping}
                    >
                      {calculatingShipping ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Calcular'}
                    </Button>
                  </div>
                  {shippingError && <p className="text-xs text-destructive">{shippingError}</p>}

                  {/* Shipping options */}
                  {shippingOptions.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {isFallback && (
                        <p className="text-[11px] text-amber-400">Frete estimado (valor aproximado)</p>
                      )}
                      {shippingOptions.map((opt, i) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectShipping(opt, i)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${
                            selectedShipping === i
                              ? 'border-accent/40 bg-accent/5'
                              : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14]'
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-medium">{opt.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {opt.company}{opt.deliveryDays ? ` · ${opt.deliveryDays} dias úteis` : ''}
                            </p>
                          </div>
                          <p className="font-semibold text-accent">R$ {formatPrice(opt.price)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Price summary */}
            <Card className="glass mb-6">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {formatPrice(order.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span>{order.shippingCost > 0 ? `R$ ${formatPrice(order.shippingCost)}` : order.freeShipping ? 'Grátis' : 'Informe seu CEP'}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-accent">R$ {formatPrice(order.price + (order.shippingCost ?? 0))}</span>
                </div>
              </CardContent>
            </Card>

            {/* Expiry countdown */}
            {timeLeft && !isPostPayment && (
              <div className="flex items-center justify-center gap-2 mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Reserva expira em <span className="font-mono font-bold">{timeLeft}</span></span>
              </div>
            )}

            {isBuyer ? (
              <>
                {payError && (
                  <p className="text-sm text-destructive mb-3 text-center">{payError}</p>
                )}

                {!isPostPayment && (
                  <>
                    {!order.freeShipping && order.shippingCost === 0 && (
                      <p className="text-xs text-amber-400 text-center mb-3">Calcule o frete antes de pagar</p>
                    )}
                    <Button size="lg" className="w-full mb-3" onClick={handlePay} disabled={paying || (!order.freeShipping && order.shippingCost === 0)}>
                      {paying
                        ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> <span>Aguarde...</span></>
                        : 'Pagar com Mercado Pago'}
                    </Button>

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

                {isPostPayment && !verifying && (
                  <div className="flex justify-center mb-4">
                    <Button asChild variant="outline">
                      <Link href="/me">Ver meus pedidos</Link>
                    </Button>
                  </div>
                )}

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
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Aguardando pagamento do comprador</span>
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
