'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, verifyOtp as apiVerifyOtp, requestOtp as apiRequestOtp } from '@/lib/api/identity';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (phone: string, code: string) => Promise<void>;
  logout: () => void;
  requestOtp: (phone: string) => Promise<void>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  requestOtp: async () => {},
  isLoading: true,
  refreshUser: async () => {},
});

async function fetchMe(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const userData = await fetchMe();
    if (userData) {
      setUser(userData);
      // Token is in httpOnly cookie, we don't store it in state
      // But we need it for API calls, so we'll rely on cookies
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  // Initialize from cookie on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const requestOtp = async (phone: string) => {
    await apiRequestOtp(phone);
  };

  const login = async (phone: string, code: string) => {
    const { token: newToken, user: userData } = await apiVerifyOtp(phone, code);
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, requestOtp, isLoading, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
