"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, Menu, X, User, ShoppingBag, Sparkles, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const categories = [
  { label: 'PSA 10', href: '/marketplace/psa10' },
  { label: 'Cartas Graduadas', href: '/marketplace' },
  { label: 'Últimos Anúncios', href: '/marketplace/ultimos-anuncios' },
  { label: 'Últimas Vendas', href: '/marketplace/ultimas-vendas' },
  { label: 'Vendedores', href: '/vendedores' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, profile, loading, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    setMobileOpen(false);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl">
      {/* Row 1: Main header */}
      <div className="border-b border-white/[0.06]">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight shrink-0">
            <span className="text-accent text-glow-accent">Graded</span>
            <span className="text-foreground">BR</span>
          </Link>

          {/* Search */}
          <div className="hidden md:block flex-1 max-w-md mx-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-accent" />
              <input
                type="text"
                placeholder="Buscar cartas, sets, vendedores..."
                className="w-full h-9 rounded-full bg-white/[0.06] border border-white/[0.08] pl-11 pr-20 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:bg-white/[0.08] focus:border-accent/30 focus:shadow-[0_0_0_3px_hsl(var(--accent)/0.08)]"
              />
              <button className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 px-3 rounded-full bg-accent text-accent-foreground text-[11px] font-semibold transition-colors hover:bg-accent/90">
                Buscar
              </button>
            </div>
          </div>

          {/* Right actions */}
          <div className="hidden items-center gap-1 md:flex shrink-0">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5 text-xs" asChild>
              <Link href="/sell"><ShoppingBag className="h-3.5 w-3.5" /> Anunciar</Link>
            </Button>
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5 text-xs" asChild>
                  <Link href="/me"><User className="h-3.5 w-3.5" /> {profile?.full_name?.split(' ')[0] ?? 'Conta'}</Link>
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8" onClick={handleSignOut} title="Sair">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8" asChild>
                  <Link href="/me"><User className="h-4 w-4" /></Link>
                </Button>
                <Button size="sm" className="ml-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-4 h-8 text-xs" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Row 2: Category tabs */}
      <div className="border-b border-white/[0.06] hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 h-10 -mb-px">
            {categories.map(({ label, href }) => {
              const isActive = href === '/marketplace'
                ? pathname === '/marketplace'
                : pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={label}
                  href={href}
                  className={`px-3.5 h-full flex items-center text-[13px] font-medium border-b-2 transition-all duration-200 ${
                    isActive
                      ? 'text-accent border-accent'
                      : 'text-muted-foreground hover:text-foreground border-transparent hover:border-accent/50'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <Link
              href="/como-funciona"
              className="ml-auto px-3.5 h-full flex items-center gap-1.5 text-[13px] font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Como funciona
              <span className="text-[10px] font-bold bg-accent text-accent-foreground rounded px-1.5 py-0.5 leading-none">NOVO</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-b border-white/[0.06] bg-background/95 backdrop-blur-xl p-4 md:hidden">
          {/* Mobile search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Buscar cartas..."
              className="w-full h-10 rounded-full bg-white/[0.06] border border-white/[0.08] pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent/30"
            />
          </div>

          {/* Mobile category tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(({ label, href }) => {
              const isActive = href === '/marketplace'
                ? pathname === '/marketplace'
                : pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-accent/10 border border-accent/30 text-accent'
                      : 'bg-white/[0.06] border border-white/[0.08] text-muted-foreground hover:text-foreground hover:border-accent/30'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Mobile nav links */}
          <nav className="flex flex-col gap-3 border-t border-white/[0.06] pt-4">
            <Link href="/como-funciona" className="text-sm font-medium flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Como funciona
            </Link>
            <Link href="/sell" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Anunciar carta</Link>
            <Link href="/me" className="text-sm font-medium flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <User className="h-3.5 w-3.5" /> {isAuthenticated ? (profile?.full_name?.split(' ')[0] ?? 'Minha conta') : 'Minha conta'}
            </Link>
            {isAuthenticated ? (
              <Button size="sm" variant="outline" className="w-fit rounded-full px-4 gap-1.5" onClick={handleSignOut}>
                <LogOut className="h-3.5 w-3.5" /> Sair
              </Button>
            ) : (
              <Button size="sm" className="w-fit bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-4" asChild>
                <Link href="/login" onClick={() => setMobileOpen(false)}>Entrar</Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
