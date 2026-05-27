import { NextResponse } from 'next/server';

/**
 * Shipping calculation using Melhor Envio API with flat-rate fallback.
 * Returns multiple carrier options (Correios PAC, SEDEX, Jadlog, etc.)
 */

// ── Melhor Envio API ──────────────────────────────────────────────
const ME_API = 'https://melhorenvio.com.br/api/v2/me/shipment/calculate';

// Standard graded card slab dimensions
const PACKAGE = {
  height: 3,    // cm
  width: 14,    // cm
  length: 20,   // cm
  weight: 0.2,  // kg
};

interface MeService {
  id: number;
  name: string;
  price: string;
  error?: string;
  delivery_time: number;
  company: { name: string };
}

async function fetchMelhorEnvio(
  originZip: string,
  destinationZip: string,
  insuranceValue?: number,
): Promise<{ options: ShippingOpt[]; fallback: false } | null> {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) return null;

  try {
    // When insuranceValue (BRL) is provided, Melhor Envio rolls Correios's
    // actual insurance fee into the returned price for each carrier, computed
    // from the declared value. Omit the field to get the no-insurance rate.
    const body: Record<string, unknown> = {
      from: { postal_code: originZip },
      to: { postal_code: destinationZip },
      package: PACKAGE,
    };
    if (insuranceValue && insuranceValue > 0) {
      body.options = { insurance_value: insuranceValue };
    }
    const res = await fetch(ME_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Graduada contato@graduada.com.br',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('[Shipping] Melhor Envio API error:', res.status);
      return null;
    }

    const services: MeService[] = await res.json();

    const options: ShippingOpt[] = services
      .filter(s => !s.error && parseFloat(s.price) > 0)
      .filter(s => s.company?.name?.toLowerCase() === 'correios')
      // Mini Envios only works for items under R$ 100, which doesn't fit a graded
      // card marketplace where items are typically much more expensive. Hide it.
      .filter(s => s.name?.toLowerCase() !== 'mini envios')
      .map(s => ({
        id: s.id,
        name: s.name,
        price: Math.round(parseFloat(s.price) * 100), // BRL → centavos
        deliveryDays: s.delivery_time ?? null,
        company: s.company?.name ?? 'Transportadora',
      }))
      .sort((a, b) => a.price - b.price);

    if (options.length === 0) return null;
    return { options, fallback: false };
  } catch (err) {
    console.error('[Shipping] Melhor Envio fetch failed:', err);
    return null;
  }
}

// ── Flat-rate fallback ────────────────────────────────────────────
interface ShippingOpt {
  id: number;
  name: string;
  price: number;
  deliveryDays: number | null;
  company: string;
}

function getRegion(zip: string): string {
  const prefix = parseInt(zip.replace(/\D/g, '').slice(0, 2), 10);
  if (prefix >= 1 && prefix <= 19) return 'SP';
  if (prefix >= 20 && prefix <= 29) return 'RJ_ES';
  if (prefix >= 30 && prefix <= 39) return 'MG';
  if (prefix >= 40 && prefix <= 49) return 'BA_SE';
  if (prefix >= 50 && prefix <= 59) return 'NE_EAST';
  if (prefix >= 60 && prefix <= 69) return 'NE_NORTH';
  if (prefix >= 70 && prefix <= 79) return 'CO';
  if (prefix >= 80 && prefix <= 89) return 'SUL';
  if (prefix >= 90 && prefix <= 99) return 'RS';
  return 'UNKNOWN';
}

const NEIGHBORING: Record<string, string[]> = {
  SP: ['RJ_ES', 'MG', 'SUL'],
  RJ_ES: ['SP', 'MG', 'BA_SE'],
  MG: ['SP', 'RJ_ES', 'BA_SE', 'CO'],
  BA_SE: ['RJ_ES', 'MG', 'NE_EAST', 'CO'],
  NE_EAST: ['BA_SE', 'NE_NORTH'],
  NE_NORTH: ['NE_EAST', 'CO'],
  CO: ['MG', 'BA_SE', 'NE_NORTH', 'SUL'],
  SUL: ['SP', 'RS', 'CO'],
  RS: ['SUL'],
};

const SAME_REGION_PRICE = 1500;
const NEIGHBOR_REGION_PRICE = 2500;
const FAR_REGION_PRICE = 3500;

function flatRateFallback(originZip: string, destinationZip: string): ShippingOpt[] {
  const originRegion = getRegion(originZip);
  const destRegion = getRegion(destinationZip);

  if (originRegion === 'UNKNOWN' || destRegion === 'UNKNOWN') {
    return [{ id: 0, name: 'Frete padrão', price: FAR_REGION_PRICE, deliveryDays: null, company: 'Estimativa' }];
  }

  let price: number;
  if (originRegion === destRegion) price = SAME_REGION_PRICE;
  else if (NEIGHBORING[originRegion]?.includes(destRegion)) price = NEIGHBOR_REGION_PRICE;
  else price = FAR_REGION_PRICE;

  return [{ id: 0, name: 'Frete padrão', price, deliveryDays: null, company: 'Estimativa' }];
}

// ── Route handler ─────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { originZip, destinationZip, insuranceValue } = await request.json();

    if (!originZip || !destinationZip) {
      return NextResponse.json({ error: 'CEPs de origem e destino são obrigatórios' }, { status: 400 });
    }

    // When the caller passes insuranceValue (BRL declared value, usually the
    // listing price), we fetch both rate sets — without and with insurance —
    // so the checkout UI can show the buyer the exact insurance delta and
    // toggle between them without a round trip.
    const insuranceBrl = typeof insuranceValue === 'number' && insuranceValue > 0 ? insuranceValue : undefined;

    const meNoIns = await fetchMelhorEnvio(
      originZip.replace(/\D/g, ''),
      destinationZip.replace(/\D/g, ''),
    );
    const meWithIns = insuranceBrl
      ? await fetchMelhorEnvio(
          originZip.replace(/\D/g, ''),
          destinationZip.replace(/\D/g, ''),
          insuranceBrl,
        )
      : null;

    if (meNoIns) {
      return NextResponse.json({
        options: meNoIns.options,
        // Each insured option here is the SAME shipping cost the carrier
        // already includes its insurance fee on. UI compares insuredOptions[i]
        // vs options[i] by id/name to compute the insurance delta.
        insuredOptions: meWithIns?.options ?? null,
        fallback: false,
      });
    }

    // Fallback to flat-rate (no real insurance computation in fallback mode)
    const options = flatRateFallback(originZip, destinationZip);
    return NextResponse.json({ options, insuredOptions: null, fallback: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao calcular frete' }, { status: 500 });
  }
}
