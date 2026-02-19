import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-bold text-xl">
              <span className="text-accent">Graded</span>
              <span className="text-foreground">BR</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              O marketplace brasileiro de cartas Pokémon graduadas com pagamento protegido.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Marketplace</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">Explorar</Link>
              <Link href="/sell" className="text-sm text-muted-foreground hover:text-foreground">Anunciar</Link>
            </nav>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Institucional</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/como-funciona" className="text-sm text-muted-foreground hover:text-foreground">Como funciona</Link>
              <Link href="/termos" className="text-sm text-muted-foreground hover:text-foreground">Termos de uso</Link>
              <Link href="/privacidade" className="text-sm text-muted-foreground hover:text-foreground">Privacidade</Link>
            </nav>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Conta</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Entrar</Link>
              <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">Criar conta</Link>
            </nav>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">© 2025 GradedBR. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
