"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, ShoppingCart, MapPin, Plus, AlertTriangle } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { FlagIcon } from '@/components/FlagIcon';
import { GradeBadge } from '@/components/GradeBadge';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { useCart } from '@/contexts/CartContext';
import { getMyCart, getMyAddresses, getSellerCep, checkoutCart, type SellerShipmentInput } from '@/lib/api';
import { freeShippingLabel } from '@/lib/free-shipping';
import { formatPrice } from '@/lib/utils';
import { formatCep } from '@/lib/validators';
import type { Address, CartItem, ShippingOption } from '@/types';

// ---- Helpers (mirrors checkout page) ----
function methodFromName(name: string | undefined | null): 'PAC' | 'SEDEX' | null {
  if (!name) return null;
  const u = name.trim().toUpperCase();
  if (u.includes('SEDEX')) return 'SEDEX';
  if (u.includes('PAC')) return 'PAC';
  return null;
}

interface SellerGroupState {
  loading: boolean;
  options: ShippingOption[];
  insuredOptions: ShippingOption[] | null;
  selectedIdx: number | null;
  insurance: boolean;
  error: string | null;
}

const defaultGroupState: SellerGroupState = {
  loading: false,
  options: [],
  insuredOptions: null,
  selectedIdx: null,
  insurance: false,
  error: null,
};

export default function CartPageGuarded() {
  return (
    <RequireAuth>
      <CartPage />
    </RequireAuth>
  );
}

function CartPage() {
  const router = useRouter();
  const { refresh, removeFromCart } = useCart();

  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Record<string, SellerGroupState>>({});
  const [removingId, setRemovingId] = useState<string | null>(null);

  // ---- Initial load: cart + addresses ----
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [cartItems, addrList] = await Promise.all([getMyCart(), getMyAddresses()]);
      setItems(cartItems);
      setAddresses(addrList);
      const def = addrList.find(a => a.isDefault) ?? addrList[0];
      if (def) setSelectedAddressId(def.id);
      setLoading(false);
    })();
  }, []);

  // Group items by seller in render order (insertion order = added_at desc from API).
  const itemsBySeller = useMemo(() => {
    const map = new Map<string, CartItem[]>();
    for (const it of items) {
      if (!map.has(it.sellerId)) map.set(it.sellerId, []);
      map.get(it.sellerId)!.push(it);
    }
    return map;
  }, [items]);

  // ---- Recalculate per-seller shipping whenever the selected address or
  // the set of sellers changes. Each seller's shipping is fetched from
  // their origin CEP to the buyer's chosen delivery CEP, with the bundle's
  // total price as the insurance declared value.
  const lastRefreshKey = useRef('');
  useEffect(() => {
    if (!selectedAddressId) return;
    const address = addresses.find(a => a.id === selectedAddressId);
    if (!address) return;
    const sellerIds = Array.from(itemsBySeller.keys()).sort();
    const refreshKey = `${address.zip}|${sellerIds.join(',')}`;
    if (refreshKey === lastRefreshKey.current) return;
    lastRefreshKey.current = refreshKey;

    sellerIds.forEach(async (sellerId) => {
      const groupItems = itemsBySeller.get(sellerId) ?? [];
      const declared = groupItems.reduce((sum, it) => sum + it.listing.price, 0) / 100;
      setGroups(prev => ({ ...prev, [sellerId]: { ...(prev[sellerId] ?? defaultGroupState), loading: true, error: null } }));
      const sellerCep = await getSellerCep(sellerId);
      if (!sellerCep) {
        setGroups(prev => ({ ...prev, [sellerId]: { ...defaultGroupState, error: 'Vendedor sem endereço de origem' } }));
        return;
      }
      try {
        const res = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originZip: sellerCep,
            destinationZip: address.zip,
            insuranceValue: declared,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setGroups(prev => ({ ...prev, [sellerId]: { ...defaultGroupState, error: data.error ?? 'Erro ao calcular frete' } }));
          return;
        }
        setGroups(prev => ({
          ...prev,
          [sellerId]: {
            loading: false,
            options: data.options ?? [],
            insuredOptions: data.insuredOptions ?? null,
            selectedIdx: (data.options?.length === 1) ? 0 : (prev[sellerId]?.selectedIdx ?? null),
            insurance: prev[sellerId]?.insurance ?? false,
            error: null,
          },
        }));
      } catch {
        setGroups(prev => ({ ...prev, [sellerId]: { ...defaultGroupState, error: 'Erro de conexão' } }));
      }
    });
  }, [selectedAddressId, itemsBySeller, addresses]);

  // ---- Computations ----
  const computeGroup = (sellerId: string) => {
    const group = groups[sellerId];
    const groupItems = itemsBySeller.get(sellerId) ?? [];
    const subtotal = groupItems.reduce((s, it) => s + it.listing.price, 0);
    if (!group || group.selectedIdx === null) return { subtotal, shippingBuyerCost: 0, sellerPaysShipping: false, insuranceCost: 0, total: subtotal };
    const opt = group.options[group.selectedIdx];
    if (!opt) return { subtotal, shippingBuyerCost: 0, sellerPaysShipping: false, insuranceCost: 0, total: subtotal };
    const method = methodFromName(opt.name);
    const firstItem = groupItems[0]?.listing;
    const sellerPaysShipping = !!(method && firstItem && ((method === 'PAC' && firstItem.freeShippingPac) || (method === 'SEDEX' && firstItem.freeShippingSedex)));
    const baseCost = opt.price;
    const insured = group.insuredOptions?.find(o => o.id === opt.id || o.name === opt.name);
    const insuranceCost = group.insurance && insured ? Math.max(0, insured.price - baseCost) : 0;
    const shippingBuyerCost = sellerPaysShipping ? 0 : baseCost;
    return { subtotal, shippingBuyerCost, sellerPaysShipping, insuranceCost, total: subtotal + shippingBuyerCost + insuranceCost };
  };

  const grandTotal = useMemo(() => {
    let total = 0;
    Array.from(itemsBySeller.keys()).forEach((sellerId) => {
      total += computeGroup(sellerId).total;
    });
    return total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsBySeller, groups]);

  // ---- Handlers ----
  const handleRemove = async (cartItemId: string) => {
    setRemovingId(cartItemId);
    await removeFromCart(cartItemId);
    setRemovingId(null);
    setItems(prev => prev.filter(i => i.id !== cartItemId));
    refresh();
  };

  const handleSelectShipping = (sellerId: string, idx: number) => {
    setGroups(prev => ({ ...prev, [sellerId]: { ...(prev[sellerId] ?? defaultGroupState), selectedIdx: idx } }));
  };

  const handleToggleInsurance = (sellerId: string, next: boolean) => {
    setGroups(prev => ({ ...prev, [sellerId]: { ...(prev[sellerId] ?? defaultGroupState), insurance: next } }));
  };

  // Are all sellers ready to proceed? Each must have a shipping method picked.
  const canCheckout = selectedAddressId !== null && itemsBySeller.size > 0 && Array.from(itemsBySeller.keys()).every(s => (groups[s]?.selectedIdx ?? null) !== null);

  const [proceedError, setProceedError] = useState<string | null>(null);
  const [proceeding, setProceeding] = useState(false);

  const handleProceed = async () => {
    if (!selectedAddressId) return;
    setProceedError(null);
    setProceeding(true);

    // Build the per-seller shipments payload from the current selections.
    const shipments: SellerShipmentInput[] = [];
    for (const sellerId of Array.from(itemsBySeller.keys())) {
      const group = groups[sellerId];
      if (!group || group.selectedIdx === null) continue;
      const opt = group.options[group.selectedIdx];
      if (!opt) continue;
      const method = methodFromName(opt.name);
      const insured = group.insuredOptions?.find(o => o.id === opt.id || o.name === opt.name);
      const insuranceCost = group.insurance && insured ? Math.max(0, insured.price - opt.price) : 0;
      shipments.push({
        seller_id: sellerId,
        shipping_cost: opt.price,
        shipping_method: method,
        insurance_opted_in: group.insurance && insuranceCost > 0,
        insurance_cost: insuranceCost,
      });
    }

    // 1) Reserve listings + create purchase_group + orders atomically.
    const checkoutResult = await checkoutCart(selectedAddressId, shipments);
    if (!checkoutResult.success) {
      setProceeding(false);
      setProceedError(checkoutResult.error);
      // If items became unavailable mid-flight, refresh cart so the UI removes them.
      if (checkoutResult.unavailable && checkoutResult.unavailable.length > 0) {
        const fresh = await getMyCart();
        setItems(fresh);
        refresh();
      }
      return;
    }
    refresh(); // cart was emptied server-side; update navbar count

    // 2) Build the MP preference for the new purchase group.
    try {
      const res = await fetch('/api/payment/create-cart-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseGroupId: checkoutResult.purchaseGroupId }),
      });
      const data = await res.json();
      if (!res.ok) { setProceedError(data.error ?? 'Erro ao iniciar pagamento'); setProceeding(false); return; }
      window.location.href = data.checkoutUrl;
    } catch {
      setProceedError('Erro de conexão. Tente novamente.');
      setProceeding(false);
    }
  };

  // ---- Render ----
  if (loading) {
    return <div className="container mx-auto px-4 py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <h2 className="text-lg font-semibold">Seu carrinho está vazio</h2>
            <p className="text-sm text-muted-foreground">Adicione cartas dos vendedores para começar.</p>
            <Button asChild><Link href="/marketplace">Ver marketplace</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const noAddresses = addresses.length === 0;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Meu carrinho</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Você está comprando de {itemsBySeller.size} {itemsBySeller.size === 1 ? 'vendedor' : 'vendedores diferentes'}.
      </p>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* Address picker */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-semibold">Endereço de entrega</Label>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link href="/me/enderecos"><Plus className="h-3 w-3 mr-1" /> Gerenciar</Link>
                </Button>
              </div>
              {noAddresses ? (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-400">
                  Você precisa cadastrar um endereço antes de finalizar a compra.{' '}
                  <Link href="/me/enderecos" className="underline">Cadastrar endereço</Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {addresses.map(a => (
                    <label
                      key={a.id}
                      className={`flex items-start gap-2 rounded-md border p-3 cursor-pointer ${selectedAddressId === a.id ? 'border-accent bg-accent/5' : 'border-border bg-card'}`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === a.id}
                        onChange={() => setSelectedAddressId(a.id)}
                        className="mt-1 h-4 w-4 accent-[hsl(var(--muted-foreground))]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">{a.label}</span>
                          {a.isDefault && <span className="text-[10px] text-accent">Padrão</span>}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {a.addressLine}{a.addressNumber ? `, ${a.addressNumber}` : ''} · {a.city}/{a.state} · CEP {formatCep(a.zip)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Per-seller groups */}
          {Array.from(itemsBySeller.entries()).map(([sellerId, groupItems]) => {
            const group = groups[sellerId];
            const { subtotal, shippingBuyerCost, sellerPaysShipping, insuranceCost, total } = computeGroup(sellerId);
            const seller = groupItems[0];
            return (
              <Card key={sellerId}>
                <CardContent className="p-4 space-y-4">
                  {/* Seller header */}
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <Link href={`/seller/${sellerId}`} className="text-sm font-semibold hover:text-accent">
                      {seller.sellerName}
                    </Link>
                    {seller.sellerVerified && <VerifiedBadge />}
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    {groupItems.map(it => (
                      <div key={it.id} className="flex items-start gap-3">
                        <div className="relative h-16 w-12 rounded overflow-hidden bg-secondary shrink-0">
                          {it.listing.images[0] ? (
                            <Image src={it.listing.images[0]} alt={it.cardBase.name} fill unoptimized className="object-cover" sizes="48px" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-xs opacity-30">🃏</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{it.cardBase.name}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {it.cardBase.set}{it.cardBase.number && it.cardBase.number !== '0' ? ` · #${it.cardBase.number}` : ''}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <GradeBadge grade={it.listing.grade} company={it.listing.gradeCompany} pristine={it.listing.pristine} />
                            <FlagIcon code={it.listing.language} />
                            {(() => {
                              const label = freeShippingLabel(it.listing.freeShippingPac, it.listing.freeShippingSedex);
                              return label && <span className="text-[10px] text-accent ml-1">{label}</span>;
                            })()}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold">R$ {formatPrice(it.listing.price)}</p>
                          <button
                            type="button"
                            onClick={() => handleRemove(it.id)}
                            disabled={removingId === it.id}
                            className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping options */}
                  <div className="border-t border-border pt-3 space-y-2">
                    <Label className="text-xs font-semibold">Forma de envio</Label>
                    {group?.loading ? (
                      <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Calculando...</p>
                    ) : group?.error ? (
                      <p className="text-xs text-destructive flex items-center gap-2"><AlertTriangle className="h-3 w-3" /> {group.error}</p>
                    ) : (group?.options ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhuma opção disponível.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {group!.options.map((opt, i) => {
                          const method = methodFromName(opt.name);
                          const firstItem = groupItems[0].listing;
                          const free = !!(method && ((method === 'PAC' && firstItem.freeShippingPac) || (method === 'SEDEX' && firstItem.freeShippingSedex)));
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-2 rounded-md border p-2.5 cursor-pointer text-sm ${group!.selectedIdx === i ? 'border-accent bg-accent/5' : 'border-border bg-card'}`}
                            >
                              <input
                                type="radio"
                                name={`shipping-${sellerId}`}
                                checked={group!.selectedIdx === i}
                                onChange={() => handleSelectShipping(sellerId, i)}
                                className="h-4 w-4 accent-[hsl(var(--muted-foreground))]"
                              />
                              <span className="flex-1 font-medium">{opt.name}{opt.deliveryDays ? <span className="text-[11px] text-muted-foreground"> · {opt.deliveryDays} dias úteis</span> : null}</span>
                              {free ? (
                                <span className="text-right">
                                  <span className="text-[11px] text-muted-foreground line-through block">R$ {formatPrice(opt.price)}</span>
                                  <span className="text-emerald-400 font-semibold">Grátis</span>
                                </span>
                              ) : (
                                <span className="font-semibold">R$ {formatPrice(opt.price)}</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Insurance toggle (per seller) */}
                  {group?.insuredOptions && (
                    <div className="rounded-md border border-border bg-card/40 p-3 space-y-2">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={group.insurance}
                          onChange={(e) => handleToggleInsurance(sellerId, e.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-[hsl(var(--muted-foreground))]"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Adicionar seguro contra perdas e danos</p>
                          <p className="text-[11px] text-muted-foreground">Cobertura calculada pelos Correios sobre o valor desta encomenda.</p>
                        </div>
                      </label>
                      {!group.insurance && (
                        <p className="text-[11px] text-amber-400 pl-6">
                          Sem o seguro, perdas ou danos durante o transporte desta encomenda não serão cobertos.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Per-seller total */}
                  <div className="border-t border-border pt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span><span>R$ {formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Frete</span>
                      {group?.selectedIdx !== null && group?.selectedIdx !== undefined ? (
                        sellerPaysShipping ? <span className="text-emerald-400">Grátis</span> : <span>R$ {formatPrice(shippingBuyerCost)}</span>
                      ) : <span>Selecione</span>}
                    </div>
                    {insuranceCost > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Seguro</span><span>R$ {formatPrice(insuranceCost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-1">
                      <span>Total deste vendedor</span><span>R$ {formatPrice(total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right sidebar — grand total */}
        <div className="lg:sticky lg:top-24 h-fit">
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold">Resumo do pedido</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Itens</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vendedores</span>
                <span>{itemsBySeller.size}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                <span>Total</span><span>R$ {formatPrice(grandTotal)}</span>
              </div>
              <Button className="w-full" disabled={!canCheckout || noAddresses || proceeding} onClick={handleProceed}>
                {proceeding ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processando...</> : 'Próximo passo'}
              </Button>
              {!canCheckout && !noAddresses && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Escolha o frete de cada vendedor para continuar.
                </p>
              )}
              {proceedError && (
                <p className="text-[11px] text-destructive text-center">{proceedError}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
