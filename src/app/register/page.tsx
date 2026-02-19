import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export default function Register() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
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
          <Button className="w-full">Criar conta</Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="text-accent hover:underline font-medium">Entrar</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
