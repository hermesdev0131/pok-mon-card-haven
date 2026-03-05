import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // Verify the caller is an admin
    const userClient = createServerSupabaseClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    // Fetch order
    const { data: order } = await admin
      .from('orders')
      .select('id, status, mp_payment_id')
      .eq('id', orderId)
      .single();

    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    if (!['payment_confirmed', 'awaiting_shipment', 'shipped', 'delivered'].includes(order.status)) {
      return NextResponse.json({ error: 'Status do pedido não permite liberação' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Mark order as completed — DB trigger auto-creates confirmed_sale
    const { error } = await admin
      .from('orders')
      .update({ status: 'completed', completed_at: now })
      .eq('id', orderId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[release-payment]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
