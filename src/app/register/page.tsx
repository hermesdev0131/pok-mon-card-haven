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
import { Loader2 } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!terms) {
      setError('Você precisa aceitar os termos de uso.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      setError(error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
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
      <div className="relative w-full max-w-md">
        <div className="blob blob-accent w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
        <Card className="relative glass glow-accent">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Criar sua conta</CardTitle>
            <CardDescription>Comece a comprar e vender no GradedBR</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" placeholder="Seu nome" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="terms" className="mt-0.5" checked={terms} onCheckedChange={(v) => setTerms(v === true)} />
                <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                  Li e concordo com os{' '}
                  <Link href="/termos" className="text-accent hover:underline">Termos de Uso</Link> e{' '}
                  <Link href="/privacidade" className="text-accent hover:underline">Política de Privacidade</Link>
                </Label>
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar conta'}
              </Button>

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
