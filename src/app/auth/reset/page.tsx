'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input id="password" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar nova senha</Label>
                <Input id="confirm" type="password" placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
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
