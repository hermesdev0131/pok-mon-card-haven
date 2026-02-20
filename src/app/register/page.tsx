import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export default function Register() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md">
        <div className="blob blob-accent w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
        <Card className="relative glass glow-accent">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Criar sua conta</CardTitle>
            <CardDescription>Comece a comprar e vender no GradedBR</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="Mínimo 8 caracteres" />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="terms" className="mt-0.5" />
              <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                Li e concordo com os{' '}
                <Link href="/termos" className="text-accent hover:underline">Termos de Uso</Link> e{' '}
                <Link href="/privacidade" className="text-accent hover:underline">Política de Privacidade</Link>
              </Label>
            </div>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Criar conta</Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{' '}
              <Link href="/login" className="text-accent hover:underline font-medium">Entrar</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
