'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { becomeSeller } from '@/lib/api';
import { Loader2, Store } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
  /** Minimum role required. 'buyer' = any logged-in user, 'seller' = seller or admin, 'admin' = admin only */
  role?: 'buyer' | 'seller' | 'admin';
}

function BecomeSellerPrompt() {
  const { refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!storeName.trim()) return;
    setLoading(true);
    setError(null);
    const result = await becomeSeller(storeName.trim(), storeDesc.trim() || undefined);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    setOpen(false);
    await refreshProfile();
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
      <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center mb-2">
        <Store className="h-7 w-7 text-accent" />
      </div>
      <h2 className="text-xl font-bold">Crie sua loja para vender</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Para anunciar suas cartas graduadas, você precisa de uma conta de vendedor. É rápido e gratuito.
      </p>
      <Button className="mt-2" onClick={() => setOpen(true)}>
        Criar minha loja
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!loading) { setOpen(o); setError(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Criar sua loja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da loja <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ex: Coleção do João"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea
                placeholder="Fale um pouco sobre você e seus cards..."
                className="resize-none"
                rows={3}
                value={storeDesc}
                onChange={(e) => setStoreDesc(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!storeName.trim() || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar loja'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function RequireAuth({ children, role = 'buyer' }: RequireAuthProps) {
  const { isAuthenticated, isSeller, isAdmin, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (role === 'admin' && !isAdmin) { router.replace('/'); return; }
  }, [loading, isAuthenticated, isAdmin, role, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (role === 'admin' && !isAdmin) return null;

  // Buyer trying to access a seller-only page → show upgrade prompt instead of redirecting
  if (role === 'seller' && !isSeller && profile?.role !== 'admin') {
    return <BecomeSellerPrompt />;
  }

  return <>{children}</>;
}
