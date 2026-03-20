import { NextResponse } from 'next/server';

/**
 * MVP flat-rate shipping calculation based on Brazilian CEP regions.
 * Maps the first 2 digits of a CEP to a region, then calculates cost
 * based on same-region, neighboring, or far distance.
 *
 * Can be upgraded to Correios/Melhor Envio API later.
 */

// CEP prefix → region mapping (first 2 digits of Brazilian CEP)
function getRegion(zip: string): string {
  const prefix = parseInt(zip.replace(/\D/g, '').slice(0, 2), 10);

  // São Paulo state
  if (prefix >= 1 && prefix <= 19) return 'SP';
  // Rio de Janeiro, Espírito Santo
  if (prefix >= 20 && prefix <= 29) return 'RJ_ES';
  // Minas Gerais
  if (prefix >= 30 && prefix <= 39) return 'MG';
  // Bahia, Sergipe
  if (prefix >= 40 && prefix <= 49) return 'BA_SE';
  // Alagoas, Pernambuco, Paraíba, Rio Grande do Norte
  if (prefix >= 50 && prefix <= 59) return 'NE_EAST';
  // Ceará, Piauí, Maranhão, Pará, Amazonas, Amapá, Roraima, Acre
  if (prefix >= 60 && prefix <= 69) return 'NE_NORTH';
  // Distrito Federal, Goiás, Tocantins, Mato Grosso, Mato Grosso do Sul, Rondônia
  if (prefix >= 70 && prefix <= 79) return 'CO';
  // Paraná, Santa Catarina
  if (prefix >= 80 && prefix <= 89) return 'SUL';
  // Rio Grande do Sul
  if (prefix >= 90 && prefix <= 99) return 'RS';

  return 'UNKNOWN';
}

// Neighboring region groups
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

// Prices in centavos
const SAME_REGION_PRICE = 1500;     // R$ 15,00
const NEIGHBOR_REGION_PRICE = 2500; // R$ 25,00
const FAR_REGION_PRICE = 3500;      // R$ 35,00

export async function POST(request: Request) {
  try {
    const { originZip, destinationZip } = await request.json();

    if (!originZip || !destinationZip) {
      return NextResponse.json({ error: 'CEPs de origem e destino são obrigatórios' }, { status: 400 });
    }

    const originRegion = getRegion(originZip);
    const destRegion = getRegion(destinationZip);

    if (originRegion === 'UNKNOWN' || destRegion === 'UNKNOWN') {
      return NextResponse.json({ error: 'CEP inválido' }, { status: 400 });
    }

    let shippingCost: number;

    if (originRegion === destRegion) {
      shippingCost = SAME_REGION_PRICE;
    } else if (NEIGHBORING[originRegion]?.includes(destRegion)) {
      shippingCost = NEIGHBOR_REGION_PRICE;
    } else {
      shippingCost = FAR_REGION_PRICE;
    }

    return NextResponse.json({
      shippingCost,
      originRegion,
      destinationRegion: destRegion,
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao calcular frete' }, { status: 500 });
  }
}
