"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect, useMemo } from 'react';
import { getAllOrders, getAllSellers, updateSellerVerification } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { DollarSign, Package, Users, TrendingUp, Loader2, Search } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/Pagination';
import { formatPrice } from '@/lib/utils';
import type { Order, Seller } from '@/types';

// These are frontend-mapped OrderStatus values (from mapOrderStatus in api.ts)
const RELEASABLE_STATUSES = ['pago', 'enviado', 'entregue'];

export default function Admin() {
  const { tokenRefreshCount } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [confirmReleaseId, setConfirmReleaseId] = useState<string | null>(null);

  // Orders filter
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      result = result.filter(o =>
        o.cardName.toLowerCase().includes(q) || o.buyerName.toLowerCase().includes(q) || o.sellerName.toLowerCase().includes(q) || o.id.toLowerCase().startsWith(q)
      );
    }
    if (orderStatusFilter !== 'all') result = result.filter(o => o.status === orderStatusFilter);
    return result;
  }, [orders, orderSearch, orderStatusFilter]);

  // Sellers filter
  const [sellerSearch, setSellerSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const filteredSellers = useMemo(() => {
    let result = sellers;
    if (sellerSearch.trim()) {
      const q = sellerSearch.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }
    if (verifiedFilter === 'verified') result = result.filter(s => s.verified);
    else if (verifiedFilter === 'unverified') result = result.filter(s => !s.verified);
    return result;
  }, [sellers, sellerSearch, verifiedFilter]);

  const { page: ordersPage, setPage: setOrdersPage, totalPages: ordersTotalPages, paged: pagedOrders, total: ordersTotal, pageSize: ordersPageSize, setPageSize: setOrdersPageSize } = usePagination(filteredOrders, 10);
  const { page: sellersPage, setPage: setSellersPage, totalPages: sellersTotalPages, paged: pagedSellers, total: sellersTotal, pageSize: sellersPageSize, setPageSize: setSellersPageSize } = usePagination(filteredSellers, 10);

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
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'concluido' as const } : o));
      }
    } finally {
      setReleasingId(null);
    }
  };

  const handleVerification = async (sellerId: string, verified: boolean) => {
    await updateSellerVerification(sellerId, verified);
    setSellers(prev => prev.map(s => s.id === sellerId ? { ...s, verified } : s));
  };

  const completedOrders = orders.filter(o => o.status === 'concluido');
  const stats = [
    { icon: DollarSign, label: 'Volume transacionado', value: `R$ ${formatPrice(orders.reduce((a, o) => a + o.price, 0))}` },
    { icon: Package, label: 'Vendas concluídas', value: completedOrders.length },
    { icon: Users, label: 'Vendedores', value: sellers.length },
    { icon: TrendingUp, label: 'Pedidos ativos', value: orders.filter(o => !['concluido', 'cancelado'].includes(o.status)).length },
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
            <div className="flex gap-2 mt-4 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por carta, comprador, vendedor..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex rounded-lg border border-white/[0.08] overflow-hidden shrink-0">
                {([['all', 'Todos'], ['aguardando_pagamento', 'Aguardando'], ['pago', 'Pago'], ['enviado', 'Enviado'], ['entregue', 'Entregue'], ['concluido', 'Concluído'], ['disputa', 'Disputa'], ['cancelado', 'Cancelado']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setOrderStatusFilter(val)}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${orderStatusFilter === val ? 'bg-accent text-accent-foreground' : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Card className="border-border/50">
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
                  {pagedOrders.map(order => (
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
              <div className="p-2">
                <Pagination page={ordersPage} totalPages={ordersTotalPages} onPageChange={setOrdersPage} total={ordersTotal} pageSize={ordersPageSize} onPageSizeChange={setOrdersPageSize} />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="sellers">
            <div className="flex gap-2 mt-4 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar vendedor..." value={sellerSearch} onChange={e => setSellerSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex rounded-lg border border-white/[0.08] overflow-hidden shrink-0">
                {([['all', 'Todos'], ['verified', 'Verificados'], ['unverified', 'Não verificados']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setVerifiedFilter(val)}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${verifiedFilter === val ? 'bg-accent text-accent-foreground' : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Card className="border-border/50">
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
                  {pagedSellers.map(seller => (
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
              <div className="p-2">
                <Pagination page={sellersPage} totalPages={sellersTotalPages} onPageChange={setSellersPage} total={sellersTotal} pageSize={sellersPageSize} onPageSizeChange={setSellersPageSize} />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RequireAuth>
  );
}
