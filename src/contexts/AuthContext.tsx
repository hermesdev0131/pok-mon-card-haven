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
  /** Increments each time the access token is successfully refreshed. Include in
   *  useEffect dependency arrays to re-fetch page data after a token refresh. */
  tokenRefreshCount: number;
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
  const [tokenRefreshCount, setTokenRefreshCount] = useState(0);

  // Track mounted to avoid state updates after unmount
  const mountedRef = useRef(true);
  // Track current user id to skip redundant profile fetches (e.g. TOKEN_REFRESHED)
  const currentUserIdRef = useRef<string | null>(null);
  // Set to true when the user explicitly clicks "sign out". Prevents the SIGNED_OUT
  // handler from mistaking an intentional logout for a spurious token-refresh failure.
  const explicitSignOutRef = useRef(false);
  // Track whether the profile was successfully loaded after the initial getSession().
  // If the access token was expired on page load, fetchProfile() fails silently and
  // profile stays null. When TOKEN_REFRESHED fires (token is now valid), we retry.
  const profileLoadedRef = useRef(false);
  // Session is scoped to the browser tab. sessionStorage is per-tab and is cleared
  // automatically when the tab is closed. A new tab always starts anonymous — the
  // user must log in explicitly. The flag is set on SIGNED_IN and cleared on logout.
  // Initialized to false; real value is read inside useEffect (sessionStorage is
  // not available during SSR — accessing it at module/render scope throws on server).
  const tabSessionActiveRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    // Read sessionStorage here — browser-only, safe inside useEffect
    tabSessionActiveRef.current = !!sessionStorage.getItem('gradedbr_tab_active');

    if (tabSessionActiveRef.current) {
      // Existing tab session — restore from cookies.
      // Do NOT call refreshSession() here: see long comment below about race conditions.
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (cancelled) return;

        if (session) {
          console.info('[Auth] Session found on mount');
          const user = session.user;
          currentUserIdRef.current = user.id;
          const { profile, sellerProfile } = await fetchProfile(user.id);
          if (!cancelled) {
            profileLoadedRef.current = !!profile;
            setState(buildAuthState(user, profile, sellerProfile));
          }
        } else {
          // Tab flag was set but cookies are gone — clear the stale flag
          console.info('[Auth] Tab session flag set but no cookie session — resetting');
          sessionStorage.removeItem('gradedbr_tab_active');
          tabSessionActiveRef.current = false;
          currentUserIdRef.current = null;
          if (!cancelled) setState(ANONYMOUS_STATE);
        }
      });
    } else {
      // New tab — skip cookie restore, show anonymous state immediately.
      // The user must log in explicitly; INITIAL_SESSION / TOKEN_REFRESHED events
      // from the existing cookie session are ignored until SIGNED_IN fires.
      console.info('[Auth] New tab — starting in anonymous state');
      setState(ANONYMOUS_STATE);
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      // Tab session scope: new tabs start anonymous and must log in explicitly.
      // INITIAL_SESSION and TOKEN_REFRESHED relate to the existing cookie session —
      // ignore them until this tab activates via an explicit SIGNED_IN.
      if (!tabSessionActiveRef.current && event !== 'SIGNED_IN') return;

      // TOKEN_REFRESHED: token was refreshed in the background.
      // If the profile was never loaded (fetchProfile failed on mount because the
      // access token was already expired when the tab reopened), retry it now that
      // the token is valid.
      if (event === "TOKEN_REFRESHED" && session?.user?.id === currentUserIdRef.current) {
        if (!profileLoadedRef.current && session.user) {
          console.info('[Auth] TOKEN_REFRESHED — retrying profile fetch after expired-token failure');
          const { profile, sellerProfile } = await fetchProfile(session.user.id);
          if (!cancelled && profile) {
            profileLoadedRef.current = true;
            setState(buildAuthState(session.user, profile, sellerProfile));
          }
        } else {
          console.info('[Auth] Token refreshed in background — session still active');
        }
        if (!cancelled) setTokenRefreshCount(c => c + 1);
        return;
      }

      // SIGNED_OUT: fired by the Supabase client on explicit logout OR whenever
      // a token refresh request fails (network error, timeout, race condition).
      // On production (high latency BR→Vercel), this fires spuriously after
      // Win+L / tab visibility change even though the refresh token in cookies
      // is still valid. We attempt refreshSession() to both verify the session
      // AND restore the Supabase client's internal state — getSession() alone
      // reads cookies but leaves the client's currentSession = null, causing
      // all subsequent API calls to run as anonymous (no JWT attached).
      if (event === "SIGNED_OUT") {
        // Explicit logout: skip cookie verification and clear state immediately.
        if (explicitSignOutRef.current) {
          explicitSignOutRef.current = false;
          console.info('[Auth] Explicit sign out — clearing auth state');
          sessionStorage.removeItem('gradedbr_tab_active');
          tabSessionActiveRef.current = false;
          currentUserIdRef.current = null;
          if (!cancelled) setState(ANONYMOUS_STATE);
          return;
        }
        // Attempt a fresh token refresh. If the SIGNED_OUT was spurious (network
        // hiccup / race condition), refreshSession() will succeed and restore the
        // Supabase client's internal session — ensuring subsequent API calls
        // attach a valid JWT. getSession() alone reads cookies but does NOT
        // restore the client's internal state, so API calls would still run
        // as anonymous even after our AuthContext state was "restored".
        console.warn('[Auth] SIGNED_OUT event received — attempting token refresh to verify. URL:', window.location.pathname);
        const { data: { session: freshSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (cancelled) return;
        if (freshSession?.user && !refreshError) {
          console.info('[Auth] SIGNED_OUT was spurious — session recovered via refresh for user', freshSession.user.id);
          const userId = freshSession.user.id;
          currentUserIdRef.current = userId;
          const { profile, sellerProfile } = await fetchProfile(userId);
          if (!cancelled) {
            setState(buildAuthState(freshSession.user, profile, sellerProfile));
            setTokenRefreshCount(c => c + 1);
          }
        } else {
          console.warn('[Auth] SIGNED_OUT confirmed — refresh also failed, clearing auth state', refreshError?.message);
          sessionStorage.removeItem('gradedbr_tab_active');
          tabSessionActiveRef.current = false;
          currentUserIdRef.current = null;
          if (!cancelled) setState(ANONYMOUS_STATE);
        }
        return;
      }

      if (session?.user) {
        const userId = session.user.id;
        // Re-run the full handler only when the user actually changed OR when
        // the tab was not previously active (explicit login after logout, or
        // first login). Skip if the same user is already active — this dedupes
        // the spurious second SIGNED_IN that Supabase fires when refreshSession()
        // succeeds inside the SIGNED_OUT recovery handler, which would otherwise
        // cause all page useEffects to run twice in parallel and saturate the
        // Navigator LockManager (auth-token lock), causing a 10 s timeout freeze.
        const isNewUser = userId !== currentUserIdRef.current;
        const wasLoggedOut = !tabSessionActiveRef.current;
        if (isNewUser || wasLoggedOut) {
          console.info('[Auth] SIGNED_IN — fetching profile for user', userId);
          sessionStorage.setItem('gradedbr_tab_active', '1');
          tabSessionActiveRef.current = true;
          currentUserIdRef.current = userId;
          profileLoadedRef.current = false;
          const { profile, sellerProfile } = await fetchProfile(userId);
          if (!cancelled) {
            profileLoadedRef.current = !!profile;
            setState(buildAuthState(session.user, profile, sellerProfile));
            // Increment so pages that depend only on tokenRefreshCount (home,
            // marketplace) also re-fetch. SIGNED_IN fires after every token
            // refresh on tab return — not just on explicit login.
            setTokenRefreshCount(c => c + 1);
          }
        } else {
          console.info('[Auth] SIGNED_IN deduped — same user already active, skipping');
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
    explicitSignOutRef.current = true;
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
      tokenRefreshCount,
    }),
    [state, signIn, signUp, signOutFn, refreshProfileFn, tokenRefreshCount],
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
