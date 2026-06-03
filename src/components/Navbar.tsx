"use client";

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, Menu, X, User, ShoppingBag, ShoppingCart, Sparkles, LogOut, ShieldCheck } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

const categories = [
  { label: 'Graduadas Nacionais', href: '/marketplace/nacional' },
  { label: 'Graduadas Internacionais', href: '/marketplace/internacional' },
  { label: 'Últimos Anúncios', href: '/marketplace/ultimos-anuncios' },
  { label: 'Últimas Vendas', href: '/marketplace/ultimas-vendas' },
  { label: 'Vendedores', href: '/vendedores' },
];

export function Navbar() {
  return (
    <Suspense fallback={<NavbarShell />}>
      <NavbarInner />
    </Suspense>
  );
}

function NavbarShell() {
  return <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl h-14 lg:h-16 border-b border-border" />;
}

function NavbarInner() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const { isAuthenticated, isAdmin, profile, signOut } = useAuth();
  const { count: cartCount } = useCart();

  // Sync the search inputs with the URL query when on /search, otherwise clear them
  useEffect(() => {
    if (pathname === '/search') {
      const q = searchParamsHook.get('q') ?? '';
      setSearchQuery(q);
      setMobileSearchQuery(q);
    } else {
      setSearchQuery('');
      setMobileSearchQuery('');
    }
  }, [pathname, searchParamsHook]);

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  function handleSearch(e: React.FormEvent, query: string) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      setMobileOpen(false);
    }
  }

  function handleClearSearch(setter: (v: string) => void) {
    setter('');
    if (pathname === '/search') {
      router.push('/search');
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl">
      {/* Row 1: Main header */}
      <div className="border-b border-border">
        <div className="container mx-auto flex h-14 lg:h-16 items-center justify-between gap-4 px-4">
          {/* Logo — Graduada + Graded & Friends with uniform sizing and Graduada/& in accent */}
          <Link href="/" className="font-bold tracking-tight shrink-0 text-base md:text-lg lg:text-xl whitespace-nowrap">
            <span className="text-accent">Graduada</span>
            {/* Full version on md+ */}
            <span className="hidden md:inline text-foreground">, por Graded <span className="text-accent">&amp;</span> Friends</span>
            {/* Abbreviated version on screens below md (always shown on mobile) */}
            <span className="md:hidden text-foreground">, por G<span className="text-accent">&amp;</span>F</span>
          </Link>

          {/* Search */}
          <form onSubmit={(e) => handleSearch(e, searchQuery)} className="hidden md:block flex-1 max-w-md mx-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-accent" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cartas, sets, vendedores..."
                className="w-full h-10 rounded-full bg-secondary border border-border pl-11 pr-24 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:bg-background focus:border-accent/40 focus:shadow-[0_0_0_3px_hsl(var(--accent)/0.10)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleClearSearch(setSearchQuery)}
                  aria-label="Limpar busca"
                  className="absolute right-[5.5rem] top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3 rounded-full bg-accent text-accent-foreground text-xs font-semibold transition-colors hover:bg-accent/90">
                Buscar
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="hidden items-center gap-1 md:flex shrink-0">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-accent gap-1.5 text-sm" asChild>
              <Link href="/sell"><ShoppingBag className="h-4 w-4" /> Anunciar</Link>
            </Button>
            {/* Cart icon with item count badge (only when signed in). */}
            <Button
              variant="ghost"
              size="icon"
              className={`relative text-foreground hover:text-accent h-9 w-9 ${isAuthenticated ? '' : 'hidden'}`}
              asChild
              title="Meu carrinho"
            >
              <Link href="/cart">
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </Button>
            {/* Authenticated actions — hidden via CSS, not unmounted */}
            <Button variant="ghost" size="sm" className={`text-foreground hover:text-accent gap-1.5 text-sm ${isAdmin ? '' : 'hidden'}`} asChild>
              <Link href="/admin"><ShieldCheck className="h-4 w-4" /> Admin</Link>
            </Button>
            <Button variant="ghost" size="sm" className={`text-foreground hover:text-accent gap-1.5 text-sm ${isAuthenticated ? '' : 'hidden'}`} asChild>
              <Link href="/me"><User className="h-4 w-4" /> {profile?.nickname ?? profile?.full_name?.split(' ')[0] ?? 'Conta'}</Link>
            </Button>
            <Button variant="ghost" size="icon" className={`text-foreground hover:text-accent h-9 w-9 ${isAuthenticated ? '' : 'hidden'}`} onClick={handleSignOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
            {/* Anonymous actions — hidden via CSS */}
            <Button variant="ghost" size="icon" className={`text-foreground hover:text-accent h-9 w-9 ${isAuthenticated ? 'hidden' : ''}`} asChild>
              <Link href="/me"><User className="h-4 w-4" /></Link>
            </Button>
            <Button size="sm" className={`ml-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-4 h-9 text-sm ${isAuthenticated ? 'hidden' : ''}`} asChild>
              <Link href="/login">Entrar</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Row 2: Category tabs */}
      <div className="border-b border-border hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 h-11 -mb-px">
            {categories.map(({ label, href }) => {
              const isActive = href === '/marketplace'
                ? pathname === '/marketplace'
                : pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={label}
                  href={href}
                  className={`px-4 h-full flex items-center text-sm font-medium border-b-2 transition-all duration-200 ${
                    isActive
                      ? 'text-accent border-accent'
                      : 'text-foreground hover:text-accent border-transparent hover:border-accent/40'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <Link
              href="/como-funciona"
              className="ml-auto px-4 h-full flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Como funciona
              <span className="text-[10px] font-bold bg-accent text-accent-foreground rounded px-1.5 py-0.5 leading-none">NOVO</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu — always in DOM, toggled via CSS */}
      <div className={`border-b border-border bg-background p-4 md:hidden ${mobileOpen ? '' : 'hidden'}`}>
        {/* Mobile search */}
        <form onSubmit={(e) => handleSearch(e, mobileSearchQuery)} className="relative mb-4">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={mobileSearchQuery}
            onChange={(e) => setMobileSearchQuery(e.target.value)}
            placeholder="Buscar cartas..."
            className="w-full h-10 rounded-full bg-secondary border border-border pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent/40"
          />
          {mobileSearchQuery && (
            <button
              type="button"
              onClick={() => handleClearSearch(setMobileSearchQuery)}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

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
                    : 'bg-secondary border border-border text-foreground hover:text-accent hover:border-accent/40'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Mobile nav links */}
        <nav className="flex flex-col gap-3 border-t border-border pt-4">
          <Link href="/como-funciona" className="text-sm font-medium flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Como funciona
          </Link>
          <Link href="/sell" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Anunciar carta</Link>
          {isAuthenticated && (
            <Link href="/cart" className="text-sm font-medium flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <ShoppingCart className="h-3.5 w-3.5" /> Meu carrinho
              {cartCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          )}
          <Link href="/me" className="text-sm font-medium flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <User className="h-3.5 w-3.5" /> {isAuthenticated ? (profile?.nickname ?? profile?.full_name?.split(' ')[0] ?? 'Minha conta') : 'Minha conta'}
          </Link>
          <Link href="/admin" className={`text-sm font-medium flex items-center gap-2 text-accent ${isAdmin ? '' : 'hidden'}`} onClick={() => setMobileOpen(false)}>
            <ShieldCheck className="h-3.5 w-3.5" /> Painel Admin
          </Link>
          <Button size="sm" variant="outline" className={`w-fit rounded-full px-4 gap-1.5 ${isAuthenticated ? '' : 'hidden'}`} onClick={handleSignOut}>
            <LogOut className="h-3.5 w-3.5" /> Sair
          </Button>
          <Button size="sm" className={`w-fit bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-4 ${isAuthenticated ? 'hidden' : ''}`} asChild>
            <Link href="/login" onClick={() => setMobileOpen(false)}>Entrar</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
