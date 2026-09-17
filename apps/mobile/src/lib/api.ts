import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getAuthToken, removeAuthToken } from '../utils/secureStore';

// Auto-detect host IP for Expo Go, Emulator, and Web
const getDefaultApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api';
  }

  // When running via Expo Go on physical device, hostUri contains the PC's Wi-Fi IP (e.g. "192.168.1.39:8081")
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000/api`;
  }

  // Fallback for Android emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }

  // Fallback for physical device on local Wi-Fi
  return 'http://192.168.1.39:8000/api';
};

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl();

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach token
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle unauthenticated or server errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeAuthToken();
    }
    return Promise.reject(error);
  }
);

/**
 * Format and sanitize API error messages, preventing raw SQL / internal database
 * exceptions from leaking into user-facing alerts or toasts.
 */
export function formatApiError(err: any, fallback = 'Terjadi kesalahan pada sistem. Silakan coba lagi.'): string {
  const msg = err?.response?.data?.message || err?.message;
  if (!msg) return fallback;
  if (
    typeof msg === 'string' &&
    (msg.includes('SQLSTATE') ||
      msg.includes('relation "') ||
      msg.includes('syntax error') ||
      msg.includes('Base table or view not found') ||
      msg.includes('Undefined table'))
  ) {
    return 'Terjadi kendala pada sinkronisasi server database. Silakan coba lagi.';
  }
  return msg;
}

export default api;

