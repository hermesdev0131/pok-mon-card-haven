import Link from 'next/link';
import { Instagram, Facebook, Youtube, Mail } from 'lucide-react';

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com/gradedbr', label: 'Instagram' },
  { icon: Facebook, href: 'https://facebook.com/gradedbr', label: 'Facebook' },
  { icon: XIcon, href: 'https://x.com/gradedbr', label: 'X' },
  { icon: Youtube, href: 'https://youtube.com/@gradedbr', label: 'YouTube' },
  { icon: Mail, href: 'mailto:contato@gradedbr.com.br', label: 'Email' },
];

// X (Twitter) icon — lucide doesn't have the new X logo
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-background mt-auto relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
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
          <div>
            <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider">Fale Conosco</h4>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.08] text-muted-foreground transition-all duration-200 hover:text-accent hover:border-accent/30 hover:bg-accent/5"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-white/[0.06] pt-6 text-center">
          <p className="text-xs text-muted-foreground">© 2026 GradedBR. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
