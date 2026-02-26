'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
  /** Minimum role required. 'buyer' = any logged-in user, 'seller' = seller or admin, 'admin' = admin only */
  role?: 'buyer' | 'seller' | 'admin';
}

export function RequireAuth({ children, role = 'buyer' }: RequireAuthProps) {
  const { isAuthenticated, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (role === 'admin' && profile?.role !== 'admin') {
      router.replace('/');
      return;
    }

    if (role === 'seller' && profile?.role !== 'seller' && profile?.role !== 'admin') {
      router.replace('/');
      return;
    }
  }, [loading, isAuthenticated, profile, role, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (role === 'admin' && profile?.role !== 'admin') return null;
  if (role === 'seller' && profile?.role !== 'seller' && profile?.role !== 'admin') return null;

  return <>{children}</>;
}
