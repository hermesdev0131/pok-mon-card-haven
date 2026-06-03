"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, MapPin, Pencil, Trash2, Star, Loader2, Search, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type AddressInput,
} from '@/lib/api';
import { lookupCep } from '@/lib/viacep';
import { formatCep } from '@/lib/validators';
import type { Address } from '@/types';

export default function AddressesPageGuarded() {
  return (
    <RequireAuth>
      <AddressesPage />
    </RequireAuth>
  );
}

function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Address | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const list = await getMyAddresses();
    setAddresses(list);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusyId(confirmDelete.id);
    const result = await deleteAddress(confirmDelete.id);
    setBusyId(null);
    setConfirmDelete(null);
    if (result.success) refresh();
  };

  const handleSetDefault = async (a: Address) => {
    if (a.isDefault) return;
    setBusyId(a.id);
    const result = await setDefaultAddress(a.id);
    setBusyId(null);
    if (result.success) refresh();
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Endereços de entrega</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus endereços salvos para receber as cartas.</p>
        </div>
        <Button onClick={() => setCreating(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Adicionar
        </Button>
      </div>

      <div className="text-xs text-muted-foreground mb-4">
        <Link href="/me" className="hover:text-foreground">← Voltar para Minha Conta</Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <MapPin className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Você ainda não cadastrou nenhum endereço.</p>
            <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-2" /> Adicionar endereço</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => (
            <Card key={a.id} className={a.isDefault ? 'border-accent/30' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{a.label}</span>
                      {a.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/30 px-2 py-0.5 text-[10px] font-semibold text-accent">
                          <Star className="h-2.5 w-2.5 fill-accent" /> Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/80">{a.recipientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.addressLine}{a.addressNumber ? `, ${a.addressNumber}` : ''}
                      {a.complement ? ` — ${a.complement}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.neighborhood ? `${a.neighborhood} · ` : ''}{a.city} / {a.state} · CEP {formatCep(a.zip)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!a.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSetDefault(a)}
                        disabled={busyId === a.id}
                        title="Tornar padrão"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(a)} title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(a)}
                      title="Excluir"
                      disabled={busyId === a.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddressFormDialog
        open={creating || editing !== null}
        existing={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={() => { setCreating(false); setEditing(null); refresh(); }}
      />

      <Dialog open={confirmDelete !== null} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir endereço?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong>{confirmDelete?.label}</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busyId !== null}>
              {busyId ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Excluindo...</> : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Add/Edit form ───────────────────────────────────────────────────────────
interface AddressFormDialogProps {
  open: boolean;
  existing: Address | null;
  onClose: () => void;
  onSaved: () => void;
}

function AddressFormDialog({ open, existing, onClose, onSaved }: AddressFormDialogProps) {
  const [label, setLabel] = useState('');
  const [recipient, setRecipient] = useState('');
  const [cep, setCep] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepValid, setCepValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate when opening for edit or reset when opening for create.
  useEffect(() => {
    if (!open) return;
    if (existing) {
      setLabel(existing.label);
      setRecipient(existing.recipientName);
      setCep(formatCep(existing.zip));
      setAddressLine(existing.addressLine);
      setNumber(existing.addressNumber ?? '');
      setComplement(existing.complement ?? '');
      setNeighborhood(existing.neighborhood ?? '');
      setCity(existing.city);
      setState(existing.state);
      setIsDefault(existing.isDefault);
      setCepValid(existing.zip.replace(/\D/g, '').length === 8);
    } else {
      setLabel(''); setRecipient(''); setCep(''); setAddressLine('');
      setNumber(''); setComplement(''); setNeighborhood('');
      setCity(''); setState(''); setIsDefault(false); setCepValid(false);
    }
    setError(null);
  }, [open, existing]);

  const handleCepChange = async (v: string) => {
    const formatted = formatCep(v);
    setCep(formatted);
    const digits = v.replace(/\D/g, '');
    if (digits.length === 8) {
      setCepLoading(true);
      const result = await lookupCep(digits);
      setCepLoading(false);
      if (result) {
        setAddressLine(result.logradouro || '');
        setNeighborhood(result.bairro || '');
        setCity(result.localidade || '');
        setState(result.uf || '');
        setCepValid(true);
      } else {
        setCepValid(false);
        setError('CEP não encontrado');
      }
    } else {
      setCepValid(false);
    }
  };

  const canSubmit = label.trim() && recipient.trim() && cepValid && addressLine.trim() && number.trim() && city.trim() && state.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const payload: AddressInput = {
      label: label.trim(),
      recipientName: recipient.trim(),
      addressLine: addressLine.trim(),
      addressNumber: number.trim() || undefined,
      complement: complement.trim() || undefined,
      neighborhood: neighborhood.trim() || undefined,
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zip: cep,
      isDefault,
    };
    const result = existing
      ? await updateAddress(existing.id, payload)
      : await createAddress(payload);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? 'Editar endereço' : 'Novo endereço'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Apelido</Label>
              <Input placeholder="Casa, Trabalho..." value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Destinatário</Label>
              <Input placeholder="Nome completo" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">CEP</Label>
            <div className="relative">
              <Input
                placeholder="00000-000"
                value={cep}
                onChange={(e) => handleCepChange(e.target.value)}
                maxLength={9}
                className="pr-9"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {cepLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  : cepValid ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                  : <Search className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Endereço</Label>
              <Input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} disabled={!cepValid} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Número</Label>
              <Input value={number} onChange={(e) => setNumber(e.target.value)} disabled={!cepValid} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Complemento</Label>
              <Input value={complement} onChange={(e) => setComplement(e.target.value)} disabled={!cepValid} placeholder="Apto, bloco..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bairro</Label>
              <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} disabled={!cepValid} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Cidade</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} disabled={!cepValid} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">UF</Label>
              <Input value={state} onChange={(e) => setState(e.target.value.toUpperCase())} maxLength={2} disabled={!cepValid} />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 accent-[hsl(var(--muted-foreground))]"
            />
            <span className="text-sm">Definir como endereço padrão</span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
