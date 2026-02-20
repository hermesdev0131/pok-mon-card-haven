import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export default function Login() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md">
        <div className="blob blob-accent w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
        <Card className="relative glass glow-accent">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Entrar na sua conta</CardTitle>
            <CardDescription>Acesse o marketplace GradedBR</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="#" className="text-xs text-accent hover:underline">Esqueci minha senha</Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Entrar</Button>
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{' '}
              <Link href="/register" className="text-accent hover:underline font-medium">Criar conta</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
