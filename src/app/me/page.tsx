"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusPill } from '@/components/StatusPill';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getOrders } from '@/lib/api';
import { Plus, User } from 'lucide-react';
import type { Order } from '@/types';

export default function Profile() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    getOrders().then(setOrders);
  }, []);

  const purchases = orders.filter(o => o.buyerId === 'u1' || o.buyerId === 'u2');
  const sales = orders.filter(o => o.sellerId === 's1');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">João M.</h1>
          <p className="text-sm text-muted-foreground">Comprador & Vendedor</p>
        </div>
        <Button size="sm" className="ml-auto gap-1" asChild>
          <Link href="/sell"><Plus className="h-4 w-4" /> Criar anúncio</Link>
        </Button>
      </div>

      <Tabs defaultValue="purchases">
        <TabsList>
          <TabsTrigger value="purchases">Minhas compras</TabsTrigger>
          <TabsTrigger value="sales">Minhas vendas</TabsTrigger>
        </TabsList>
        <TabsContent value="purchases">
          <OrderList orders={purchases} />
        </TabsContent>
        <TabsContent value="sales">
          <OrderList orders={sales} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrderList({ orders }: { orders: Order[] }) {
  if (!orders.length) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</p>;
  }
  return (
    <div className="space-y-3 mt-4">
      {orders.map(order => (
        <Card key={order.id} className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{order.cardName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {order.sellerName} · {new Date(order.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm">R$ {order.price.toLocaleString('pt-BR')}</p>
              <StatusPill status={order.status} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
