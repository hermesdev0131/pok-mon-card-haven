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

    // Read the initial session from cookies — do NOT call refreshSession() here.
    // Supabase fires TOKEN_REFRESHED automatically on visibility change (e.g. after
    // Win+L / laptop sleep). Calling refreshSession() manually races against that
    // internal refresh: both calls send the same single-use refresh token to the
    // server, the loser gets "invalid token" → Supabase internally calls _signOut()
    // → SIGNED_OUT fires → state is wiped → fetchProfile() calls hang on the
    // unstable post-sleep network → page freezes for 30-90 s until HTTP timeout.
    // The createBrowserClient automatically refreshes the access token before any
    // DB query, so fetchProfile() below works even when the stored token is stale.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;

      if (session) {
        console.info('[Auth] Session found on mount');
        const user = session.user;
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

      // SIGNED_OUT: fired by the Supabase client on explicit logout OR whenever
      // a token refresh request fails (network error, timeout, race condition).
      // On production (high latency), a failed refresh after Win+L / tab visibility
      // change fires this spuriously while cookies are still valid.
      // Verify cookies before clearing state: if getSession() returns a valid
      // session, the SIGNED_OUT was a false alarm — re-initialize from cookies
      // instead of logging the user out. Only clear state if cookies also say null.
      if (event === "SIGNED_OUT") {
        console.warn('[Auth] SIGNED_OUT event received — verifying cookies before clearing state. URL:', window.location.pathname);
        const { data: { session: cookieSession } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (cookieSession?.user) {
          console.info('[Auth] SIGNED_OUT was spurious — cookies still valid, re-initializing session for user', cookieSession.user.id);
          const userId = cookieSession.user.id;
          currentUserIdRef.current = userId;
          const { profile, sellerProfile } = await fetchProfile(userId);
          if (!cancelled) setState(buildAuthState(cookieSession.user, profile, sellerProfile));
        } else {
          console.warn('[Auth] SIGNED_OUT confirmed by cookies — clearing auth state');
          currentUserIdRef.current = null;
          if (!cancelled) setState(ANONYMOUS_STATE);
        }
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
