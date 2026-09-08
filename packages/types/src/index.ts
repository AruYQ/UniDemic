/**
 * Core User entity definition across UniDemic apps
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  [key: string]: unknown;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
  university?: string | null;
  major?: string | null;
  student_id?: string | null;
  phone?: string | null;
  preferences: UserPreferences;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserToken {
  id: number;
  name: string;
  last_used_at?: string | null;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface AuthResponseData {
  user: User;
  token: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  university?: string;
  major?: string;
  student_id?: string;
  phone?: string;
  device_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  avatar_url?: string | null;
  bio?: string | null;
  university?: string | null;
  major?: string | null;
  student_id?: string | null;
  phone?: string | null;
  preferences?: Partial<UserPreferences>;
}

export interface UpdatePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}
