'use client';

import { useState } from 'react';
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
import { validateCPF, formatCPF, hashCPF, validateCNPJ, formatCNPJ, validateNickname, formatPhone, formatCep } from '@/lib/validators';
import { Loader2, Lock, ChevronRight, ChevronLeft, User, Building2 } from 'lucide-react';

type AccountType = 'individual' | 'business';

const STEPS = ['Tipo de Conta', 'Conta', 'Dados', 'Endereço'];

export default function Register() {
  const [step, setStep] = useState(0);
  // Step 0: Account type
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  // Step 1: Account
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Step 2: Personal/Business data
  const [nickname, setNickname] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  // Step 3: Address
  const [cep, setCep] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [city, setCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepLocked, setCepLocked] = useState(false);
  const [terms, setTerms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  function validateStep0(): string | null {
    if (!accountType) return 'Selecione o tipo de conta.';
    return null;
  }

  function validateStep1(): string | null {
    if (!email.trim()) return 'E-mail é obrigatório.';
    if (!/\S+@\S+\.\S+/.test(email)) return 'E-mail inválido.';
    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) return 'Os e-mails não coincidem.';
    if (password.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
    if (password !== confirmPassword) return 'As senhas não coincidem.';
    return null;
  }

  function validateStep2(): string | null {
    const nickResult = validateNickname(nickname);
    if (!nickResult.valid) return nickResult.error!;
    if (accountType === 'individual') {
      if (!fullName.trim()) return 'Nome completo é obrigatório.';
      if (!validateCPF(cpf)) return 'CPF inválido.';
    } else {
      if (!razaoSocial.trim()) return 'Razão Social é obrigatória.';
      if (!validateCNPJ(cnpj)) return 'CNPJ inválido.';
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) return 'Telefone inválido.';
    return null;
  }

  function validateStep3(): string | null {
    if (!cepLocked) return 'CEP é obrigatório.';
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
      } else {
        setCepLocked(false);
        setCity('');
        setAddressState('');
      }
      setCepLoading(false);
    } else {
      setCepLocked(false);
      setCity('');
      setAddressState('');
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
      const supabase = createClient();

      // Check nickname uniqueness
      const { data: existingNick } = await supabase
        .from('profiles')
        .select('id')
        .eq('nickname', nickname.trim())
        .maybeSingle();
      if (existingNick) {
        setError('Este apelido já está em uso.');
        setLoading(false);
        return;
      }

      if (accountType === 'individual') {
        const cpfHash = await hashCPF(cpf);
        // Check CPF uniqueness
        const { data: existingCpf } = await supabase
          .from('profiles')
          .select('id')
          .eq('cpf_hash', cpfHash)
          .maybeSingle();
        if (existingCpf) {
          setError('Este CPF já está cadastrado.');
          setLoading(false);
          return;
        }

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
        const cnpjClean = cnpj.replace(/\D/g, '');
        // Check CNPJ uniqueness
        const { data: existingCnpj } = await supabase
          .from('profiles')
          .select('id')
          .eq('cnpj', cnpjClean)
          .maybeSingle();
        if (existingCnpj) {
          setError('Este CNPJ já está cadastrado.');
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, {
          account_type: 'business',
          full_name: razaoSocial.trim(),
          nickname: nickname.trim(),
          cnpj: cnpjClean,
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
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
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
                    <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail">Confirmar e-mail</Label>
                    <Input id="confirmEmail" type="email" placeholder="Repita o e-mail" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required autoComplete="off" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar senha</Label>
                    <Input id="confirmPassword" type="password" placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                  </div>
                </div>
              )}

              {/* Step 2: Dados (PF or PJ) */}
              {step === 2 && (
                <div key="step-2" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Apelido (nome público)</Label>
                    <Input id="nickname" placeholder="Como você será visto no marketplace" value={nickname} onChange={(e) => setNickname(e.target.value)} required autoComplete="off" />
                  </div>
                  {accountType === 'individual' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nome completo</Label>
                        <Input id="fullName" placeholder="Seu nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input id="cpf" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} required />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="razaoSocial">Razão Social</Label>
                        <Input id="razaoSocial" placeholder="Nome da empresa" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input id="cnpj" placeholder="00.000.000/0000-00" value={cnpj} onChange={(e) => setCnpj(formatCNPJ(e.target.value))} required />
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
                      <Input id="cep" placeholder="00000-000" value={cep} onChange={(e) => handleCepChange(e.target.value)} required />
                      {cepLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
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
                    <Checkbox id="terms" className="mt-0.5" checked={terms} onCheckedChange={(v) => setTerms(v === true)} />
                    <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                      Li e concordo com os{' '}
                      <Link href="/termos" className="text-accent hover:underline">Termos de Uso</Link> e{' '}
                      <Link href="/privacidade" className="text-accent hover:underline">Política de Privacidade</Link>
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
