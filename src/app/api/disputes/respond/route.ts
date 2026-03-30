import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { orderId, response } = await req.json();
    if (!orderId || !response?.trim()) {
      return NextResponse.json({ error: 'orderId e resposta são obrigatórios' }, { status: 400 });
    }

    // Verify the requesting user is the seller of this order
    const userClient = createServerSupabaseClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    // Check that the user is the seller of this order
    const { data: order } = await admin
      .from('orders')
      .select('seller_id')
      .eq('id', orderId)
      .single();

    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    if (order.seller_id !== user.id) {
      return NextResponse.json({ error: 'Apenas o vendedor pode responder à disputa' }, { status: 403 });
    }

    // Update dispute with seller response using admin client (bypasses RLS)
    const { error } = await admin
      .from('disputes')
      .update({ seller_response: response.trim(), updated_at: new Date().toISOString() })
      .eq('order_id', orderId);

    if (error) {
      console.error('[disputes/respond]', error);
      return NextResponse.json({ error: 'Erro ao salvar resposta' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[disputes/respond]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
