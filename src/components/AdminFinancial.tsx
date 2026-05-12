"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Settings, ArrowDownToLine, KeyRound, CheckCircle2, XCircle, Loader2, History, Paperclip, FileText, Award, Users } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { TierBadge } from '@/components/TierBadge';
import {
  getAdminSettings,
  updateAdminSettings,
  getAdminPendingWithdrawals,
  getAdminWithdrawalHistory,
  processWithdrawal,
  getAdminPendingPixApprovals,
  getAdminPixApprovalHistory,
  processPixApproval,
  uploadWithdrawalReceipt,
  getWithdrawalReceiptUrl,
  getSellerTiers,
  getAdminSellersWithTiers,
  setSellerTier,
  updateTierDefinition,
  type AdminSettings,
  type AdminWithdrawal,
  type AdminPixApproval,
  type AdminPixApprovalHistoryEntry,
  type SellerTier,
  type AdminSellerWithTier,
} from '@/lib/api';

const keyTypeLabels: Record<string, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  phone: 'Telefone',
  random: 'Chave aleatória',
};

export function AdminFinancial({ onChange }: { onChange?: () => void } = {}) {
  const [settings, setSettings] = useState<AdminSettings>({ withdrawalFeeCentavos: 1000 });
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<AdminWithdrawal[]>([]);
  const [pixApprovals, setPixApprovals] = useState<AdminPixApproval[]>([]);
  const [pixHistory, setPixHistory] = useState<AdminPixApprovalHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings form state
  const [withdrawalFeeInput, setWithdrawalFeeInput] = useState('10,00');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  // Reject dialogs
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState<AdminWithdrawal | null>(null);
  const [rejectingPix, setRejectingPix] = useState<AdminPixApproval | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Mark-as-paid dialog (with optional receipt)
  const [completingWithdrawal, setCompletingWithdrawal] = useState<AdminWithdrawal | null>(null);
  const [completeReceiptFile, setCompleteReceiptFile] = useState<File | null>(null);

  // Retroactive receipt upload
  const [attachingReceiptFor, setAttachingReceiptFor] = useState<AdminWithdrawal | null>(null);
  const [attachReceiptFile, setAttachReceiptFile] = useState<File | null>(null);

  // Tier system
  const [tiers, setTiers] = useState<SellerTier[]>([]);
  const [sellersWithTiers, setSellersWithTiers] = useState<AdminSellerWithTier[]>([]);
  const [tierEdits, setTierEdits] = useState<Record<string, { rate: string; threshold: string }>>({});
  const [savingTier, setSavingTier] = useState<string | null>(null);
  const [tierSaveMessage, setTierSaveMessage] = useState<string | null>(null);
  const [showBelowThresholdOnly, setShowBelowThresholdOnly] = useState(false);

  async function refresh() {
    setLoading(true);
    const [s, w, p, wh, ph, tl, swt] = await Promise.all([
      getAdminSettings(),
      getAdminPendingWithdrawals(),
      getAdminPendingPixApprovals(),
      getAdminWithdrawalHistory(),
      getAdminPixApprovalHistory(),
      getSellerTiers(),
      getAdminSellersWithTiers(),
    ]);
    setSettings(s);
    setWithdrawalFeeInput((s.withdrawalFeeCentavos / 100).toFixed(2).replace('.', ','));
    setWithdrawals(w);
    setPixApprovals(p);
    setWithdrawalHistory(wh);
    setPixHistory(ph);
    setTiers(tl);
    setSellersWithTiers(swt);
    setTierEdits(Object.fromEntries(tl.map(t => [t.id, {
      rate: t.commissionRate.toFixed(2).replace('.', ','),
      threshold: (t.minQuarterlyCentavos / 100).toFixed(2).replace('.', ','),
    }])));
    setLoading(false);
    onChange?.();
  }

  async function handleSaveTierDefinition(tierId: string) {
    const edit = tierEdits[tierId];
    if (!edit) return;
    const rate = parseFloat(edit.rate.replace(',', '.'));
    const thresholdReais = parseFloat(edit.threshold.replace(',', '.'));
    if (isNaN(rate) || rate < 0 || rate > 100 || isNaN(thresholdReais) || thresholdReais < 0) {
      setTierSaveMessage('Valores inválidos');
      return;
    }
    setSavingTier(tierId);
    setTierSaveMessage(null);
    const result = await updateTierDefinition(tierId, rate, Math.round(thresholdReais * 100));
    setSavingTier(null);
    if (result.success) {
      setTierSaveMessage('Tier atualizado');
      refresh();
    } else {
      setTierSaveMessage(`Erro: ${result.error}`);
    }
  }

  async function handleAssignTier(sellerId: string, tierId: string, locked: boolean) {
    const result = await setSellerTier(sellerId, tierId, locked);
    if (result.success) refresh();
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSaveSettings() {
    setSavingSettings(true);
    setSettingsMessage(null);
    const fee = Math.round(parseFloat(withdrawalFeeInput.replace(',', '.')) * 100);
    if (isNaN(fee) || fee < 0) {
      setSettingsMessage('Valor inválido');
      setSavingSettings(false);
      return;
    }
    const result = await updateAdminSettings(fee);
    setSavingSettings(false);
    if (result.success) {
      setSettingsMessage('Configurações salvas');
      await refresh();
    } else {
      setSettingsMessage(`Erro: ${result.error}`);
    }
  }

  async function handleConfirmComplete() {
    if (!completingWithdrawal) return;
    setActionLoading(true);
    const result = await processWithdrawal(completingWithdrawal.id, 'complete', undefined, completeReceiptFile);
    setActionLoading(false);
    if (result.success) {
      setCompletingWithdrawal(null);
      setCompleteReceiptFile(null);
      refresh();
    }
  }

  async function handleAttachReceipt() {
    if (!attachingReceiptFor || !attachReceiptFile) return;
    setActionLoading(true);
    const result = await uploadWithdrawalReceipt(attachingReceiptFor.id, attachReceiptFile);
    setActionLoading(false);
    if (result.success) {
      setAttachingReceiptFor(null);
      setAttachReceiptFile(null);
      refresh();
    }
  }

  async function openReceipt(receiptPath: string) {
    const url = await getWithdrawalReceiptUrl(receiptPath);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
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
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5 max-w-xs">
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
            <div className="flex items-center gap-3">
              <Button onClick={handleSaveSettings} disabled={savingSettings} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {savingSettings ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando</> : 'Salvar configurações'}
              </Button>
              {settingsMessage && <span className="text-sm text-muted-foreground">{settingsMessage}</span>}
            </div>
            <p className="text-xs text-muted-foreground">A taxa de comissão é definida pelo tier de cada vendedor (ver seção abaixo).</p>
          </CardContent>
        </Card>
      </section>

      {/* Tier Definitions */}
      <section>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Award className="h-4 w-4" /> Definições de tiers
        </h3>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr_auto] gap-3 items-end">
              <div className="hidden sm:block text-xs font-semibold text-muted-foreground">Tier</div>
              <div className="hidden sm:block text-xs font-semibold text-muted-foreground">Comissão (%)</div>
              <div className="hidden sm:block text-xs font-semibold text-muted-foreground">Volume mínimo trimestral (R$)</div>
              <div></div>
              {tiers.map(t => (
                <div key={t.id} className="contents">
                  <div className="flex items-center"><TierBadge name={t.name} size="md" /></div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={tierEdits[t.id]?.rate ?? ''}
                    onChange={(e) => setTierEdits(prev => ({ ...prev, [t.id]: { ...prev[t.id], rate: e.target.value } }))}
                  />
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={tierEdits[t.id]?.threshold ?? ''}
                    onChange={(e) => setTierEdits(prev => ({ ...prev, [t.id]: { ...prev[t.id], threshold: e.target.value } }))}
                    disabled={t.name === 'Bronze'}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSaveTierDefinition(t.id)}
                    disabled={savingTier === t.id}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {savingTier === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                  </Button>
                </div>
              ))}
            </div>
            {tierSaveMessage && <p className="text-xs text-muted-foreground">{tierSaveMessage}</p>}
            <p className="text-xs text-muted-foreground">
              Promoções são imediatas: assim que o vendedor atinge o volume do próximo tier no trimestre, a nova taxa passa a valer. Rebaixamentos são avaliados ao final de cada trimestre.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Sellers and Tiers */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" /> Vendedores e tiers
          </h3>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={showBelowThresholdOnly}
              onChange={(e) => setShowBelowThresholdOnly(e.target.checked)}
            />
            Somente abaixo do mínimo do tier atual (para revisão de fim de trimestre)
          </label>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Mudanças manuais podem ser sobrescritas por promoções automáticas no próximo pedido concluído. Para tornar permanente, marque também <span className="font-medium">Fixar tier</span>.
        </p>
        {sellersWithTiers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum vendedor cadastrado.</p>
        ) : (
          (() => {
            const filtered = showBelowThresholdOnly
              ? sellersWithTiers.filter(s => s.quarterVolumeCentavos < s.tier.minQuarterlyCentavos && !s.tierLocked)
              : sellersWithTiers;
            if (filtered.length === 0) {
              return <p className="text-sm text-muted-foreground">Nenhum vendedor abaixo do mínimo do tier atual.</p>;
            }
            return (
              <div className="space-y-2">
                {filtered.map(s => {
                  const belowThreshold = s.quarterVolumeCentavos < s.tier.minQuarterlyCentavos && !s.tierLocked && s.tier.minQuarterlyCentavos > 0;
                  return (
                    <Card key={s.sellerId} className={cn(belowThreshold && 'border-destructive/40')}>
                      <CardContent className="p-4 flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{s.storeName}</p>
                            <TierBadge name={s.tier.name} locked={s.tierLocked} />
                            {belowThreshold && (
                              <span className="text-[10px] font-semibold text-destructive">Abaixo do mínimo</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Vendido neste trimestre: <span className="text-foreground font-medium">R$ {formatPrice(s.quarterVolumeCentavos)}</span>
                            {s.tier.minQuarterlyCentavos > 0 && <> de R$ {formatPrice(s.tier.minQuarterlyCentavos)} (mínimo {s.tier.name})</>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <select
                            className={cn('h-9 rounded-md border border-input bg-background px-3 text-sm')}
                            value={s.tier.id}
                            onChange={(e) => handleAssignTier(s.sellerId, e.target.value, s.tierLocked)}
                          >
                            {tiers.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                            <input
                              type="checkbox"
                              checked={s.tierLocked}
                              onChange={(e) => handleAssignTier(s.sellerId, s.tier.id, e.target.checked)}
                            />
                            Fixar tier
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })()
        )}
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
                      onClick={() => { setCompletingWithdrawal(w); setCompleteReceiptFile(null); }}
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

      {/* Withdrawal History */}
      <section>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <History className="h-4 w-4" /> Histórico de saques
        </h3>
        {withdrawalHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum saque processado ainda.</p>
        ) : (
          <div className="space-y-2">
            {withdrawalHistory.map(w => (
              <Card key={w.id}>
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{w.sellerName}</p>
                      {w.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
                          <CheckCircle2 className="h-3 w-3" /> Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
                          <XCircle className="h-3 w-3" /> Rejeitado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Solicitado em {new Date(w.requestedAtISO).toLocaleDateString('pt-BR')}
                      {w.processedAtISO && <> · processado em {new Date(w.processedAtISO).toLocaleDateString('pt-BR')}</>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PIX ({keyTypeLabels[w.pixKeyType]}): <span className="text-foreground font-medium">{w.pixKey}</span>
                    </p>
                    {w.status === 'rejected' && w.rejectedReason && (
                      <p className="text-xs text-destructive mt-1">Motivo: {w.rejectedReason}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">R$ {formatPrice(w.amountPaidCentavos)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Solicitado R$ {formatPrice(w.amountRequestedCentavos)} − taxa R$ {formatPrice(w.feeCentavos)}
                    </p>
                  </div>
                  {w.status === 'completed' && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      {w.receiptPath ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReceipt(w.receiptPath!)}
                            className="gap-1"
                          >
                            <FileText className="h-4 w-4" /> Ver comprovante
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setAttachingReceiptFor(w); setAttachReceiptFile(null); }}
                            className="gap-1"
                          >
                            <Paperclip className="h-4 w-4" /> Substituir
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setAttachingReceiptFor(w); setAttachReceiptFile(null); }}
                          className="gap-1"
                        >
                          <Paperclip className="h-4 w-4" /> Anexar comprovante
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* PIX Approval History */}
      <section>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <History className="h-4 w-4" /> Histórico de aprovações PIX
        </h3>
        {pixHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma aprovação registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {pixHistory.map(h => (
              <Card key={h.id}>
                <CardContent className="p-4 flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{h.sellerName}</p>
                      {h.decision === 'approved' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
                          <CheckCircle2 className="h-3 w-3" /> Aprovado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
                          <XCircle className="h-3 w-3" /> Rejeitado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(h.decidedAtISO).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs mt-1">
                      <span className="text-muted-foreground">Chave proposta ({keyTypeLabels[h.proposedPixKeyType]}):</span>{' '}
                      <span className="text-foreground font-medium">{h.proposedPixKey}</span>
                    </p>
                    {h.decision === 'rejected' && h.rejectedReason && (
                      <p className="text-xs text-destructive mt-1">Motivo: {h.rejectedReason}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Mark-as-paid dialog (with optional receipt) */}
      <Dialog open={!!completingWithdrawal} onOpenChange={(open) => { if (!open) { setCompletingWithdrawal(null); setCompleteReceiptFile(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar saque como pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {completingWithdrawal && (
              <div className="text-xs text-muted-foreground">
                <p><span className="text-foreground font-medium">{completingWithdrawal.sellerName}</span> · R$ {formatPrice(completingWithdrawal.amountPaidCentavos)}</p>
                <p>PIX ({keyTypeLabels[completingWithdrawal.pixKeyType]}): <span className="text-foreground">{completingWithdrawal.pixKey}</span></p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="receipt-file">Comprovante (opcional)</Label>
              <Input
                id="receipt-file"
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={(e) => setCompleteReceiptFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-[11px] text-muted-foreground">PDF, JPG ou PNG. Pode ser anexado depois.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCompletingWithdrawal(null); setCompleteReceiptFile(null); }}>Cancelar</Button>
            <Button onClick={handleConfirmComplete} disabled={actionLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {actionLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando</> : 'Confirmar pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach-receipt dialog (retroactive) */}
      <Dialog open={!!attachingReceiptFor} onOpenChange={(open) => { if (!open) { setAttachingReceiptFor(null); setAttachReceiptFile(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{attachingReceiptFor?.receiptPath ? 'Substituir comprovante' : 'Anexar comprovante'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="attach-receipt-file">Arquivo</Label>
              <Input
                id="attach-receipt-file"
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={(e) => setAttachReceiptFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-[11px] text-muted-foreground">PDF, JPG ou PNG.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAttachingReceiptFor(null); setAttachReceiptFile(null); }}>Cancelar</Button>
            <Button onClick={handleAttachReceipt} disabled={actionLoading || !attachReceiptFile} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {actionLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando</> : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
