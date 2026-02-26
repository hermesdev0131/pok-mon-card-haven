'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, Truck, MessageCircle } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';

export default function Checkout() {
  return (
    <RequireAuth>
      <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Finalizar compra</h1>

      {/* Item summary */}
      <Card className="glass mb-6">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="h-20 w-16 rounded bg-secondary border border-white/[0.06] flex items-center justify-center text-3xl opacity-30">🃏</div>
          <div className="flex-1">
            <p className="font-semibold">Charizard VMAX PSA 10</p>
            <p className="text-sm text-muted-foreground">Vendedor: CardMaster BR</p>
          </div>
          <p className="text-xl font-bold text-accent">R$ 2.850</p>
        </CardContent>
      </Card>

      {/* Shipping */}
      <Card className="glass mb-6">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold">Calcular frete</h3>
          <div className="flex gap-2">
            <Input placeholder="CEP" maxLength={9} className="w-32" />
            <Button variant="outline" size="sm">Calcular</Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-white/[0.06] p-3 cursor-pointer hover:border-accent/40 transition-colors">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Sedex</p>
                  <p className="text-xs text-muted-foreground">3-5 dias úteis</p>
                </div>
              </div>
              <p className="font-semibold text-sm">R$ 28,90</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/[0.06] p-3 cursor-pointer hover:border-accent/40 transition-colors">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">PAC</p>
                  <p className="text-xs text-muted-foreground">7-12 dias úteis</p>
                </div>
              </div>
              <p className="font-semibold text-sm">R$ 18,50</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="glass mb-6">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>R$ 2.850,00</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frete</span>
            <span>R$ 28,90</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-accent">R$ 2.878,90</span>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" className="w-full mb-4 bg-accent text-accent-foreground hover:bg-accent/90 glow-accent">
        Pagar com Mercado Pago
      </Button>

      {/* Trust signals */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-accent shrink-0" />
          <span>Pagamento retido até confirmação do recebimento</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4 text-accent shrink-0" />
          <span>Suporte via WhatsApp em caso de problemas</span>
        </div>
      </div>
      </div>
    </RequireAuth>
  );
}
