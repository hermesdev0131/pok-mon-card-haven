import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createAdminClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    // Verify the requesting user is the buyer
    const userClient = createServerSupabaseClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    // Fetch the order
    const { data: order } = await admin
      .from('orders')
      .select('id, status, buyer_id, listing_id, mp_preference_id')
      .eq('id', orderId)
      .eq('buyer_id', user.id)
      .single();

    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

    // If already updated, just return current status
    if (order.status !== 'awaiting_payment') {
      return NextResponse.json({ status: order.status });
    }

    // No preference yet — nothing to verify
    if (!order.mp_preference_id) {
      return NextResponse.json({ status: order.status });
    }

    // Search for payments linked to this order via external_reference
    const paymentClient = new Payment(mp);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchResult = await (paymentClient as any).search({
      options: { criteria: 'desc' },
      body: { external_reference: orderId },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (searchResult as any)?.results ?? [];
    const approvedPayment = results.find((p: any) => p.status === 'approved');

    if (approvedPayment) {
      // Payment approved — update order status
      await admin
        .from('orders')
        .update({
          status: 'payment_confirmed',
          mp_payment_id: String(approvedPayment.id),
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('status', 'awaiting_payment'); // idempotent guard

      return NextResponse.json({ status: 'payment_confirmed' });
    }

    // Check for rejected/cancelled
    const rejectedPayment = results.find((p: any) =>
      ['rejected', 'cancelled'].includes(p.status)
    );

    if (rejectedPayment && results.length === 1) {
      // Only reject if there's no other pending/approved payment
      await Promise.all([
        admin.from('orders').update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: `MP payment ${rejectedPayment.status}`,
        }).eq('id', orderId).eq('status', 'awaiting_payment'),
        admin.from('listings').update({ status: 'active' }).eq('id', order.listing_id),
      ]);
      return NextResponse.json({ status: 'cancelled' });
    }

    // No conclusive payment status yet
    return NextResponse.json({ status: order.status });
  } catch (err: any) {
    console.error('[verify-payment]', err);
    return NextResponse.json({ error: 'Erro ao verificar pagamento' }, { status: 500 });
  }
}
