/**
 * Authentication Context for Lost & Found System
 * 
 * Provides authentication state and methods throughout the application
 * using Supabase Auth. Manages user sessions, sign in/up, and sign out.
 * 
 * @module AuthContext
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseReady } from '@/lib/supabaseClient';
import { isUserAdmin } from '@/lib/api';

/**
 * Authentication context type definition
 * Provides access to current user, session, and auth methods
 */
interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * Wraps the application to provide auth state and methods to all children
 * 
 * @param children - Child components that will have access to auth context
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  const syncAdminStatus = async (nextUser: User | null) => {
    if (!nextUser) {
      setIsAdmin(false);
      return;
    }

    const admin = await isUserAdmin(nextUser.id);
    setIsAdmin(admin);
  };

  useEffect(() => {
    const init = async () => {
      if (!isSupabaseReady) {
        setConfigError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart.');
        setUser(null);
        setIsAdmin(false);
        setSession(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Auth session load error:', error);
        setConfigError('Unable to reach Supabase auth. Check your connection and keys.');
        setUser(null);
        setIsAdmin(false);
        setSession(null);
        setLoading(false);
        return;
      }
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      await syncAdminStatus(data.session?.user ?? null);
      setLoading(false);
    };

    void init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      void syncAdminStatus(newSession?.user ?? null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseReady) {
      return { error: { message: 'Supabase is not configured. Set env and restart.' } };
    }

    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    setUser(data.user ?? null);
    setSession(data.session ?? null);
    await syncAdminStatus(data.user ?? null);
    return { error };
  };

  const signUp = async (email: string, password: string, username: string) => {
    if (!isSupabaseReady) {
      return { error: { message: 'Supabase is not configured. Set env and restart.' } };
    }

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    setUser(data.user ?? null);
    setSession(data.session ?? null);
    await syncAdminStatus(data.user ?? null);
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access authentication context
 * Must be used within an AuthProvider
 * 
 * @returns AuthContextType with user, session, and auth methods
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
