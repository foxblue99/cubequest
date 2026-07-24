import { create } from 'zustand';
import { api } from '@/lib/api';
import { getAuth, setAuth as setLibAuth, clearAuth as clearLibAuth } from '@/lib/auth';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { role: string; phone: string; password: string; nickname: string; birthYear?: number; city?: string }) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null as User | null,
  token: null as string | null,
  refreshToken: null as string | null,
  isAuthenticated: false,
  isLoading: false,

  login: async (phone, password) => {
    const res = await api.login(phone, password);
    const me = await api.getMe() as { user: User };
    setLibAuth({ token: res.tokens.accessToken, refreshToken: res.tokens.refreshToken, user: me.user });
    set({ token: res.tokens.accessToken, refreshToken: res.tokens.refreshToken, user: me.user, isAuthenticated: true });
  },

  register: async (data) => {
    const res = await api.register(data);
    const me = await api.getMe() as { user: User };
    setLibAuth({ token: res.tokens.accessToken, refreshToken: res.tokens.refreshToken, user: me.user });
    set({ token: res.tokens.accessToken, refreshToken: res.tokens.refreshToken, user: me.user, isAuthenticated: true });
  },

  logout: () => {
    clearLibAuth();
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },
}));
