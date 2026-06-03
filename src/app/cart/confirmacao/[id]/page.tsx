"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';

const supabase = createClient();

interface PurchaseGroup {
  id: string;
  status: 'awaiting_payment' | 'paid' | 'cancelled' | 'expired';
  total_amount: number;
  items_total: number;
  shipping_total: number;
  insurance_total: number;
  delivery_recipient_name: string;
  delivery_city: string;
  delivery_state: string;
}

export default function CartConfirmGuarded() {
  return (
    <RequireAuth>
      <CartConfirmPage />
    </RequireAuth>
  );
}

function CartConfirmPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const status = searchParams.get('status'); // success / pending / failure
  const [group, setGroup] = useState<PurchaseGroup | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGroup = async (): Promise<PurchaseGroup | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('purchase_groups')
      .select('id, status, total_amount, items_total, shipping_total, insurance_total, delivery_recipient_name, delivery_city, delivery_state')
      .eq('id', params.id)
      .maybeSingle();
    return data as PurchaseGroup | null;
  };

  useEffect(() => {
    if (!params.id) return;
    (async () => {
      const data = await fetchGroup();
      setGroup(data);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // When MP redirected us back with status=success but the webhook hasn't
  // flipped the group yet, poll a few times so the buyer doesn't sit on a
  // stale "awaiting_payment" view. Mirrors the legacy /checkout polling.
  const pollAttempts = useRef(0);
  useEffect(() => {
    if (!group || !params.id) return;
    if (status !== 'success' && status !== 'pending') return;
    if (group.status !== 'awaiting_payment') return;

    const poll = async () => {
      pollAttempts.current += 1;
      const fresh = await fetchGroup();
      if (fresh) setGroup(fresh);
      if (fresh?.status !== 'awaiting_payment') return;
      if (pollAttempts.current < 6) setTimeout(poll, 5000);
    };
    const timer = setTimeout(poll, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.status, status, params.id]);

  if (loading) {
    return <div className="container mx-auto px-4 py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!group) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">Compra não encontrada.</p>
        <Button asChild variant="outline" className="mt-4"><Link href="/me">Voltar para Minha conta</Link></Button>
      </div>
    );
  }

  // Choose icon + message based on combined status from URL hint + DB.
  const isApproved = group.status === 'paid';
  const isFailed = group.status === 'cancelled' || status === 'failure';
  const isPending = group.status === 'awaiting_payment' && !isFailed;

  return (
    <div className="container mx-auto max-w-xl px-4 py-12">
      <Card>
        <CardContent className="p-8 space-y-4 text-center">
          {isApproved ? (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
              <h1 className="text-xl font-bold">Pagamento confirmado</h1>
              <p className="text-sm text-muted-foreground">
                Sua compra foi confirmada. Cada vendedor preparará o envio das cartas até o endereço de {group.delivery_recipient_name} em {group.delivery_city}/{group.delivery_state}.
              </p>
            </>
          ) : isFailed ? (
            <>
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <h1 className="text-xl font-bold">Pagamento não confirmado</h1>
              <p className="text-sm text-muted-foreground">Sua compra foi cancelada e os itens foram liberados.</p>
            </>
          ) : (
            <>
              <Clock className="h-12 w-12 mx-auto text-amber-400" />
              <h1 className="text-xl font-bold">Aguardando pagamento</h1>
              <p className="text-sm text-muted-foreground">
                Estamos confirmando seu pagamento com o Mercado Pago. Isso geralmente leva alguns segundos.
              </p>
            </>
          )}

          {isPending && (
            <div className="rounded-md border border-border bg-card/40 p-3 text-left text-sm space-y-1">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>R$ {formatPrice(group.items_total)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Frete total</span><span>R$ {formatPrice(group.shipping_total)}</span></div>
              {group.insurance_total > 0 && (
                <div className="flex justify-between text-muted-foreground"><span>Seguro total</span><span>R$ {formatPrice(group.insurance_total)}</span></div>
              )}
              <div className="flex justify-between font-bold pt-1 border-t border-border"><span>Total</span><span>R$ {formatPrice(group.total_amount)}</span></div>
            </div>
          )}

          <div className="flex gap-2 justify-center pt-2">
            <Button asChild variant="outline"><Link href="/marketplace">Continuar comprando</Link></Button>
            <Button asChild><Link href="/me">Ver meus pedidos</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
