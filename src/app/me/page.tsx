"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/StatusPill';
import { RequireAuth } from '@/components/RequireAuth';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getMyOrders, getMyListings, cancelListing, updateListing } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, User, BadgeCheck, Loader2 } from 'lucide-react';
import type { Order, Listing, CardBase } from '@/types';

export default function Profile() {
  const { user, profile, isSeller } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [myListings, setMyListings] = useState<(Listing & { cardBase: CardBase })[]>([]);

  useEffect(() => {
    if (user) {
      getMyOrders().then(setOrders);
      if (isSeller) getMyListings().then(setMyListings);
    }
  }, [user, isSeller]);

  const purchases = orders.filter(o => o.buyerId === user?.id);
  const sales = orders.filter(o => o.sellerId === user?.id);

  const displayName = profile?.full_name ?? 'Usuário';
  const roleLine = sales.length > 0 ? 'Comprador & Vendedor' : 'Comprador';

  return (
    <RequireAuth>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full bg-secondary border border-white/[0.06] flex items-center justify-center">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{roleLine}</p>
          </div>
          <Button size="sm" className="ml-auto gap-1 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
            <Link href="/sell"><Plus className="h-4 w-4" /> Criar anúncio</Link>
          </Button>
        </div>

        {/* Verified seller CTA */}
        <Link
          href="/como-funciona#selo-verificado"
          className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-accent/[0.04] border border-accent/10 hover:border-accent/25 hover:bg-accent/[0.07] transition-all duration-200"
        >
          <BadgeCheck className="h-5 w-5 text-accent shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Quer o selo verificado?</p>
            <p className="text-xs text-muted-foreground">Saiba como se tornar um vendedor verificado no GradedBR</p>
          </div>
          <span className="text-xs text-accent font-medium shrink-0">Saiba mais &rarr;</span>
        </Link>

        <Tabs defaultValue="purchases">
          <TabsList>
            <TabsTrigger value="purchases">Minhas compras</TabsTrigger>
            <TabsTrigger value="sales">Minhas vendas</TabsTrigger>
            {isSeller && <TabsTrigger value="listings">Meus anúncios</TabsTrigger>}
          </TabsList>
          <TabsContent value="purchases">
            <OrderList orders={purchases} />
          </TabsContent>
          <TabsContent value="sales">
            <OrderList orders={sales} />
          </TabsContent>
          {isSeller && (
            <TabsContent value="listings">
              <MyListingsList
                listings={myListings}
                onCancel={async (id) => {
                  await cancelListing(id);
                  setMyListings(prev => prev.filter(l => l.id !== id));
                }}
                onPriceUpdate={async (id, newPrice) => {
                  await updateListing(id, { price: newPrice });
                  setMyListings(prev => prev.map(l => l.id === id ? { ...l, price: newPrice } : l));
                }}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </RequireAuth>
  );
}

function OrderList({ orders }: { orders: Order[] }) {
  if (!orders.length) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</p>;
  }
  return (
    <div className="space-y-3 mt-4">
      {orders.map(order => (
        <Card key={order.id} className="glass">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{order.cardName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {order.sellerName} · {new Date(order.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold text-sm">R$ {formatPrice(order.price)}</p>
                <StatusPill status={order.status} />
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/checkout/${order.id}`}>Ver pedido</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MyListingsList({
  listings,
  onCancel,
  onPriceUpdate,
}: {
  listings: (Listing & { cardBase: CardBase })[];
  onCancel: (id: string) => Promise<void>;
  onPriceUpdate: (id: string, newPrice: number) => Promise<void>;
}) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<(Listing & { cardBase: CardBase }) | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);

  if (!listings.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhum anúncio ativo.{' '}
        <Link href="/sell" className="text-accent hover:underline">Criar anúncio</Link>
      </p>
    );
  }

  const handleEditOpen = (listing: Listing & { cardBase: CardBase }) => {
    setEditingListing(listing);
    setEditPrice((listing.price / 100).toFixed(2));
  };

  const handleSavePrice = async () => {
    if (!editingListing || !editPrice) return;
    setSaving(true);
    await onPriceUpdate(editingListing.id, Math.round(Number(editPrice) * 100));
    setSaving(false);
    setEditingListing(null);
  };

  return (
    <>
      <div className="space-y-3 mt-4">
        {listings.map(listing => (
          <Card key={listing.id} className="glass">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {listing.cardBase.name} — {listing.gradeCompany} {listing.grade}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  R$ {formatPrice(listing.price)}
                  {listing.freeShipping && ' · Frete grátis'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-xs">
                  {listing.status === 'active' ? 'Ativo' : 'Reservado'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleEditOpen(listing)}
                  disabled={listing.status !== 'active'}
                >
                  Editar preço
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-destructive"
                  disabled={cancellingId === listing.id || listing.status !== 'active'}
                  onClick={async () => {
                    if (!confirm('Cancelar este anúncio?')) return;
                    setCancellingId(listing.id);
                    await onCancel(listing.id);
                    setCancellingId(null);
                  }}
                >
                  {cancellingId === listing.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : 'Cancelar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit price dialog */}
      <Dialog open={!!editingListing} onOpenChange={(open) => !open && setEditingListing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Editar preço</DialogTitle>
          </DialogHeader>
          {editingListing && (
            <p className="text-sm text-muted-foreground">
              {editingListing.cardBase.name} — {editingListing.gradeCompany} {editingListing.grade}
            </p>
          )}
          <div className="space-y-2 py-2">
            <Label>Novo preço (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingListing(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSavePrice} disabled={!editPrice || Number(editPrice) <= 0 || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
