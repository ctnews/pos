import type { AuthUser, Product, Sale, UserRole } from '../types';
import { STORAGE_KEYS } from '../constants/storageKeys';

const BASE = '/api';

function loadToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.authToken);
}

let authToken: string | null = loadToken();

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) {
    sessionStorage.setItem(STORAGE_KEYS.authToken, token);
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.authToken);
  }
}

export function loadStoredUser(): AuthUser | null {
  const raw = sessionStorage.getItem(STORAGE_KEYS.authUser);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: AuthUser | null): void {
  if (user) {
    sessionStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.authUser);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

export interface BootstrapData {
  products: Product[];
  sales: Sale[];
  taxRate: number;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  me: () => request<{ user: AuthUser }>('/auth/me'),

  bootstrap: () => request<BootstrapData>('/bootstrap'),

  createProduct: (product: Omit<Product, 'id'>) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(product) }),

  updateProduct: (id: number, product: Omit<Product, 'id'>) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),

  deleteProduct: (id: number) =>
    request<{ ok: boolean }>(`/products/${id}`, { method: 'DELETE' }),

  deleteProducts: (ids: number[]) =>
    request<{ deleted: number }>('/products/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),

  checkout: (items: { id: number; quantity: number }[]) =>
    request<{ sale: Sale; products: Product[] }>('/sales/checkout', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  clearSales: () => request<{ ok: boolean }>('/sales', { method: 'DELETE' }),

  updateTaxRate: (taxRate: number) =>
    request<{ taxRate: number }>('/settings/tax-rate', {
      method: 'PATCH',
      body: JSON.stringify({ taxRate }),
    }),

  getUsers: () => request<AuthUser[]>('/users'),

  createUser: (input: { username: string; password: string; role: UserRole }) =>
    request<AuthUser>('/users', { method: 'POST', body: JSON.stringify(input) }),

  updateUser: (
    id: number,
    input: { username?: string; password?: string; role?: UserRole },
  ) => request<AuthUser>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(input) }),

  deleteUser: (id: number) =>
    request<{ ok: boolean }>(`/users/${id}`, { method: 'DELETE' }),

  saveQrCode: (productCode: string, dataUrl: string) =>
    request<{ ok: boolean }>(`/qr-codes/${encodeURIComponent(productCode)}`, {
      method: 'PUT',
      body: JSON.stringify({ dataUrl }),
    }),
};
