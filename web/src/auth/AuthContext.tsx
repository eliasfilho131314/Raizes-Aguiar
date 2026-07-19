import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../api/client';
import { usersApi } from '../api/endpoints';
import type { UserProfile } from '../api/types';

interface AuthContextValue {
  isBootstrapping: boolean;
  user: UserProfile | null;
  signup: (input: { name: string; email: string; password: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  async function refreshUser() {
    const profile = await usersApi.me();
    setUser(profile);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          await refreshUser();
        } catch {
          await supabase.auth.signOut();
        }
      }
      if (!cancelled) setIsBootstrapping(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setUser(null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function signup(input: { name: string; email: string; password: string }) {
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { name: input.name } },
    });
    if (error) throw error;
    await refreshUser();
  }

  async function login(input: { email: string; password: string }) {
    const { error } = await supabase.auth.signInWithPassword({ email: input.email, password: input.password });
    if (error) throw error;
    await refreshUser();
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ isBootstrapping, user, signup, login, logout, refreshUser }),
    [isBootstrapping, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
