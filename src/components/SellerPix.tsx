"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { getMyPix, saveMyPix, type SellerPix as SellerPixType } from '@/lib/api';

const keyTypeLabels: Record<string, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  phone: 'Telefone',
  random: 'Chave aleatória',
};

export function SellerPix() {
  const [pix, setPix] = useState<SellerPixType | null>(null);
  const [loading, setLoading] = useState(true);

  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<SellerPixType['pixKeyType']>('cpf');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const p = await getMyPix();
    setPix(p);
    if (p) {
      setPixKey(p.pixKey);
      setPixKeyType(p.pixKeyType);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!pixKey.trim()) {
      setError('Informe sua chave PIX');
      return;
    }
    setSubmitting(true);
    const result = await saveMyPix(pixKey.trim(), pixKeyType);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(pix ? 'Alteração enviada para análise.' : 'Chave PIX cadastrada com sucesso.');
    await refresh();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Status indicator */}
      {pix && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                {pix.status === 'active' ? (
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {pix.status === 'active' ? 'Chave PIX ativa' : 'Aguardando aprovação'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pix.status === 'active' ? (
                    <>Sua chave atual: <span className="text-foreground font-medium">{pix.pixKey}</span> ({keyTypeLabels[pix.pixKeyType]})</>
                  ) : (
                    <>Sua nova chave está em análise pelo administrador. A chave atual continua ativa até a aprovação.</>
                  )}
                </p>
                {pix.status === 'pending_approval' && pix.pendingPixKey && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Nova chave proposta: <span className="text-foreground font-medium">{pix.pendingPixKey}</span> ({pix.pendingPixKeyType ? keyTypeLabels[pix.pendingPixKeyType] : ''})
                  </p>
                )}
                {pix.rejectedReason && (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-destructive">
                      Motivo da rejeição anterior: {pix.rejectedReason}
                    </p>
                    {pix.rejectedPixKey && (
                      <p className="text-xs text-muted-foreground">
                        Chave rejeitada: <span className="text-foreground font-medium">{pix.rejectedPixKey}</span>
                        {pix.rejectedPixKeyType ? ` (${keyTypeLabels[pix.rejectedPixKeyType]})` : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PIX form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pix-key-type">Tipo de chave</Label>
          <Select value={pixKeyType} onValueChange={(v) => setPixKeyType(v as SellerPixType['pixKeyType'])}>
            <SelectTrigger id="pix-key-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpf">CPF</SelectItem>
              <SelectItem value="cnpj">CNPJ</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="phone">Telefone</SelectItem>
              <SelectItem value="random">Chave aleatória</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pix-key">Chave PIX</Label>
          <Input
            id="pix-key"
            type="text"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="Digite sua chave PIX"
          />
        </div>

        {pix && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50/50 border border-amber-200/50 p-3 text-xs">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              Alterações na chave PIX precisam ser aprovadas pelo administrador antes de serem usadas em saques. A chave atual continuará ativa enquanto a nova for revisada.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-accent">{success}</p>}

        <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando</> : (pix ? 'Solicitar alteração' : 'Cadastrar chave PIX')}
        </Button>
      </form>
    </div>
  );
}
