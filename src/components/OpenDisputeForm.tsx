"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { openDispute } from '@/lib/api';

const BUYER_REASONS = [
  { value: 'Item não recebido', label: 'Item não recebido' },
  { value: 'Item diferente do anunciado', label: 'Item diferente do anunciado' },
  { value: 'Item danificado', label: 'Item danificado' },
  { value: 'Outro', label: 'Outro' },
];

const SELLER_REASONS = [
  { value: 'Comprador alega não recebido mas rastreio confirma entrega', label: 'Comprador alega não recebido mas rastreio confirma entrega' },
  { value: 'Comprador solicitou estorno indevido', label: 'Comprador solicitou estorno indevido' },
  { value: 'Comprador não responde', label: 'Comprador não responde' },
  { value: 'Outro', label: 'Outro' },
];

interface OpenDisputeFormProps {
  orderId: string;
  role?: 'buyer' | 'seller';
  onDisputeOpened?: () => void;
}

export function OpenDisputeForm({ orderId, role = 'buyer', onDisputeOpened }: OpenDisputeFormProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);

  const handleSubmit = async () => {
    if (!reason || submitting) return;

    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await openDispute(orderId, reason, description.trim() || undefined);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      setConfirmStep(false);
      return;
    }

    setOpen(false);
    setReason('');
    setDescription('');
    setConfirmStep(false);
    onDisputeOpened?.();
  };

  const handleClose = () => {
    setOpen(false);
    setReason('');
    setDescription('');
    setConfirmStep(false);
    setError(null);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
        Abrir disputa
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Abrir disputa
            </DialogTitle>
          </DialogHeader>

          {confirmStep ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">Tem certeza?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ao abrir uma disputa, o pedido será marcado como &quot;em disputa&quot; e nossa equipe analisará o caso.
                </p>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Motivo:</span> {reason}</p>
                {description && <p><span className="font-medium">Descrição:</span> {description}</p>}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Motivo</label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(role === 'seller' ? SELLER_REASONS : BUYER_REASONS).map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Descrição (opcional)</label>
                <Textarea
                  placeholder="Descreva o problema com mais detalhes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!reason || submitting}
              onClick={handleSubmit}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {confirmStep ? 'Confirmar disputa' : 'Continuar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
