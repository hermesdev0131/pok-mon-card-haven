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
import { useRouter } from "next/navigation";
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

const supabase = createClient();

const IDLE_MS = 15 * 60 * 1000; // 15 minutes of inactivity → auto sign-out
const ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown', 'scroll', 'click', 'touchstart',
] as const;

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
      return { profile: null as Profile | null, sellerProfile: null as SellerProfile | null };
    }

    const profile = data as Profile | null;

    let sellerProfile: SellerProfile | null = null;
    if (profile?.role === "seller" || profile?.role === "admin") {
      const { data: sp } = await supabase
        .from("seller_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      sellerProfile = sp as SellerProfile | null;
    }

    return { profile, sellerProfile };
  } catch {
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
  const [state, setState] = useState<AuthState>({ ...ANONYMOUS_STATE, loading: true });
  const [tokenRefreshCount, setTokenRefreshCount] = useState(0);
  const router = useRouter();
  const mountedRef = useRef(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether a user is currently signed in — used to gate the idle timer.
  const isAuthenticatedRef = useRef(false);
  // Current signed-in user ID. Set synchronously before any await in the SIGNED_IN
  // handler so a second concurrent SIGNED_IN (fired by Supabase's visibilitychange
  // + focus recovery) sees the same ID and skips — preventing two parallel
  // fetchProfile() calls from saturating the LockManager and freezing the page.
  const currentUserIdRef = useRef<string | null>(null);
  // Set to true while signOut() is in-flight. Blocks any SIGNED_IN event that
  // Supabase fires during the async signOut (race between our signOut clearing
  // storage and the internal _recoverAndRefresh() still holding a valid token).
  const signingOutRef = useRef(false);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const signOutFn = useCallback(async () => {
    console.log('[Auth] signing out — clearing all sessions and cookies');
    signingOutRef.current = true;
    isAuthenticatedRef.current = false;
    currentUserIdRef.current = null;
    clearIdleTimer();
    sessionStorage.clear();
    // scope:'global' revokes the refresh token server-side, invalidating all
    // devices/tabs at once. The SDK also clears local cookies and localStorage.
    await supabase.auth.signOut({ scope: 'global' });
  }, [clearIdleTimer]);

  const resetIdleTimer = useCallback(() => {
    // Ignore activity events when no user is logged in
    if (!isAuthenticatedRef.current) return;
    clearIdleTimer();
    idleTimerRef.current = setTimeout(async () => {
      console.log('[Auth] 15 min idle — signing out automatically');
      await signOutFn();
      router.push('/login');
    }, IDLE_MS);
  }, [clearIdleTimer, signOutFn, router]);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    // Register activity listeners. resetIdleTimer is a no-op when not authenticated.
    ACTIVITY_EVENTS.forEach(e =>
      window.addEventListener(e, resetIdleTimer, { passive: true }),
    );

    // onAuthStateChange is the single source of truth — fires INITIAL_SESSION on
    // mount to restore any existing session, then SIGNED_IN / TOKEN_REFRESHED /
    // SIGNED_OUT for subsequent changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;
        console.log(`[Auth] event=${event} userId=${session?.user?.id ?? 'none'}`);

        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            const userId = session.user.id;
            if (userId === currentUserIdRef.current) {
              console.log('[Auth] INITIAL_SESSION — same user already active, skipping (dedup)');
              return;
            }
            currentUserIdRef.current = userId; // set synchronously before await
            const { profile, sellerProfile } = await fetchProfile(userId);
            if (!cancelled) {
              isAuthenticatedRef.current = true;
              setState(buildAuthState(session.user, profile, sellerProfile));
              resetIdleTimer();
            }
          } else {
            if (!cancelled) setState(ANONYMOUS_STATE);
          }
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          // Block SIGNED_IN fired by Supabase's internal _recoverAndRefresh() while
          // our signOut() is still in-flight (race: token still valid in memory).
          if (signingOutRef.current) {
            console.warn('[Auth] SIGNED_IN — signOut in-flight, ignoring');
            return;
          }
          const userId = session.user.id;
          // Deduplicate concurrent SIGNED_IN events (visibilitychange + focus both
          // fire _recoverAndRefresh()). currentUserIdRef is set synchronously before
          // the await so a second concurrent handler sees the same ID and skips.
          if (userId === currentUserIdRef.current) {
            console.log('[Auth] SIGNED_IN — same user already active, skipping (dedup)');
            resetIdleTimer();
            return;
          }
          currentUserIdRef.current = userId; // synchronous — guard against concurrent handlers
          const { profile, sellerProfile } = await fetchProfile(userId);
          if (!cancelled) {
            isAuthenticatedRef.current = true;
            setState(buildAuthState(session.user, profile, sellerProfile));
            setTokenRefreshCount(c => c + 1);
            resetIdleTimer();
          }
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] TOKEN_REFRESHED — incrementing tokenRefreshCount');
          if (!cancelled) {
            setTokenRefreshCount(c => c + 1);
            resetIdleTimer();
          }
          return;
        }

        if (event === 'SIGNED_OUT') {
          console.log('[Auth] SIGNED_OUT — clearing state');
          signingOutRef.current = false;
          isAuthenticatedRef.current = false;
          currentUserIdRef.current = null;
          clearIdleTimer();
          if (!cancelled) setState(ANONYMOUS_STATE);
          return;
        }
      },
    );

    return () => {
      cancelled = true;
      mountedRef.current = false;
      subscription.unsubscribe();
      clearIdleTimer();
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetIdleTimer));
    };
  }, [resetIdleTimer, clearIdleTimer]);

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

  const refreshProfileFn = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { profile, sellerProfile } = await fetchProfile(user.id);
    if (profile && mountedRef.current) {
      setState(prev => ({
        ...prev,
        profile,
        sellerProfile,
        isSeller: profile.role === "seller" || profile.role === "admin",
        isAdmin: profile.role === "admin",
      }));
    }
  }, []);

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
