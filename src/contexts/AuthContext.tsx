"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    sellerProfile: null,
    loading: true,
    isAuthenticated: false,
    isSeller: false,
    isAdmin: false,
  });

  const supabase = createClient();

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    const profile = data as Profile | null;
    const role = profile?.role;

    let sellerProfile: SellerProfile | null = null;
    if (role === "seller" || role === "admin") {
      const { data: sp } = await supabase
        .from("seller_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      sellerProfile = sp as SellerProfile | null;
    }

    return { profile, sellerProfile };
  }

  async function refreshProfile() {
    if (!state.user) return;
    const { profile, sellerProfile } = await fetchProfile(state.user.id);
    if (profile) {
      setState((prev) => ({
        ...prev,
        profile,
        sellerProfile,
        isSeller: profile.role === "seller" || profile.role === "admin",
        isAdmin: profile.role === "admin",
      }));
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { profile, sellerProfile } = await fetchProfile(user.id);
        setState({
          user,
          profile,
          sellerProfile,
          loading: false,
          isAuthenticated: true,
          isSeller: profile?.role === "seller" || profile?.role === "admin",
          isAdmin: profile?.role === "admin",
        });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { profile, sellerProfile } = await fetchProfile(session.user.id);
        setState({
          user: session.user,
          profile,
          sellerProfile,
          loading: false,
          isAuthenticated: true,
          isSeller: profile?.role === "seller" || profile?.role === "admin",
          isAdmin: profile?.role === "admin",
        });
      } else {
        setState({
          user: null,
          profile: null,
          sellerProfile: null,
          loading: false,
          isAuthenticated: false,
          isSeller: false,
          isAdmin: false,
        });
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
