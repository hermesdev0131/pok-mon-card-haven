"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, CheckCircle, Lock, ExternalLink, ShieldCheck, User, Building2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile, NICKNAME_COOLDOWN_DAYS } from '@/lib/api';
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
  const [showCpfChangeInfo, setShowCpfChangeInfo] = useState(false);
  const [showCnpjChangeInfo, setShowCnpjChangeInfo] = useState(false);

  const isBusinessAccount = profile?.account_type === 'business';

  // Nickname cooldown calculation
  const nicknameDaysLeft = (() => {
    if (!profile?.nickname_changed_at) return 0;
    const lastChange = new Date(profile.nickname_changed_at).getTime();
    const cooldownMs = NICKNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - lastChange;
    if (elapsed >= cooldownMs) return 0;
    return Math.ceil((cooldownMs - elapsed) / (24 * 60 * 60 * 1000));
  })();
  const nicknameLocked = nicknameDaysLeft > 0;

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
      setAddressLine('');
      setCity('');
      setState('');
      setAddressNumber('');
      setAddressComplement('');
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
      setAddressLine('');
      setCity('');
      setState('');
      setAddressNumber('');
      setAddressComplement('');
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
          <Label htmlFor="nickname" className="flex items-center gap-1.5">
            Apelido (nome público)
            {nicknameLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
          </Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="Como você será visto no marketplace"
            disabled={nicknameLocked}
            className={nicknameLocked ? 'bg-muted/50 cursor-not-allowed' : ''}
          />
          {nicknameLocked ? (
            <p className="text-xs text-muted-foreground">
              Você poderá alterar o apelido novamente em <strong className="text-foreground">{nicknameDaysLeft} dia{nicknameDaysLeft > 1 ? 's' : ''}</strong>.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              O apelido pode ser alterado a cada {NICKNAME_COOLDOWN_DAYS} dias.
            </p>
          )}
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
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">CPF <Lock className="h-3.5 w-3.5 text-muted-foreground" /></Label>
              <button
                type="button"
                onClick={() => setShowCpfChangeInfo(!showCpfChangeInfo)}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                {showCpfChangeInfo ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Solicitar alteração
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-sm text-muted-foreground">CPF cadastrado e protegido</span>
            </div>
            {showCpfChangeInfo && (
              <div className="flex items-start gap-2 rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                <p>
                  Para corrigir seu CPF, é necessário enviar justificativa e cópia de documento que comprove a alteração para{' '}
                  <a href="mailto:gradedbr@gmail.com" className="text-accent hover:underline">gradedbr@gmail.com</a>.
                </p>
              </div>
            )}
          </div>
        )}

        {profile?.cnpj && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">CNPJ <Lock className="h-3.5 w-3.5 text-muted-foreground" /></Label>
              <button
                type="button"
                onClick={() => setShowCnpjChangeInfo(!showCnpjChangeInfo)}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                {showCnpjChangeInfo ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Solicitar alteração
              </button>
            </div>
            <Input value={formatCNPJ(profile.cnpj)} readOnly className="bg-muted/50" />
            {showCnpjChangeInfo && (
              <div className="flex items-start gap-2 rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                <p>
                  Para corrigir seu CNPJ, é necessário enviar justificativa e cópia de documento que comprove a alteração para{' '}
                  <a href="mailto:gradedbr@gmail.com" className="text-accent hover:underline">gradedbr@gmail.com</a>.
                </p>
              </div>
            )}
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
