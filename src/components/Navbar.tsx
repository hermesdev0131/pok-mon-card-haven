"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu, X, User } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <span className="text-accent">Graded</span>
          <span className="text-foreground">BR</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/marketplace" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Marketplace
          </Link>
          <Link href="/como-funciona" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Como funciona
          </Link>
        </nav>

        <div className="hidden flex-1 max-w-md md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar cartas..." className="pl-9 h-9 bg-secondary border-0" />
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sell">Anunciar</Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/me"><User className="h-4 w-4" /></Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar cartas..." className="pl-9 bg-secondary border-0" />
          </div>
          <nav className="flex flex-col gap-3">
            <Link href="/marketplace" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Marketplace</Link>
            <Link href="/como-funciona" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Como funciona</Link>
            <Link href="/sell" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Anunciar</Link>
            <Link href="/me" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Minha conta</Link>
            <Button size="sm" asChild className="w-fit">
              <Link href="/login" onClick={() => setMobileOpen(false)}>Entrar</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
