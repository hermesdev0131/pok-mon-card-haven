"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, CheckCircle, Lock, ExternalLink, ShieldCheck, User, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/lib/api';
import { lookupCep } from '@/lib/viacep';
import { formatCep, formatPhone, formatCNPJ, validateNickname } from '@/lib/validators';
import { createClient } from '@/lib/supabase/client';

export function AccountSettings() {
  const { profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepValid, setCepValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isBusinessAccount = profile?.account_type === 'business';

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setNickname(profile.nickname || '');
      setPhone(profile.phone ? formatPhone(profile.phone) : '');
      setCep(profile.address_zip ? formatCep(profile.address_zip) : '');
      setAddressLine(profile.address_line || '');
      setAddressNumber(profile.address_number || '');
      setAddressComplement(profile.address_complement || '');
      setCity(profile.address_city || '');
      setState(profile.address_state || '');
      if (profile.address_zip && profile.address_city && profile.address_state) {
        setCepValid(true);
      }
    }
  }, [profile]);

  const handleCepLookup = async (cleanCep: string) => {
    if (cleanCep.length !== 8) {
      setError('CEP deve ter 8 dígitos');
      return;
    }
    setCepLoading(true);
    setError(null);
    setCepValid(false);
    const result = await lookupCep(cleanCep);
    setCepLoading(false);
    if (!result) {
      setError('CEP não encontrado. Verifique o número e tente novamente.');
      setCity('');
      setState('');
      setAddressLine('');
      return;
    }
    setAddressLine(result.logradouro || '');
    setCity(result.localidade || '');
    setState(result.uf || '');
    setCepValid(true);
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setCep(formatted);
    const clean = value.replace(/\D/g, '');
    if (clean.length < 8) {
      setCepValid(false);
      setCity('');
      setState('');
      setAddressLine('');
    }
    if (clean.length === 8) {
      handleCepLookup(clean);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError(isBusinessAccount ? 'Razão Social é obrigatória' : 'Nome completo é obrigatório');
      return;
    }
    if (nickname.trim()) {
      const nickResult = validateNickname(nickname);
      if (!nickResult.valid) {
        setError(nickResult.error!);
        return;
      }
      if (nickname.trim() !== (profile?.nickname || '')) {
        const supabase = createClient();
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('nickname', nickname.trim())
          .neq('id', profile?.id ?? '')
          .maybeSingle();
        if (existing) {
          setError('Este apelido já está em uso.');
          return;
        }
      }
    }
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length > 0 && cleanCep.length !== 8) {
      setError('CEP deve ter 8 dígitos');
      return;
    }
    if (cleanCep.length === 8 && !cepValid) {
      setError('CEP inválido. Busque um CEP válido antes de salvar.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateProfile({
      full_name: fullName.trim(),
      nickname: nickname.trim() || undefined,
      phone: phone.replace(/\D/g, '') || undefined,
      address_zip: cleanCep || undefined,
      address_line: addressLine.trim() || undefined,
      address_number: addressNumber.trim() || undefined,
      address_complement: addressComplement.trim() || undefined,
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
        <CardTitle className="text-lg flex items-center gap-2">
          Minha conta
          {isBusinessAccount ? (
            <span className="text-xs font-normal text-muted-foreground flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Pessoa Jurídica</span>
          ) : (
            <span className="text-xs font-normal text-muted-foreground flex items-center gap-1"><User className="h-3.5 w-3.5" /> Pessoa Física</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nickname">Apelido (nome público)</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="Como você será visto no marketplace"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">{isBusinessAccount ? 'Razão Social' : 'Nome completo'}</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder={isBusinessAccount ? 'Nome da empresa' : 'Seu nome completo'}
          />
        </div>

        {profile?.cpf_hash && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">CPF <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /></Label>
            <p className="text-sm text-muted-foreground">CPF cadastrado</p>
          </div>
        )}

        {profile?.cnpj && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">CNPJ <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /></Label>
            <Input value={formatCNPJ(profile.cnpj)} readOnly className="bg-muted/50" />
          </div>
        )}

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
              onClick={() => handleCepLookup(cep.replace(/\D/g, ''))}
              disabled={cepLoading}
              className="shrink-0"
            >
              {cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <a
            href="https://buscacepinter.correios.com.br/app/endereco/index.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            Não sabe seu CEP? Consulte nos Correios <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="space-y-2">
          <Label htmlFor="addressLine">Rua / Endereço</Label>
          <Input
            id="addressLine"
            value={addressLine}
            onChange={e => setAddressLine(e.target.value)}
            placeholder={cepValid ? "Endereço" : "Preencha o CEP primeiro"}
            disabled={!cepValid && cep.replace(/\D/g, '').length === 0}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1 space-y-2">
            <Label htmlFor="addressNumber">Número</Label>
            <Input
              id="addressNumber"
              value={addressNumber}
              onChange={e => setAddressNumber(e.target.value)}
              placeholder="Nº"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="addressComplement">Complemento</Label>
            <Input
              id="addressComplement"
              value={addressComplement}
              onChange={e => setAddressComplement(e.target.value)}
              placeholder="Apto, bloco, sala..."
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="city" className="flex items-center gap-1">
              Cidade {cepValid && <Lock className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <Input
              id="city"
              value={city}
              readOnly
              disabled
              placeholder="Preenchido pelo CEP"
              className={cepValid ? "bg-muted cursor-not-allowed" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state" className="flex items-center gap-1">
              Estado {cepValid && <Lock className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <Input
              id="state"
              value={state}
              readOnly
              disabled
              placeholder="UF"
              maxLength={2}
              className={cepValid ? "bg-muted cursor-not-allowed" : ""}
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
