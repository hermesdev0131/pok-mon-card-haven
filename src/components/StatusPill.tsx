import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  aguardando_pagamento: { label: 'Aguardando pagamento', className: 'bg-warning/10 text-warning border-warning/20' },
  pago: { label: 'Pago', className: 'bg-accent/10 text-accent border-accent/20' },
  enviado: { label: 'Enviado', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  entregue: { label: 'Entregue', className: 'bg-accent/10 text-accent border-accent/20' },
  disputa: { label: 'Em disputa', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  cancelado: { label: 'Cancelado', className: 'bg-muted/50 text-muted-foreground border-border' },
};

export function StatusPill({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}
