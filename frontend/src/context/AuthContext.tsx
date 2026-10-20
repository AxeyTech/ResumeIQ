import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, username?: string) => Promise<{ needsVerification: boolean; email: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  updateProfile: (data: { name?: string; username?: string; avatarUrl?: string | null }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  deleteAvatar: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('resumeiq_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('resumeiq_token');
      if (storedToken) {
        try {
          const { user } = await api.getMe();
          setUser(user);
          setToken(storedToken);
        } catch (err) {
          console.error('Session expired or invalid:', err);
          localStorage.removeItem('resumeiq_token');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.token) {
      localStorage.setItem('resumeiq_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
  };

  const register = async (name: string, email: string, password: string, username?: string) => {
    const res = await api.register(name, email, password, username);
    // Registration now requires email verification — no token returned yet
    return { needsVerification: !res.token, email };
  };

  const verifyEmail = async (email: string, code: string) => {
    const res = await api.verifyEmail(email, code);
    if (res.token) {
      localStorage.setItem('resumeiq_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
  };

  const updateProfile = async (data: { name?: string; username?: string; avatarUrl?: string | null }) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
  };

  const uploadAvatar = async (file: File) => {
    const res = await api.uploadAvatar(file);
    setUser(res.user);
  };

  const deleteAvatar = async () => {
    const res = await api.deleteAvatar();
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('resumeiq_token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, verifyEmail, updateProfile, uploadAvatar, deleteAvatar, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
