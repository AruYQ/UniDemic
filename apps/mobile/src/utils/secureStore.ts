import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'unidemic_auth_token';
const REFRESH_TOKEN_KEY = 'unidemic_refresh_token';

export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('[SecureStorage] Error setting item:', error);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('[SecureStorage] Error getting item:', error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('[SecureStorage] Error removing item:', error);
    }
  },
};

export const getAuthToken = () => secureStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token: string) => secureStorage.setItem(TOKEN_KEY, token);
export const removeAuthToken = () => secureStorage.removeItem(TOKEN_KEY);

export const getRefreshToken = () => secureStorage.getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token: string) => secureStorage.setItem(REFRESH_TOKEN_KEY, token);
export const removeRefreshToken = () => secureStorage.removeItem(REFRESH_TOKEN_KEY);
