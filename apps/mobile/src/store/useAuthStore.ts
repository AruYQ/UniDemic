import { create } from 'zustand';
import api, { BASE_URL } from '../lib/api';
import { getAuthToken, setAuthToken, removeAuthToken } from '../utils/secureStore';

export interface User {
  id: number;
  name: string;
  email: string;
  university?: string | null;
  major?: string | null;
  student_id?: string | null;
  phone?: string | null;
  avatar?: string | null;
  preferences?: {
    theme?: string;
    notifications?: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initAuth: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    university?: string;
    major?: string;
    student_id?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function parseApiError(err: any, fallbackMessage: string): string {
  // Case 1: Tidak ada response dari server (Network error / server unreachable)
  if (!err.response) {
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return `[Kesalahan Koneksi] Waktu permintaan habis (timeout). Server tidak merespon di: ${BASE_URL}`;
    }
    return `[Kesalahan Jaringan] Tidak dapat terhubung ke server backend di ${BASE_URL}. Pastikan Docker menyala dan HP/perangkat berada di jaringan yang sama.`;
  }

  const status = err.response.status;
  const data = err.response.data;

  // Case 2: Kesalahan input user / validasi form (422)
  if (status === 422) {
    if (data?.errors) {
      const fieldKeys = Object.keys(data.errors);
      if (fieldKeys.length > 0) {
        const firstField = fieldKeys[0];
        const firstMessage = data.errors[firstField]?.[0];
        return `[Kesalahan Input] ${firstMessage || 'Periksa kembali formulir Anda.'}`;
      }
    }
    return `[Kesalahan Input] ${data?.message || 'Data yang Anda masukkan tidak valid.'}`;
  }

  // Case 3: Kredensial tidak cocok (401)
  if (status === 401) {
    return `[Kredensial Salah] Email atau kata sandi yang Anda masukkan salah.`;
  }

  // Case 4: Rate limit (429)
  if (status === 429) {
    return `[Terlalu Banyak Percobaan] Terlalu banyak percobaan masuk. Silakan tunggu 1 menit.`;
  }

  // Case 5: Akses dilarang (403)
  if (status === 403) {
    return `[Akses Ditolak] Akun Anda tidak memiliki hak akses.`;
  }

  // Case 6: Kesalahan Server (500+)
  if (status >= 500) {
    return `[Kesalahan Server (${status})] Terjadi masalah internal pada server: ${data?.message || 'Internal Server Error'}`;
  }

  return data?.message || fallbackMessage;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  initAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = await getAuthToken();
      if (!token) {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const res = await api.get('/profile');
      if (res.data?.success && res.data?.data) {
        set({
          user: res.data.data,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        await removeAuthToken();
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      await removeAuthToken();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post('/auth/login', credentials);
      const data = res.data?.data;
      if (data?.token) {
        await setAuthToken(data.token);
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error('Token tidak ditemukan pada respon.');
      }
    } catch (err: any) {
      const errorMessage = parseApiError(err, 'Gagal masuk. Periksa email dan kata sandi Anda.');
      set({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  register: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post('/auth/register', payload);
      const data = res.data?.data;
      if (data?.token) {
        await setAuthToken(data.token);
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error('Registrasi berhasil namun token tidak ditemukan.');
      }
    } catch (err: any) {
      const errorMessage = parseApiError(err, 'Registrasi gagal. Silakan coba lagi.');
      set({ isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('[AuthStore] Error during logout API call', err);
    } finally {
      await removeAuthToken();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },
}));
