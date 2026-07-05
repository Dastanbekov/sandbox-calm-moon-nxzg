'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: Record<string, string>) => Promise<void>;
  register: (data: Record<string, any>) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateBalance: (amount: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const userData = await authService.getMe();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Attempt to load user on mount (will trigger refresh interceptor if token is missing but cookie exists)
    checkAuth();

    const handleAuthError = () => {
      setUser(null);
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  const login = async (credentials: Record<string, string>) => {
    const data = await authService.login(credentials);
    if (data && data.user) {
      setUser(data.user);
    } else {
      setUser(data); // Fallback in case the user object is returned directly
    }
  };

  const register = async (data: Record<string, any>) => {
    const resData = await authService.register(data);
    // User is NOT logged in upon registration; they must verify email.
  };

  const verifyEmail = async (token: string) => {
    const resData = await authService.verifyEmail(token);
    if (resData && resData.user) {
      setUser(resData.user);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateBalance = (amount: number) => {
    setUser(prev => {
      if (!prev) return null;
      const currentBalance = typeof prev.balance === 'number' ? prev.balance : parseFloat(String(prev.balance)) || 0;
      return {
        ...prev,
        balance: currentBalance + amount
      };
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, verifyEmail, logout, checkAuth, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
