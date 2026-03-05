import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

function verifySignature(req: NextRequest, _rawBody: string): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true; // skip verification if secret not configured yet

  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');
  if (!xSignature || !xRequestId) return false;

  // MP signature format: "ts=<timestamp>,v1=<hash>"
  const parts = Object.fromEntries(xSignature.split(',').map(p => p.split('=')));
  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) return false;

  const manifest = `id:${xRequestId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Always return 200 to MP — process errors internally
  if (!verifySignature(req, rawBody)) {
    console.warn('[webhook/mp] invalid signature');
    return NextResponse.json({ ok: true });
  }

  let body: any;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ ok: true }); }

  // MP sends two notification types: "payment" and "merchant_order"
  if (body.type !== 'payment' || !body.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const paymentId = String(body.data.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  try {
    // Fetch full payment details from MP
    const paymentClient = new Payment(mp);
    const payment = await paymentClient.get({ id: paymentId });

    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ ok: true });

    // Fetch the order to check current status (idempotency)
    const { data: order } = await admin
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single();

    if (!order) return NextResponse.json({ ok: true });

    if (payment.status === 'approved' && order.status === 'awaiting_payment') {
      await admin
        .from('orders')
        .update({
          status: 'payment_confirmed',
          mp_payment_id: paymentId,
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId);

    } else if (['rejected', 'cancelled'].includes(payment.status ?? '') && order.status === 'awaiting_payment') {
      // Release the listing back to active
      const { data: orderFull } = await admin
        .from('orders')
        .select('listing_id')
        .eq('id', orderId)
        .single();

      await Promise.all([
        admin.from('orders').update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: `MP payment ${payment.status}`,
        }).eq('id', orderId),
        orderFull
          ? admin.from('listings').update({ status: 'active' }).eq('id', orderFull.listing_id)
          : Promise.resolve(),
      ]);
    }
  } catch (err) {
    console.error('[webhook/mp] processing error', err);
    // Still return 200 so MP doesn't retry infinitely
  }

  return NextResponse.json({ ok: true });
}
