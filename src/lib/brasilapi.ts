// BrasilAPI CNPJ lookup — fetches company data from Receita Federal
// Docs: https://brasilapi.com.br/docs#tag/CNPJ

export interface BrasilCnpjResult {
  razao_social: string;
  nome_fantasia: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  ddd_telefone_1: string | null;
  descricao_situacao_cadastral: string | null;
}

export async function lookupCnpj(cnpj: string): Promise<BrasilCnpjResult | null> {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return null;
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}
