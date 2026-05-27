// Produce the human-facing badge text for a listing's free-shipping policy.
// Returns null when neither method is free, so callers can simply check truthiness.
export function freeShippingLabel(pac?: boolean | null, sedex?: boolean | null): string | null {
  if (pac && sedex) return 'Frete grátis';
  if (pac) return 'Frete grátis (PAC)';
  if (sedex) return 'Frete grátis (SEDEX)';
  return null;
}
