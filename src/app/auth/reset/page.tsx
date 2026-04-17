'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { checkPassword } from '@/lib/validators';
import { RequirementChecklist } from '@/components/RequirementChecklist';
import { Loader2, Check, X } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const router = useRouter();

  const passwordChecks = useMemo(() => checkPassword(password), [password]);
  const passwordValid = passwordChecks.length && passwordChecks.uppercase && passwordChecks.number && passwordChecks.special;
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setError('A senha não atende aos requisitos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (hasSession === null) {
    return (
      <div className="container mx-auto flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md">
          <Card className="relative glass glow-accent">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Link expirado</CardTitle>
              <CardDescription>Este link de redefinição é inválido ou já foi utilizado.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => router.push('/forgot-password')} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Solicitar novo link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md">
          <Card className="relative glass glow-accent">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Senha alterada!</CardTitle>
              <CardDescription>Sua senha foi redefinida com sucesso.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
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
      <div className="relative w-full max-w-md">
        <div className="blob blob-accent w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
        <Card className="relative glass glow-accent">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Nova senha</CardTitle>
            <CardDescription>Digite sua nova senha</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
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
                <Label htmlFor="confirm">Confirmar nova senha</Label>
                <div className="relative">
                  <Input id="confirm" type="password" placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className="pr-10" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {confirmPassword ? (passwordsMatch ? <Check className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-destructive" />) : null}
                  </div>
                </div>
                {confirmPassword && !passwordsMatch && <p className="text-xs text-destructive mt-1">As senhas não coincidem</p>}
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Redefinir senha'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
