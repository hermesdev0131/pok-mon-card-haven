"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { addToCart as apiAddToCart, removeFromCart as apiRemoveFromCart, getMyCartListingIds } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface CartState {
  count: number;
  loading: boolean;
  // True when this listing is already in the current buyer's cart. Drives
  // the "Já no carrinho" button state on listing surfaces so we don't show
  // a misleading "added" modal when re-clicking.
  isInCart: (listingId: string) => boolean;
  refresh: () => Promise<void>;
  addToCart: (listingId: string) => Promise<{ success: true } | { success: false; error: string }>;
  removeFromCart: (cartItemId: string) => Promise<{ success: true } | { success: false; error: string }>;
  // When the buyer just added an item, we surface a small confirmation modal
  // at the app root. The modal is global so every add-to-cart entry point gets
  // the same UX without re-wiring its own dialog. This serial number bumps on
  // every successful add; the dialog watches it and opens.
  recentlyAddedAt: number;
  dismissRecentlyAdded: () => void;
}

const CartContext = createContext<CartState | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [listingIds, setListingIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [recentlyAddedAt, setRecentlyAddedAt] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) { setListingIds(new Set()); return; }
    setLoading(true);
    const ids = await getMyCartListingIds();
    setListingIds(new Set(ids));
    setLoading(false);
  }, [isAuthenticated]);

  // Refresh when auth state changes (login, logout, user switch).
  useEffect(() => { refresh(); }, [user?.id, refresh]);

  const addToCart = useCallback(async (listingId: string) => {
    const result = await apiAddToCart(listingId);
    if (result.success) {
      await refresh();
      // Bump the serial; the global CartAddedDialog watches this and opens.
      setRecentlyAddedAt(Date.now());
    }
    return result;
  }, [refresh]);

  const dismissRecentlyAdded = useCallback(() => setRecentlyAddedAt(0), []);

  const removeFromCart = useCallback(async (cartItemId: string) => {
    const result = await apiRemoveFromCart(cartItemId);
    if (result.success) await refresh();
    return result;
  }, [refresh]);

  const isInCart = useCallback((listingId: string) => listingIds.has(listingId), [listingIds]);
  const count = listingIds.size;

  const value = useMemo(
    () => ({ count, loading, isInCart, refresh, addToCart, removeFromCart, recentlyAddedAt, dismissRecentlyAdded }),
    [count, loading, isInCart, refresh, addToCart, removeFromCart, recentlyAddedAt, dismissRecentlyAdded],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
