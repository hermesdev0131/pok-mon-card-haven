import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-background mt-auto relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-bold text-xl">
              <span className="text-accent text-glow-accent">Graded</span>
              <span className="text-foreground">BR</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              O marketplace brasileiro de cartas Pokémon graduadas com pagamento protegido.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Marketplace</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/marketplace" className="text-sm text-muted-foreground transition-colors hover:text-accent">Explorar</Link>
              <Link href="/sell" className="text-sm text-muted-foreground transition-colors hover:text-accent">Anunciar</Link>
            </nav>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Institucional</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/como-funciona" className="text-sm text-muted-foreground transition-colors hover:text-accent">Como funciona</Link>
              <Link href="/termos" className="text-sm text-muted-foreground transition-colors hover:text-accent">Termos de uso</Link>
              <Link href="/privacidade" className="text-sm text-muted-foreground transition-colors hover:text-accent">Privacidade</Link>
            </nav>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Conta</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-accent">Entrar</Link>
              <Link href="/register" className="text-sm text-muted-foreground transition-colors hover:text-accent">Criar conta</Link>
            </nav>
          </div>
        </div>
        <div className="mt-10 border-t border-white/[0.06] pt-6 text-center">
          <p className="text-xs text-muted-foreground">© 2026 GradedBR. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
