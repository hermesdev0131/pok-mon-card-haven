'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { lookupCep } from '@/lib/viacep';
import { lookupCnpj } from '@/lib/brasilapi';
import {
  validateCPF, formatCPF, hashCPF,
  validateCNPJ, formatCNPJ,
  checkNickname, validateNickname,
  checkPassword,
  formatPhone, formatCep,
} from '@/lib/validators';
import { useDebounce } from '@/hooks/useDebounce';
import { RequirementChecklist } from '@/components/RequirementChecklist';
import { Loader2, Lock, ChevronRight, ChevronLeft, User, Building2, Check, X } from 'lucide-react';

type AccountType = 'individual' | 'business';
type CheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const STEPS = ['Tipo', 'Conta', 'Dados', 'Endereço'];

export default function Register() {
  const [step, setStep] = useState(0);
  // Step 0
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  // Step 1
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Step 2
  const [nickname, setNickname] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  // Step 3
  const [cep, setCep] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [city, setCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepLocked, setCepLocked] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);

  // Async check status
  const [emailStatus, setEmailStatus] = useState<CheckStatus>('idle');
  const [nicknameStatus, setNicknameStatus] = useState<CheckStatus>('idle');
  const [cpfStatus, setCpfStatus] = useState<CheckStatus>('idle');
  const [cnpjStatus, setCnpjStatus] = useState<CheckStatus>('idle');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  // Debounced values for async checks
  const debouncedEmail = useDebounce(email, 600);
  const debouncedNickname = useDebounce(nickname, 600);
  const debouncedCpf = useDebounce(cpf, 600);
  const debouncedCnpj = useDebounce(cnpj, 600);

  // Local validation state (computed, not async)
  const passwordChecks = useMemo(() => checkPassword(password), [password]);
  const nicknameChecks = useMemo(() => checkNickname(nickname), [nickname]);
  const passwordValid = passwordChecks.length && passwordChecks.uppercase && passwordChecks.number && passwordChecks.special;
  const nicknameLocalValid = nicknameChecks.length && nicknameChecks.noSpaces && nicknameChecks.validChars;

  // Email format check
  const emailFormatValid = /\S+@\S+\.\S+/.test(email);
  const emailsMatch = email && confirmEmail && email.trim().toLowerCase() === confirmEmail.trim().toLowerCase();
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  // ----- ASYNC CHECKS -----

  // Email availability check
  useEffect(() => {
    if (!debouncedEmail || !/\S+@\S+\.\S+/.test(debouncedEmail)) {
      setEmailStatus('idle');
      return;
    }
    let cancelled = false;
    setEmailStatus('checking');
    fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: debouncedEmail }),
    })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.error) setEmailStatus('idle');
        else setEmailStatus(data.exists ? 'taken' : 'available');
      })
      .catch(() => { if (!cancelled) setEmailStatus('idle'); });
    return () => { cancelled = true; };
  }, [debouncedEmail]);

  // Nickname availability check
  useEffect(() => {
    if (!debouncedNickname || !nicknameLocalValid) {
      setNicknameStatus('idle');
      return;
    }
    let cancelled = false;
    setNicknameStatus('checking');
    const supabase = createClient();
    supabase
      .from('profiles')
      .select('id')
      .eq('nickname', debouncedNickname.trim())
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setNicknameStatus(data ? 'taken' : 'available');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNickname, nicknameLocalValid]);

  // CPF availability check
  useEffect(() => {
    if (!debouncedCpf) {
      setCpfStatus('idle');
      return;
    }
    if (!validateCPF(debouncedCpf)) {
      setCpfStatus('invalid');
      return;
    }
    let cancelled = false;
    setCpfStatus('checking');
    (async () => {
      const cpfHash = await hashCPF(debouncedCpf);
      if (cancelled) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('cpf_hash', cpfHash)
        .maybeSingle();
      if (cancelled) return;
      setCpfStatus(data ? 'taken' : 'available');
    })();
    return () => { cancelled = true; };
  }, [debouncedCpf]);

  // CNPJ availability check + auto-fill from BrasilAPI
  useEffect(() => {
    if (!debouncedCnpj) {
      setCnpjStatus('idle');
      return;
    }
    if (!validateCNPJ(debouncedCnpj)) {
      setCnpjStatus('invalid');
      return;
    }
    let cancelled = false;
    setCnpjStatus('checking');
    (async () => {
      const cnpjClean = debouncedCnpj.replace(/\D/g, '');
      // First check if CNPJ already exists in our database
      const supabase = createClient();
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('cnpj', cnpjClean)
        .maybeSingle();
      if (cancelled) return;
      if (existing) {
        setCnpjStatus('taken');
        return;
      }
      // CNPJ is available — fetch company data from BrasilAPI for auto-fill
      const company = await lookupCnpj(cnpjClean);
      if (cancelled) return;
      if (company) {
        if (company.razao_social) setRazaoSocial(company.razao_social);
        if (company.ddd_telefone_1) setPhone(formatPhone(company.ddd_telefone_1));
        if (company.cep) {
          const formattedCep = formatCep(company.cep);
          setCep(formattedCep);
          if (company.logradouro) setAddressLine(company.logradouro);
          if (company.numero) setAddressNumber(company.numero);
          if (company.complemento) setAddressComplement(company.complemento);
          if (company.municipio) setCity(company.municipio);
          if (company.uf) setAddressState(company.uf);
          setCepLocked(true);
        }
      }
      setCnpjStatus('available');
    })();
    return () => { cancelled = true; };
  }, [debouncedCnpj]);

  // ----- VALIDATION -----

  function validateStep0(): string | null {
    if (!accountType) return 'Selecione o tipo de conta.';
    return null;
  }

  function validateStep1(): string | null {
    if (!email.trim()) return 'E-mail é obrigatório.';
    if (!emailFormatValid) return 'E-mail inválido.';
    if (emailStatus === 'taken') return 'Este e-mail já está cadastrado.';
    if (emailStatus === 'checking') return 'Verificando e-mail, aguarde...';
    if (!emailsMatch) return 'Os e-mails não coincidem.';
    if (!passwordValid) return 'A senha não atende aos requisitos.';
    if (!passwordsMatch) return 'As senhas não coincidem.';
    return null;
  }

  function validateStep2(): string | null {
    if (!nicknameLocalValid) return validateNickname(nickname).error || 'Apelido inválido.';
    if (nicknameStatus === 'taken') return 'Este apelido já está em uso.';
    if (nicknameStatus === 'checking') return 'Verificando apelido, aguarde...';
    if (accountType === 'individual') {
      if (!fullName.trim()) return 'Nome completo é obrigatório.';
      if (!validateCPF(cpf)) return 'CPF inválido.';
      if (cpfStatus === 'taken') return 'Este CPF já está cadastrado.';
      if (cpfStatus === 'checking') return 'Verificando CPF, aguarde...';
    } else {
      if (!razaoSocial.trim()) return 'Razão Social é obrigatória.';
      if (!validateCNPJ(cnpj)) return 'CNPJ inválido.';
      if (cnpjStatus === 'taken') return 'Este CNPJ já está cadastrado.';
      if (cnpjStatus === 'checking') return 'Verificando CNPJ, aguarde...';
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) return 'Telefone inválido.';
    return null;
  }

  function validateStep3(): string | null {
    if (!cep.trim()) return 'CEP é obrigatório.';
    if (cep.replace(/\D/g, '').length !== 8) return 'CEP incompleto.';
    if (!cepLocked) return 'CEP inválido ou não encontrado.';
    if (!addressLine.trim()) return 'Endereço é obrigatório.';
    if (!addressNumber.trim()) return 'Número é obrigatório.';
    if (!terms) return 'Você precisa aceitar os termos de uso.';
    return null;
  }

  function handleNext() {
    const validators = [validateStep0, validateStep1, validateStep2, validateStep3];
    const err = validators[step]();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep(step + 1);
  }

  async function handleCepChange(value: string) {
    const formatted = formatCep(value);
    setCep(formatted);
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 8) {
      setCepLoading(true);
      const result = await lookupCep(digits);
      if (result) {
        setAddressLine(result.logradouro);
        setCity(result.localidade);
        setAddressState(result.uf);
        setCepLocked(true);
        setCepError(null);
        setError(null); // clear stale form error
      } else {
        setCepLocked(false);
        setCepError('CEP não encontrado');
        setAddressLine('');
        setCity('');
        setAddressState('');
        setAddressNumber('');
        setAddressComplement('');
      }
      setCepLoading(false);
    } else {
      setCepLocked(false);
      setCepError(null);
      setAddressLine('');
      setCity('');
      setAddressState('');
      setAddressNumber('');
      setAddressComplement('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateStep3();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (accountType === 'individual') {
        const cpfHash = await hashCPF(cpf);
        const { error } = await signUp(email, password, {
          account_type: 'individual',
          full_name: fullName.trim(),
          nickname: nickname.trim(),
          cpf_hash: cpfHash,
          phone: phone.replace(/\D/g, ''),
          address_zip: cep.replace(/\D/g, ''),
          address_line: addressLine.trim(),
          address_number: addressNumber.trim(),
          address_complement: addressComplement.trim() || null,
          address_city: city.trim(),
          address_state: addressState.trim().toUpperCase(),
        });
        if (error) { setError(error); setLoading(false); return; }
      } else {
        const { error } = await signUp(email, password, {
          account_type: 'business',
          full_name: razaoSocial.trim(),
          nickname: nickname.trim(),
          cnpj: cnpj.replace(/\D/g, ''),
          razao_social: razaoSocial.trim(),
          phone: phone.replace(/\D/g, ''),
          address_zip: cep.replace(/\D/g, ''),
          address_line: addressLine.trim(),
          address_number: addressNumber.trim(),
          address_complement: addressComplement.trim() || null,
          address_city: city.trim(),
          address_state: addressState.trim().toUpperCase(),
        });
        if (error) { setError(error); setLoading(false); return; }
      }

      setSuccess(true);
    } catch {
      setError('Erro inesperado. Tente novamente.');
    }
    setLoading(false);
  }

  // ----- HELPERS -----

  function StatusIcon({ status }: { status: CheckStatus }) {
    if (status === 'checking') return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (status === 'available') return <Check className="h-4 w-4 text-emerald-400" />;
    if (status === 'taken' || status === 'invalid') return <X className="h-4 w-4 text-destructive" />;
    return null;
  }

  function FieldError({ message }: { message: string | null }) {
    if (!message) return null;
    return <p className="text-xs text-destructive mt-1">{message}</p>;
  }

  // ----- SUCCESS SCREEN -----

  if (success) {
    return (
      <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md">
          <Card className="relative glass glow-accent">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Conta criada!</CardTitle>
              <CardDescription>Verifique seu e-mail para confirmar a conta.</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Enviamos um link de confirmação para <strong className="text-foreground">{email}</strong>
              </p>
              <Button onClick={() => router.push('/login')} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Ir para o login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-lg">
        <div className="blob blob-accent w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
        <Card className="relative glass glow-accent">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Criar sua conta</CardTitle>
            <CardDescription>Comece a comprar e vender no GradedBR</CardDescription>
            {/* Step indicators */}
            <div className="flex items-center justify-center gap-1.5 pt-3">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`flex items-center gap-1 text-xs font-medium ${i <= step ? 'text-accent' : 'text-muted-foreground'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${i < step ? 'bg-accent text-accent-foreground border-accent' : i === step ? 'border-accent text-accent' : 'border-muted-foreground/40 text-muted-foreground'}`}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span className="hidden sm:inline text-[11px]">{label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`w-6 h-px ${i < step ? 'bg-accent' : 'bg-muted-foreground/30'}`} />}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" noValidate>
              {/* Step 0: Account type */}
              {step === 0 && (
                <div key="step-0" className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setAccountType('individual'); setError(null); }}
                    className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all ${accountType === 'individual' ? 'border-accent bg-accent/10 text-accent' : 'border-muted-foreground/20 hover:border-muted-foreground/40 text-muted-foreground'}`}
                  >
                    <User className="h-8 w-8" />
                    <div className="text-center">
                      <p className="font-semibold text-sm">Pessoa Física</p>
                      <p className="text-xs mt-1 opacity-70">Conta pessoal</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAccountType('business'); setError(null); }}
                    className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all ${accountType === 'business' ? 'border-accent bg-accent/10 text-accent' : 'border-muted-foreground/20 hover:border-muted-foreground/40 text-muted-foreground'}`}
                  >
                    <Building2 className="h-8 w-8" />
                    <div className="text-center">
                      <p className="font-semibold text-sm">Pessoa Jurídica</p>
                      <p className="text-xs mt-1 opacity-70">Conta empresarial</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Step 1: Conta */}
              {step === 1 && (
                <div key="step-1" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" className="pr-10" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <StatusIcon status={emailStatus} />
                      </div>
                    </div>
                    {email && !emailFormatValid && <FieldError message="Formato de e-mail inválido" />}
                    {emailStatus === 'taken' && <FieldError message="Este e-mail já está cadastrado" />}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail">Confirmar e-mail</Label>
                    <div className="relative">
                      <Input id="confirmEmail" type="email" placeholder="Repita o e-mail" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required autoComplete="off" className="pr-10" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <StatusIcon status={confirmEmail ? (emailsMatch ? 'available' : 'taken') : 'idle'} />
                      </div>
                    </div>
                    {confirmEmail && !emailsMatch && <FieldError message="Os e-mails não coincidem" />}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" type="password" placeholder="Crie uma senha forte" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                    <RequirementChecklist
                      requirements={[
                        { label: 'Ao menos 10 caracteres', met: passwordChecks.length },
                        { label: 'Ao menos 1 letra maiúscula (A-Z)', met: passwordChecks.uppercase },
                        { label: 'Ao menos 1 número (0-9)', met: passwordChecks.number },
                        { label: 'Ao menos 1 caractere especial (!@#$...)', met: passwordChecks.special },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar senha</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type="password" placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className="pr-10" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <StatusIcon status={confirmPassword ? (passwordsMatch ? 'available' : 'taken') : 'idle'} />
                      </div>
                    </div>
                    {confirmPassword && !passwordsMatch && <FieldError message="As senhas não coincidem" />}
                  </div>
                </div>
              )}

              {/* Step 2: Dados (PF or PJ) */}
              {step === 2 && (
                <div key="step-2" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Apelido (nome público)</Label>
                    <div className="relative">
                      <Input id="nickname" placeholder="Seu apelido no marketplace" value={nickname} onChange={(e) => setNickname(e.target.value)} required autoComplete="off" className="pr-10" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <StatusIcon status={nicknameStatus} />
                      </div>
                    </div>
                    <RequirementChecklist
                      requirements={[
                        { label: 'Entre 4 e 20 caracteres', met: nicknameChecks.length },
                        { label: 'Sem espaços', met: nicknameChecks.noSpaces },
                        { label: 'Apenas letras, números, _ e -', met: nicknameChecks.validChars },
                      ]}
                    />
                    {nicknameStatus === 'taken' && <FieldError message="Este apelido já está em uso" />}
                  </div>
                  {accountType === 'individual' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nome completo</Label>
                        <Input id="fullName" placeholder="Seu nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="off" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <div className="relative">
                          <Input id="cpf" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} required autoComplete="off" className="pr-10" />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <StatusIcon status={cpfStatus} />
                          </div>
                        </div>
                        {cpfStatus === 'invalid' && <FieldError message="CPF inválido" />}
                        {cpfStatus === 'taken' && <FieldError message="Este CPF já está cadastrado" />}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <div className="relative">
                          <Input id="cnpj" placeholder="00.000.000/0000-00" value={cnpj} onChange={(e) => setCnpj(formatCNPJ(e.target.value))} required autoComplete="off" className="pr-10" />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <StatusIcon status={cnpjStatus} />
                          </div>
                        </div>
                        {cnpjStatus === 'invalid' && <FieldError message="CNPJ inválido" />}
                        {cnpjStatus === 'taken' && <FieldError message="Este CNPJ já está cadastrado" />}
                        <p className="text-xs text-muted-foreground">Os dados da empresa serão preenchidos automaticamente</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="razaoSocial">Razão Social</Label>
                        <Input id="razaoSocial" placeholder="Preenchido automaticamente pelo CNPJ" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} required autoComplete="off" />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} required autoComplete="off" />
                  </div>
                </div>
              )}

              {/* Step 3: Endereço */}
              {step === 3 && (
                <div key="step-3" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="relative">
                      <Input id="cep" placeholder="00000-000" value={cep} onChange={(e) => handleCepChange(e.target.value)} required className="pr-10" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {cepLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : cepLocked ? <Check className="h-4 w-4 text-emerald-400" /> : cepError ? <X className="h-4 w-4 text-destructive" /> : null}
                      </div>
                    </div>
                    {cepError && <FieldError message={cepError} />}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressLine">Endereço</Label>
                    <Input id="addressLine" placeholder="Rua, Avenida..." value={addressLine} onChange={(e) => setAddressLine(e.target.value)} readOnly={cepLocked} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="addressNumber">Número</Label>
                      <Input id="addressNumber" placeholder="123" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressComplement">Complemento <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                      <Input id="addressComplement" placeholder="Apto, Bloco..." value={addressComplement} onChange={(e) => setAddressComplement(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="flex items-center gap-1">Cidade {cepLocked && <Lock className="h-3 w-3 text-muted-foreground" />}</Label>
                      <Input id="city" value={city} readOnly className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="flex items-center gap-1">Estado {cepLocked && <Lock className="h-3 w-3 text-muted-foreground" />}</Label>
                      <Input id="state" value={addressState} readOnly className="bg-muted/50" />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    <Checkbox id="terms" className="mt-0.5" checked={terms} onCheckedChange={(v) => { setTerms(v === true); if (v === true) setError(null); }} />
                    <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                      Li e concordo com os{' '}
                      <Link href="/termos" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Termos de Uso</Link> e{' '}
                      <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Política de Privacidade</Link>
                    </Label>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <div className="flex gap-3">
                {step > 0 && (
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setError(null); setStep(step - 1); }}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                  </Button>
                )}
                {step < 3 ? (
                  <Button type="button" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleNext}>
                    Próximo <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar conta'}
                  </Button>
                )}
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Já tem conta?{' '}
                <Link href="/login" className="text-accent hover:underline font-medium">Entrar</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
