import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  aguardando_pagamento: { label: 'Aguardando pagamento', className: 'bg-warning/15 text-warning border-warning/30' },
  pago: { label: 'Pago', className: 'bg-success/15 text-success border-success/30' },
  enviado: { label: 'Enviado', className: 'bg-primary/15 text-primary border-primary/30' },
  entregue: { label: 'Entregue', className: 'bg-success/15 text-success border-success/30' },
  disputa: { label: 'Em disputa', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  cancelado: { label: 'Cancelado', className: 'bg-muted text-muted-foreground border-border' },
};

export function StatusPill({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}
