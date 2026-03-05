import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createAdminClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    // Verify the requesting user is the buyer of this order
    const userClient = createServerSupabaseClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const admin = createAdminClient();

    // Fetch order with card info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error } = await (admin as any)
      .from('orders')
      .select('*, listings(*, card_bases(name))')
      .eq('id', orderId)
      .eq('buyer_id', user.id)
      .single();

    if (error || !order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    if (order.status !== 'awaiting_payment') {
      return NextResponse.json({ error: 'Pedido não está aguardando pagamento' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const cardName = (order.listings as any)?.card_bases?.name ?? 'Carta Pokémon Graduada';

    // Create Mercado Pago preference
    const preference = new Preference(mp);
    const result = await preference.create({
      body: {
        items: [
          {
            id: order.listing_id,
            title: cardName,
            quantity: 1,
            unit_price: order.price / 100,
            currency_id: 'BRL',
          },
        ],
        marketplace_fee: order.platform_fee / 100,
        back_urls: {
          success: `${appUrl}/checkout/${orderId}?status=success`,
          failure: `${appUrl}/checkout/${orderId}?status=failure`,
          pending: `${appUrl}/checkout/${orderId}?status=pending`,
        },
        auto_return: 'approved',
        notification_url: `${appUrl}/api/webhooks/mercado-pago`,
        external_reference: orderId,
      },
    });

    // Save preference ID on the order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('orders')
      .update({ mp_preference_id: result.id })
      .eq('id', orderId);

    return NextResponse.json({
      preferenceId: result.id,
      initPoint: result.init_point,        // production checkout URL
      sandboxInitPoint: result.sandbox_init_point, // sandbox URL
    });
  } catch (err: any) {
    console.error('[create-preference]', err);
    return NextResponse.json({ error: 'Erro ao criar preferência de pagamento' }, { status: 500 });
  }
}
