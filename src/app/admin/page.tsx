"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { getAllOrders, getAllSellers, updateSellerVerification } from '@/lib/api';
import { DollarSign, Package, Users, TrendingUp, Loader2 } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';
import type { Order, Seller } from '@/types';

// These are frontend-mapped OrderStatus values (from mapOrderStatus in api.ts)
const RELEASABLE_STATUSES = ['pago', 'enviado'];

export default function Admin() {
  const { tokenRefreshCount } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [confirmReleaseId, setConfirmReleaseId] = useState<string | null>(null);

  useEffect(() => {
    getAllOrders().then(setOrders);
    getAllSellers().then(setSellers);
  }, [tokenRefreshCount]);

  const handleRelease = async (orderId: string) => {
    setReleasingId(orderId);
    setConfirmReleaseId(null);
    try {
      const res = await fetch('/api/payment/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'entregue' as const } : o));
      }
    } finally {
      setReleasingId(null);
    }
  };

  const handleVerification = async (sellerId: string, verified: boolean) => {
    await updateSellerVerification(sellerId, verified);
    setSellers(prev => prev.map(s => s.id === sellerId ? { ...s, verified } : s));
  };

  const completedOrders = orders.filter(o => o.status === 'entregue');
  const stats = [
    { icon: DollarSign, label: 'Volume transacionado', value: `R$ ${formatPrice(orders.reduce((a, o) => a + o.price, 0))}` },
    { icon: Package, label: 'Vendas concluídas', value: completedOrders.length },
    { icon: Users, label: 'Vendedores', value: sellers.length },
    { icon: TrendingUp, label: 'Pedidos ativos', value: orders.filter(o => !['entregue', 'cancelado'].includes(o.status)).length },
  ];

  return (
    <RequireAuth role="admin">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Painel administrativo</h1>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map(({ icon: Icon, label, value }) => (
            <Card key={label} className="glass">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="sellers">Vendedores</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="border-border/50 mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Carta</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{order.cardName}</TableCell>
                      <TableCell className="text-sm">{order.buyerName}</TableCell>
                      <TableCell className="text-sm">{order.sellerName}</TableCell>
                      <TableCell className="font-semibold text-sm">R$ {formatPrice(order.price)}</TableCell>
                      <TableCell><StatusPill status={order.status} /></TableCell>
                      <TableCell className="text-right">
                        {RELEASABLE_STATUSES.includes(order.status) && (
                          confirmReleaseId === order.id ? (
                            <span className="inline-flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground/70">Liberar pagamento?</span>
                              <button
                                className="text-accent font-medium hover:underline disabled:opacity-50"
                                disabled={releasingId === order.id}
                                onClick={() => handleRelease(order.id)}
                              >
                                {releasingId === order.id
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : 'Sim'}
                              </button>
                              <span className="text-muted-foreground/30">·</span>
                              <button
                                className="text-muted-foreground/50 hover:text-muted-foreground"
                                onClick={() => setConfirmReleaseId(null)}
                              >
                                Não
                              </button>
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setConfirmReleaseId(order.id)}
                            >
                              Liberar
                            </Button>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="sellers">
            <Card className="border-border/50 mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Membro desde</TableHead>
                    <TableHead className="text-right">Verificado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellers.map(seller => (
                    <TableRow key={seller.id}>
                      <TableCell className="font-medium text-sm">{seller.name}</TableCell>
                      <TableCell className="text-sm">⭐ {seller.rating}</TableCell>
                      <TableCell className="text-sm">{seller.totalSales}</TableCell>
                      <TableCell className="text-sm">{new Date(seller.joinedAt).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={seller.verified}
                          onCheckedChange={(checked) => handleVerification(seller.id, checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RequireAuth>
  );
}
