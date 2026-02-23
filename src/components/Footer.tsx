import Link from 'next/link';
import { Instagram, Mail } from 'lucide-react';

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com/gradedbr', label: 'Instagram' },
  { icon: WhatsAppIcon, href: 'https://wa.me/5511987813451', label: 'WhatsApp' },
  { icon: XIcon, href: 'https://x.com/gradedbr', label: 'X' },
  { icon: Mail, href: 'mailto:contato@gradedbr.com.br', label: 'Email' },
];

// WhatsApp icon — lucide doesn't include brand icons
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
          <p className="text-[10px] text-muted-foreground/50 mt-2">Pokémon TCG e suas respectivas propriedades são marcas registradas e copyrights da The Pokémon Company International. Este site não é afiliado, endossado ou patrocinado pela The Pokémon Company International.</p>
        </div>
      </div>
    </footer>
  );
}
