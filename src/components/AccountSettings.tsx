"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/lib/api';
import { lookupCep } from '@/lib/viacep';

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function AccountSettings() {
  const { profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone ? formatPhone(profile.phone) : '');
      setCep(profile.address_zip ? formatCep(profile.address_zip) : '');
      setAddressLine(profile.address_line || '');
      setCity(profile.address_city || '');
      setState(profile.address_state || '');
    }
  }, [profile]);

  const handleCepLookup = async () => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) {
      setError('CEP deve ter 8 dígitos');
      return;
    }
    setCepLoading(true);
    setError(null);
    const result = await lookupCep(clean);
    setCepLoading(false);
    if (!result) {
      setError('CEP não encontrado');
      return;
    }
    setAddressLine(result.logradouro || '');
    setCity(result.localidade || '');
    setState(result.uf || '');
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setCep(formatted);
    // Auto-lookup when 8 digits entered
    const clean = value.replace(/\D/g, '');
    if (clean.length === 8) {
      setCepLoading(true);
      setError(null);
      lookupCep(clean).then(result => {
        setCepLoading(false);
        if (result) {
          setAddressLine(result.logradouro || '');
          setCity(result.localidade || '');
          setState(result.uf || '');
        }
      });
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError('Nome completo é obrigatório');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.replace(/\D/g, '') || undefined,
      address_zip: cep.replace(/\D/g, '') || undefined,
      address_line: addressLine.trim() || undefined,
      address_city: city.trim() || undefined,
      address_state: state.trim().toUpperCase() || undefined,
    });

    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    await refreshProfile();
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-lg">Minha conta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Seu nome completo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={e => setPhone(formatPhone(e.target.value))}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <div className="flex gap-2">
            <Input
              id="cep"
              value={cep}
              onChange={e => handleCepChange(e.target.value)}
              placeholder="00000-000"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCepLookup}
              disabled={cepLoading}
              className="shrink-0"
            >
              {cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="addressLine">Rua / Endereço</Label>
          <Input
            id="addressLine"
            value={addressLine}
            onChange={e => setAddressLine(e.target.value)}
            placeholder="Rua, número, complemento"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Cidade"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              value={state}
              onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="UF"
              maxLength={2}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <p className="text-sm text-emerald-400 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" /> Salvo com sucesso!
          </p>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Salvar alterações
        </Button>
      </CardContent>
    </Card>
  );
}
