// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, setToken, getToken, type ApiUser } from '../services/api';

interface AuthCtx {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null, token: null, isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<ApiUser | null>(() => {
    const s = localStorage.getItem('admin_user');
    return s ? JSON.parse(s) : null;
  });
  const [token, setTokenState] = useState<string | null>(getToken);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) setToken(token);
  }, [token]);

  async function login(email: string, password: string): Promise<void> {
    setIsLoading(true);
    try {
      const res = await apiLogin(email, password);
      const tok = (res.token ?? res.access_token ?? '') as string;
      if (!tok) throw new Error('Token tidak ditemukan');
      setToken(tok);
      setTokenState(tok);
      const u = (res.user ?? res) as ApiUser;
      setUser(u);
      localStorage.setItem('admin_user', JSON.stringify(u));
    } finally {
      setIsLoading(false);
    }
  }

  async function logout(): Promise<void> {
    await apiLogout();
    setUser(null);
    setTokenState(null);
    localStorage.removeItem('admin_user');
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthCtx => useContext(AuthContext);
