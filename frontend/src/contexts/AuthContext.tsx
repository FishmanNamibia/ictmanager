'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AUTH_UNAUTHORIZED_EVENT,
  SESSION_EXPIRED_NOTICE_KEY,
  authApi,
  AuthUser,
} from '@/lib/api';

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string, tenantSlug?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'iictms_token';
const USER_KEY = 'iictms_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    setToken(null);
    setUser(null);
  }, []);

  const loadStored = useCallback(async () => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const t = localStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);

    if (!t || !u) {
      setLoading(false);
      return;
    }

    setToken(t);

    try {
      const parsedUser = JSON.parse(u) as AuthUser;
      setUser(parsedUser);

      const timeout = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('Session check timed out')), 8000);
      });

      const result = await Promise.race([authApi.me(), timeout]);
      setUser(result.user);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void loadStored();
  }, [loadStored]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUnauthorized = (_event: Event) => {
      sessionStorage.setItem(SESSION_EXPIRED_NOTICE_KEY, 'Session expired. Please sign in again.');
      logout();
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized as EventListener);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized as EventListener);
    };
  }, [logout]);

  const login = useCallback(async (email: string, password: string, tenantSlug?: string) => {
    const { accessToken, user: u } = await authApi.login(email, password, tenantSlug);
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(accessToken);
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
