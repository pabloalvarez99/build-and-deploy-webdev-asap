import { create } from 'zustand';
import { User } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: false,
  error: null,
  initialized: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error(error.message);

      // Fetch profile for role
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', data.user.id)
        .single();

      set({
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.name || data.user.user_metadata?.name || null,
          role: profile?.role || 'user',
          created_at: data.user.created_at,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al iniciar sesión',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (email: string, password: string, name?: string) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Registration failed');

      // Profile is auto-created by the trigger
      set({
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: name || null,
          role: 'user',
          created_at: data.user.created_at,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al registrarse',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, error: null });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        set({ user: null, isLoading: false, initialized: true });
        return;
      }

      // Fetch profile for role
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single();

      set({
        user: {
          id: user.id,
          email: user.email!,
          name: profile?.name || user.user_metadata?.name || null,
          role: profile?.role || 'user',
          created_at: user.created_at,
        },
        isLoading: false,
        initialized: true,
      });
    } catch {
      set({ user: null, isLoading: false, initialized: true });
    }
  },

  clearError: () => set({ error: null }),
}));
