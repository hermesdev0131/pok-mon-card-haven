"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Wallet, Clock, ArrowDownToLine, Loader2, CheckCircle2, XCircle, AlertCircle, TrendingUp, FileText, Award } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { TierBadge } from '@/components/TierBadge';
import {
  getMyBalance,
  getMyBalanceTransactions,
  getMyWithdrawals,
  getMyPix,
  getAdminSettings,
  requestWithdrawal,
  getWithdrawalReceiptUrl,
  getMyTierProgress,
  type SellerBalance as SellerBalanceType,
  type BalanceTransaction,
  type Withdrawal,
  type SellerPix,
  type AdminSettings,
  type MyTierProgress,
} from '@/lib/api';

const statusLabels: Record<string, string> = {
  payment_confirmed: 'Pago',
  awaiting_shipment: 'Aguardando envio',
  shipped: 'Enviado',
  delivered: 'Entregue',
  completed: 'Concluído',
};

export function SellerBalance() {
  const [balance, setBalance] = useState<SellerBalanceType>({ availableCentavos: 0, pendingCentavos: 0 });
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [pix, setPix] = useState<SellerPix | null>(null);
  const [settings, setSettings] = useState<AdminSettings>({ withdrawalFeeCentavos: 1000 });
  const [tierProgress, setTierProgress] = useState<MyTierProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  async function refresh() {
    setLoading(true);
    const [b, t, w, p, s, tp] = await Promise.all([
      getMyBalance(),
      getMyBalanceTransactions(),
      getMyWithdrawals(),
      getMyPix(),
      getAdminSettings(),
      getMyTierProgress(),
    ]);
    setBalance(b);
    setTransactions(t);
    setWithdrawals(w);
    setPix(p);
    setSettings(s);
    setTierProgress(tp);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const canWithdraw =
    balance.availableCentavos > settings.withdrawalFeeCentavos &&
    pix !== null &&
    pix.status === 'active';

  // Lifetime aggregate from transactions (paid/shipped/delivered/completed orders)
  const totalEarnedCentavos = transactions.reduce((sum, t) => sum + t.sellerPayoutCentavos, 0);

  const blockReason = !pix
    ? 'Cadastre sua chave PIX antes de solicitar um saque.'
    : pix.status === 'pending_approval'
      ? 'Sua chave PIX está em análise. Aguarde a aprovação para solicitar saque.'
      : balance.availableCentavos <= settings.withdrawalFeeCentavos
        ? `Saldo disponível menor ou igual à taxa de saque (R$ ${formatPrice(settings.withdrawalFeeCentavos)}).`
        : null;

  async function handleSubmitWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawError(null);
    const reaisToCentavos = (v: string) => Math.round(parseFloat(v.replace(',', '.')) * 100);
    const amountCentavos = reaisToCentavos(withdrawAmount);
    if (!amountCentavos || isNaN(amountCentavos)) {
      setWithdrawError('Informe um valor válido');
      return;
    }
    setWithdrawSubmitting(true);
    const result = await requestWithdrawal(amountCentavos);
    setWithdrawSubmitting(false);
    if (!result.success) {
      setWithdrawError(result.error);
      return;
    }
    setWithdrawOpen(false);
    setWithdrawAmount('');
    await refresh();
  }

  return (
    <div className="space-y-6">
      {/* Balance summary cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
                <Wallet className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Disponível</p>
                <p className="text-[10px] text-muted-foreground">Pronto para saque</p>
              </div>
            </div>
            <p className="text-3xl font-bold">R$ {formatPrice(balance.availableCentavos)}</p>
            <Button
              size="sm"
              className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              disabled={!canWithdraw}
              onClick={() => setWithdrawOpen(true)}
            >
              <ArrowDownToLine className="h-4 w-4" /> Solicitar saque
            </Button>
            {blockReason && (
              <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{blockReason}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted ring-1 ring-border">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Pendente</p>
                <p className="text-[10px] text-muted-foreground">Aguardando confirmação de entrega</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-muted-foreground">R$ {formatPrice(balance.pendingCentavos)}</p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Valor referente a vendas pagas que ainda não foram concluídas. Será liberado após a confirmação de recebimento.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lifetime aggregate + Tier progression */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary border border-border">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Ganho</p>
                <p className="text-[10px] text-muted-foreground">Receita líquida acumulada de todas as vendas</p>
              </div>
            </div>
            <p className="text-xl font-bold">R$ {formatPrice(totalEarnedCentavos)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary border border-border">
                <Award className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-muted-foreground">Seu tier atual</p>
                  {tierProgress && <TierBadge name={tierProgress.currentTier.name} locked={tierProgress.locked} />}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Trimestre {Math.floor(new Date().getMonth() / 3) + 1} de {new Date().getFullYear()}
                </p>
              </div>
            </div>
            {tierProgress ? (
              tierProgress.locked ? (
                <p className="text-sm text-muted-foreground">
                  Sua comissão atual é de {tierProgress.currentTier.commissionRate.toFixed(2).replace('.', ',')}%. Tier fixado pelo administrador.
                </p>
              ) : tierProgress.nextTier ? (
                <>
                  <p className="text-sm">
                    Você está a <span className="font-bold text-foreground">R$ {formatPrice(tierProgress.toNextTierCentavos)}</span> de atingir o tier <span className="font-semibold">{tierProgress.nextTier.name}</span> e reduzir sua comissão de {tierProgress.currentTier.commissionRate.toFixed(2).replace('.', ',')}% para {tierProgress.nextTier.commissionRate.toFixed(2).replace('.', ',')}%.
                  </p>
                  {tierProgress.nextTier.minQuarterlyCentavos > 0 && (
                    <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-accent transition-[width]"
                        style={{ width: `${Math.min(100, Math.round((tierProgress.quarterVolumeCentavos / tierProgress.nextTier.minQuarterlyCentavos) * 100))}%` }}
                      />
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Vendido neste trimestre: R$ {formatPrice(tierProgress.quarterVolumeCentavos)} de R$ {formatPrice(tierProgress.nextTier.minQuarterlyCentavos)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm">
                    Você atingiu o tier máximo. Sua comissão é de <span className="font-bold">{tierProgress.currentTier.commissionRate.toFixed(2).replace('.', ',')}%</span>.
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Vendido neste trimestre: R$ {formatPrice(tierProgress.quarterVolumeCentavos)} (mínimo R$ {formatPrice(tierProgress.currentTier.minQuarterlyCentavos)} para manter {tierProgress.currentTier.name})
                  </p>
                </>
              )
            ) : (
              <p className="text-sm text-muted-foreground">Carregando tier...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3">Histórico de saques</h3>
          <div className="space-y-2">
            {withdrawals.map(w => (
              <div key={w.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                <div className="shrink-0">
                  {w.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-accent" />}
                  {w.status === 'pending' && <Clock className="h-5 w-5 text-muted-foreground" />}
                  {w.status === 'rejected' && <XCircle className="h-5 w-5 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    R$ {formatPrice(w.amountPaidCentavos)}
                    <span className="text-xs text-muted-foreground font-normal ml-2">
                      (taxa R$ {formatPrice(w.feeCentavos)})
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(w.requestedAtISO).toLocaleDateString('pt-BR')} ·{' '}
                    {w.status === 'completed' ? 'Pago' : w.status === 'pending' ? 'Em processamento' : 'Rejeitado'}
                    {w.rejectedReason ? ` · ${w.rejectedReason}` : ''}
                  </p>
                </div>
                {w.status === 'completed' && w.receiptPath && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 shrink-0"
                    onClick={async () => {
                      const url = await getWithdrawalReceiptUrl(w.receiptPath!);
                      if (url) window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <FileText className="h-4 w-4" /> Ver comprovante
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction breakdown */}
      <div>
        <h3 className="text-base font-semibold mb-3">Detalhamento por venda</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não tem vendas.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(t => (
              <div key={t.orderId} className="p-3 rounded-lg bg-card border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{t.cardName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.saleDateISO).toLocaleDateString('pt-BR')} · {statusLabels[t.status] ?? t.status}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">R$ {formatPrice(t.sellerPayoutCentavos)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Venda R$ {formatPrice(t.priceCentavos)} − comissão R$ {formatPrice(t.platformFeeCentavos)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal request modal */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar saque</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="withdraw-amount">Valor (R$)</Label>
              <Input
                id="withdraw-amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Saldo disponível: R$ {formatPrice(balance.availableCentavos)}
              </p>
            </div>

            <div className="rounded-lg bg-secondary border border-border p-3 space-y-1.5 text-xs">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Taxa de saque:</span>
                <span className="font-medium">R$ {formatPrice(settings.withdrawalFeeCentavos)}</span>
              </p>
              {withdrawAmount && !isNaN(parseFloat(withdrawAmount.replace(',', '.'))) && (
                <p className="flex justify-between font-medium pt-1.5 border-t border-border">
                  <span>Você receberá:</span>
                  <span className="text-accent">
                    R$ {formatPrice(Math.max(0, Math.round(parseFloat(withdrawAmount.replace(',', '.')) * 100) - settings.withdrawalFeeCentavos))}
                  </span>
                </p>
              )}
            </div>

            {pix && (
              <div className="text-xs text-muted-foreground">
                Saque será enviado para a chave PIX cadastrada ({pix.pixKeyType}): <span className="text-foreground font-medium">{pix.pixKey}</span>
              </div>
            )}

            {withdrawError && (
              <p className="text-sm text-destructive">{withdrawError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWithdrawOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={withdrawSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {withdrawSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando</> : 'Solicitar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
