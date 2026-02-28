"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile, SellerProfile } from "@/types/database";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  sellerProfile: SellerProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSeller: boolean;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Singleton client — createBrowserClient already deduplicates, but we
// keep a stable reference so the rest of the provider never recreates it.
const supabase = createClient();

function buildAuthState(
  user: User | null,
  profile: Profile | null,
  sellerProfile: SellerProfile | null,
): AuthState {
  return {
    user,
    profile,
    sellerProfile,
    loading: false,
    isAuthenticated: !!user,
    isSeller: profile?.role === "seller" || profile?.role === "admin",
    isAdmin: profile?.role === "admin",
  };
}

async function fetchProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.warn("[AuthContext] fetchProfile error:", error.message);
      return { profile: null as Profile | null, sellerProfile: null as SellerProfile | null };
    }

    const profile = data as Profile | null;
    const role = profile?.role;

    let sellerProfile: SellerProfile | null = null;
    if (role === "seller" || role === "admin") {
      const { data: sp, error: spErr } = await supabase
        .from("seller_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (spErr) {
        console.warn("[AuthContext] fetchSellerProfile error:", spErr.message);
      }
      sellerProfile = sp as SellerProfile | null;
    }

    return { profile, sellerProfile };
  } catch (err) {
    console.warn("[AuthContext] fetchProfile unexpected error:", err);
    return { profile: null as Profile | null, sellerProfile: null as SellerProfile | null };
  }
}

const ANONYMOUS_STATE: AuthState = {
  user: null,
  profile: null,
  sellerProfile: null,
  loading: false,
  isAuthenticated: false,
  isSeller: false,
  isAdmin: false,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ...ANONYMOUS_STATE,
    loading: true,
  });

  // Track mounted to avoid state updates after unmount
  const mountedRef = useRef(true);
  // Track current user id to skip redundant profile fetches (e.g. TOKEN_REFRESHED)
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    // Get initial session — attempt refresh first so an expired access token
    // is renewed before we try to fetch the profile.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;

      if (session) {
        console.info('[Auth] Session found on mount — refreshing token');
        // Proactively refresh the access token on mount so we never start
        // with a token that is about to expire.
        const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshErr || !refreshed.session) {
          // Refresh token is expired or invalid — clear local state only.
          // Do NOT call supabase.auth.signOut() here: it would fire SIGNED_OUT
          // which previously triggered window.location.reload(), causing a
          // race condition with cookie clearing and an infinite reload loop.
          console.warn('[Auth] Token refresh failed on mount — clearing session locally.', refreshErr?.message ?? 'no session returned');
          if (!cancelled) setState(ANONYMOUS_STATE);
          return;
        }
        console.info('[Auth] Token refreshed successfully on mount');
        const user = refreshed.session.user;
        currentUserIdRef.current = user.id;
        const { profile, sellerProfile } = await fetchProfile(user.id);
        if (!cancelled) setState(buildAuthState(user, profile, sellerProfile));
      } else {
        console.info('[Auth] No session on mount — anonymous state');
        currentUserIdRef.current = null;
        if (!cancelled) setState(ANONYMOUS_STATE);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      // TOKEN_REFRESHED: user hasn't changed, skip re-fetching profile
      if (event === "TOKEN_REFRESHED" && session?.user?.id === currentUserIdRef.current) {
        console.info('[Auth] Token refreshed in background — session still active');
        return;
      }

      // SIGNED_OUT: session was cleared (explicit logout or server invalidation).
      // setState is enough — React re-renders and RequireAuth redirects to /login.
      // DO NOT call window.location.reload() here: it races with cookie clearing,
      // causing getSession() on the next load to find stale cookies, which triggers
      // refreshSession() on an invalidated token, and loops back to SIGNED_OUT → reload.
      if (event === "SIGNED_OUT") {
        console.warn('[Auth] SIGNED_OUT event received — clearing auth state. URL:', window.location.pathname);
        currentUserIdRef.current = null;
        if (!cancelled) setState(ANONYMOUS_STATE);
        return;
      }

      if (session?.user) {
        const userId = session.user.id;
        // Only re-fetch profile if user actually changed
        if (userId !== currentUserIdRef.current || event === "SIGNED_IN") {
          console.info('[Auth] SIGNED_IN — fetching profile for user', userId);
          currentUserIdRef.current = userId;
          const { profile, sellerProfile } = await fetchProfile(userId);
          if (!cancelled) {
            setState(buildAuthState(session.user, profile, sellerProfile));
          }
        }
      } else {
        currentUserIdRef.current = null;
        if (!cancelled) {
          setState(ANONYMOUS_STATE);
        }
      }
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error: error?.message ?? null };
    },
    [],
  );

  const signOutFn = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfileFn = useCallback(async () => {
    const uid = currentUserIdRef.current;
    if (!uid) return;
    const { profile, sellerProfile } = await fetchProfile(uid);
    if (profile && mountedRef.current) {
      setState((prev) => ({
        ...prev,
        profile,
        sellerProfile,
        isSeller: profile.role === "seller" || profile.role === "admin",
        isAdmin: profile.role === "admin",
      }));
    }
  }, []);

  // Memoize context value to prevent cascading re-renders on every provider render
  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      signIn,
      signUp,
      signOut: signOutFn,
      refreshProfile: refreshProfileFn,
    }),
    [state, signIn, signUp, signOutFn, refreshProfileFn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
