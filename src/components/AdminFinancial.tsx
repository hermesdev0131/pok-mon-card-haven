"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Settings, ArrowDownToLine, KeyRound, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import {
  getAdminSettings,
  updateAdminSettings,
  getAdminPendingWithdrawals,
  processWithdrawal,
  getAdminPendingPixApprovals,
  processPixApproval,
  type AdminSettings,
  type AdminWithdrawal,
  type AdminPixApproval,
} from '@/lib/api';

const keyTypeLabels: Record<string, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  phone: 'Telefone',
  random: 'Chave aleatória',
};

export function AdminFinancial({ onChange }: { onChange?: () => void } = {}) {
  const [settings, setSettings] = useState<AdminSettings>({ defaultCommissionRate: 0.05, withdrawalFeeCentavos: 1000 });
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [pixApprovals, setPixApprovals] = useState<AdminPixApproval[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings form state
  const [commissionRateInput, setCommissionRateInput] = useState('5');
  const [withdrawalFeeInput, setWithdrawalFeeInput] = useState('10,00');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  // Reject dialogs
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState<AdminWithdrawal | null>(null);
  const [rejectingPix, setRejectingPix] = useState<AdminPixApproval | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    const [s, w, p] = await Promise.all([
      getAdminSettings(),
      getAdminPendingWithdrawals(),
      getAdminPendingPixApprovals(),
    ]);
    setSettings(s);
    setCommissionRateInput((s.defaultCommissionRate * 100).toString().replace('.', ','));
    setWithdrawalFeeInput((s.withdrawalFeeCentavos / 100).toFixed(2).replace('.', ','));
    setWithdrawals(w);
    setPixApprovals(p);
    setLoading(false);
    onChange?.();
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSaveSettings() {
    setSavingSettings(true);
    setSettingsMessage(null);
    const rate = parseFloat(commissionRateInput.replace(',', '.')) / 100;
    const fee = Math.round(parseFloat(withdrawalFeeInput.replace(',', '.')) * 100);
    if (isNaN(rate) || isNaN(fee) || rate < 0 || rate > 1 || fee < 0) {
      setSettingsMessage('Valores inválidos');
      setSavingSettings(false);
      return;
    }
    const result = await updateAdminSettings(rate, fee);
    setSavingSettings(false);
    if (result.success) {
      setSettingsMessage('Configurações salvas');
      await refresh();
    } else {
      setSettingsMessage(`Erro: ${result.error}`);
    }
  }

  async function handleCompleteWithdrawal(w: AdminWithdrawal) {
    setActionLoading(true);
    const result = await processWithdrawal(w.id, 'complete');
    setActionLoading(false);
    if (result.success) refresh();
  }

  async function handleRejectWithdrawal() {
    if (!rejectingWithdrawal) return;
    setActionLoading(true);
    const result = await processWithdrawal(rejectingWithdrawal.id, 'reject', rejectReason);
    setActionLoading(false);
    if (result.success) {
      setRejectingWithdrawal(null);
      setRejectReason('');
      refresh();
    }
  }

  async function handleApprovePix(p: AdminPixApproval) {
    setActionLoading(true);
    const result = await processPixApproval(p.sellerId, 'approve');
    setActionLoading(false);
    if (result.success) refresh();
  }

  async function handleRejectPix() {
    if (!rejectingPix) return;
    setActionLoading(true);
    const result = await processPixApproval(rejectingPix.sellerId, 'reject', rejectReason);
    setActionLoading(false);
    if (result.success) {
      setRejectingPix(null);
      setRejectReason('');
      refresh();
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-8">
      {/* Settings */}
      <section>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4" /> Configurações
        </h3>
        <Card>
          <CardContent className="p-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="commission-rate">Taxa de comissão padrão (%)</Label>
              <Input
                id="commission-rate"
                type="text"
                inputMode="decimal"
                value={commissionRateInput}
                onChange={(e) => setCommissionRateInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Aplicada em novos pedidos.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="withdrawal-fee">Taxa de saque (R$)</Label>
              <Input
                id="withdrawal-fee"
                type="text"
                inputMode="decimal"
                value={withdrawalFeeInput}
                onChange={(e) => setWithdrawalFeeInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Descontada do valor do saque.</p>
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <Button onClick={handleSaveSettings} disabled={savingSettings} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {savingSettings ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando</> : 'Salvar configurações'}
              </Button>
              {settingsMessage && <span className="text-sm text-muted-foreground">{settingsMessage}</span>}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Pending Withdrawals */}
      <section>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <ArrowDownToLine className="h-4 w-4" /> Saques pendentes
          {withdrawals.length > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
              {withdrawals.length}
            </span>
          )}
        </h3>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum saque pendente.</p>
        ) : (
          <div className="space-y-2">
            {withdrawals.map(w => (
              <Card key={w.id}>
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{w.sellerName}</p>
                    <p className="text-xs text-muted-foreground">
                      Solicitado em {new Date(w.requestedAtISO).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PIX ({keyTypeLabels[w.pixKeyType]}): <span className="text-foreground font-medium">{w.pixKey}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">R$ {formatPrice(w.amountPaidCentavos)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Solicitado R$ {formatPrice(w.amountRequestedCentavos)} − taxa R$ {formatPrice(w.feeCentavos)}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setRejectingWithdrawal(w); setRejectReason(''); }}
                      disabled={actionLoading}
                      className="gap-1"
                    >
                      <XCircle className="h-4 w-4" /> Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCompleteWithdrawal(w)}
                      disabled={actionLoading}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Marcar como pago
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* PIX Approvals */}
      <section>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4" /> Aprovações PIX
          {pixApprovals.length > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
              {pixApprovals.length}
            </span>
          )}
        </h3>
        {pixApprovals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma alteração pendente.</p>
        ) : (
          <div className="space-y-2">
            {pixApprovals.map(p => (
              <Card key={p.sellerId}>
                <CardContent className="p-4 flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{p.sellerName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Atual ({keyTypeLabels[p.currentPixKeyType]}): <span className="text-foreground">{p.currentPixKey}</span>
                    </p>
                    <p className="text-xs mt-0.5">
                      <span className="text-muted-foreground">Nova ({keyTypeLabels[p.pendingPixKeyType]}):</span>{' '}
                      <span className="text-accent font-medium">{p.pendingPixKey}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setRejectingPix(p); setRejectReason(''); }}
                      disabled={actionLoading}
                      className="gap-1"
                    >
                      <XCircle className="h-4 w-4" /> Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprovePix(p)}
                      disabled={actionLoading}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Aprovar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Reject withdrawal dialog */}
      <Dialog open={!!rejectingWithdrawal} onOpenChange={(open) => { if (!open) setRejectingWithdrawal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar saque</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Motivo (opcional)</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Ex: dados PIX inválidos" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingWithdrawal(null)}>Cancelar</Button>
            <Button onClick={handleRejectWithdrawal} disabled={actionLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject PIX dialog */}
      <Dialog open={!!rejectingPix} onOpenChange={(open) => { if (!open) setRejectingPix(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar alteração de PIX</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Motivo (opcional, será mostrado ao vendedor)</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Ex: chave inválida ou suspeita" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingPix(null)}>Cancelar</Button>
            <Button onClick={handleRejectPix} disabled={actionLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
