'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md">
          <Card className="relative glass glow-accent">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">E-mail enviado!</CardTitle>
              <CardDescription>Verifique sua caixa de entrada para redefinir a senha.</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Enviamos um link de redefinição para <strong className="text-foreground">{email}</strong>
              </p>
              <Button onClick={() => window.location.href = '/login'} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Voltar ao login
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
            <CardTitle className="text-xl">Esqueci minha senha</CardTitle>
            <CardDescription>Digite seu e-mail para receber o link de redefinição</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar link'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-accent hover:underline font-medium">Voltar ao login</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
