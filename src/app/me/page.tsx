"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusPill } from '@/components/StatusPill';
import { RequireAuth } from '@/components/RequireAuth';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getMyOrders } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, User, BadgeCheck } from 'lucide-react';
import type { Order } from '@/types';

export default function Profile() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user) getMyOrders().then(setOrders);
  }, [user]);

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
          </TabsList>
          <TabsContent value="purchases">
            <OrderList orders={purchases} />
          </TabsContent>
          <TabsContent value="sales">
            <OrderList orders={sales} />
          </TabsContent>
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
            <div className="text-right">
              <p className="font-semibold text-sm">R$ {formatPrice(order.price)}</p>
              <StatusPill status={order.status} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
