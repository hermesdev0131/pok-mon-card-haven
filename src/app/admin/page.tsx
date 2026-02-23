"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { getOrders, getAllSellers } from '@/lib/api';
import { DollarSign, Package, Users, TrendingUp } from 'lucide-react';
import type { Order, Seller } from '@/types';

export default function Admin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);

  useEffect(() => {
    getOrders().then(setOrders);
    getAllSellers().then(setSellers);
  }, []);

  const stats = [
    { icon: DollarSign, label: 'Volume transacionado', value: `R$ ${orders.reduce((a, o) => a + o.price, 0).toLocaleString('pt-BR')}` },
    { icon: Package, label: 'Vendas concluídas', value: orders.filter(o => o.status === 'entregue').length },
    { icon: Users, label: 'Usuários', value: 42 },
    { icon: TrendingUp, label: 'Cartas ativas', value: 8 },
  ];

  return (
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
                    <TableCell className="font-mono text-xs">{order.id}</TableCell>
                    <TableCell className="text-sm">{order.cardName}</TableCell>
                    <TableCell className="text-sm">{order.buyerName}</TableCell>
                    <TableCell className="text-sm">{order.sellerName}</TableCell>
                    <TableCell className="font-semibold text-sm">R$ {order.price.toLocaleString('pt-BR')}</TableCell>
                    <TableCell><StatusPill status={order.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Detalhes</Button>
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
                      <Switch defaultChecked={seller.verified} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
