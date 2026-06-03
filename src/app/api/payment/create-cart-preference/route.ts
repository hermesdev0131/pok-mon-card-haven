import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createAdminClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

interface OrderRow {
  id: string;
  listing_id: string;
  seller_id: string;
  price: number;
  shipping_cost: number;
  shipping_method: string | null;
  insurance_opted_in: boolean;
  insurance_cost: number;
  listings: { card_bases: { name: string } | null } | null;
}

// Builds a single Mercado Pago preference covering every order in a
// purchase_group. Each card becomes one line item; per-seller shipping and
// insurance ride only on the first order of that seller (so we read them
// straight off the orders table). The whole charge goes to the buyer in
// one transaction.
export async function POST(req: NextRequest) {
  try {
    const { purchaseGroupId } = await req.json();
    if (!purchaseGroupId) return NextResponse.json({ error: 'purchaseGroupId required' }, { status: 400 });

    const userClient = createServerSupabaseClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: group, error: groupErr } = await (admin as any)
      .from('purchase_groups')
      .select('id, buyer_id, status, total_amount')
      .eq('id', purchaseGroupId)
      .single();
    if (groupErr || !group) return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 });
    if (group.buyer_id !== user.id) return NextResponse.json({ error: 'Operação não autorizada' }, { status: 403 });
    if (group.status !== 'awaiting_payment') return NextResponse.json({ error: 'Compra não está aguardando pagamento' }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orderRows } = await (admin as any)
      .from('orders')
      .select('id, listing_id, seller_id, price, shipping_cost, shipping_method, insurance_opted_in, insurance_cost, listings(card_bases(name))')
      .eq('purchase_group_id', purchaseGroupId);
    const orders = (orderRows ?? []) as OrderRow[];
    if (orders.length === 0) return NextResponse.json({ error: 'Nenhum pedido encontrado' }, { status: 404 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    // Build MP line items: one per card + one shipping line per seller (where
    // the buyer is actually paying) + one insurance line per seller (where opted in).
    const items: { id: string; title: string; quantity: number; unit_price: number; currency_id: string }[] = [];

    for (const order of orders) {
      const cardName = order.listings?.card_bases?.name ?? 'Carta Pokémon Graduada';
      items.push({
        id: order.listing_id,
        title: cardName,
        quantity: 1,
        unit_price: order.price / 100,
        currency_id: 'BRL',
      });

      // Per-seller shipping rides on a single order. We add it as a separate
      // MP line so the buyer sees an itemized total. Skip when the seller
      // covers shipping (their payout already absorbed it).
      if (order.shipping_cost > 0) {
        // Determine if this order's chosen method was the seller's free method.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: listing } = await (admin as any)
          .from('listings')
          .select('free_shipping_pac, free_shipping_sedex')
          .eq('id', order.listing_id)
          .single();
        const method = order.shipping_method?.toUpperCase();
        const sellerPays =
          (method === 'PAC' && listing?.free_shipping_pac) ||
          (method === 'SEDEX' && listing?.free_shipping_sedex);
        if (!sellerPays) {
          items.push({
            id: `${order.id}-shipping`,
            title: 'Frete',
            quantity: 1,
            unit_price: order.shipping_cost / 100,
            currency_id: 'BRL',
          });
        }
      }

      if (order.insurance_opted_in && order.insurance_cost > 0) {
        items.push({
          id: `${order.id}-insurance`,
          title: 'Seguro Correios',
          quantity: 1,
          unit_price: order.insurance_cost / 100,
          currency_id: 'BRL',
        });
      }
    }

    const preference = new Preference(mp);
    const result = await preference.create({
      body: {
        items,
        back_urls: {
          success: `${appUrl}/cart/confirmacao/${purchaseGroupId}?status=success`,
          failure: `${appUrl}/cart/confirmacao/${purchaseGroupId}?status=failure`,
          pending: `${appUrl}/cart/confirmacao/${purchaseGroupId}?status=pending`,
        },
        auto_return: 'approved',
        notification_url: `${appUrl}/api/webhooks/mercado-pago`,
        external_reference: `group:${purchaseGroupId}`,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('purchase_groups')
      .update({ mp_preference_id: result.id })
      .eq('id', purchaseGroupId);

    const isSandbox = process.env.MERCADO_PAGO_SANDBOX === 'true';
    return NextResponse.json({
      preferenceId: result.id,
      checkoutUrl: isSandbox ? result.sandbox_init_point : result.init_point,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('[create-cart-preference]', err);
    return NextResponse.json({ error: 'Erro ao criar preferência de pagamento' }, { status: 500 });
  }
}
