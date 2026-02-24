// Base URL must be valid at runtime (NEXT_PUBLIC_* can be undefined in some builds)
const getApiBaseUrl = (): string => {
  const base = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? '')
    : (process.env.NEXT_PUBLIC_API_URL ?? '');
  const trimmed = (base || 'http://localhost:3001/api').trim().replace(/\/$/, '');
  return trimmed || 'http://localhost:3001/api';
};

const TOKEN_KEY = 'iictms_token';
const USER_KEY = 'iictms_user';

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';
export const SESSION_EXPIRED_NOTICE_KEY = 'iictms_notice_session_expired';

export type UnauthorizedEventDetail = {
  message: string;
  status: number;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function extractMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const value = (payload as { message?: unknown }).message;
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string' && item.trim());
    if (typeof first === 'string') return first;
  }
  return fallback;
}

function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function handleUnauthorized(status: number, message: string, hadToken: boolean): void {
  if (status !== 401 || typeof window === 'undefined') return;
  clearStoredSession();
  if (!hadToken) return;
  window.dispatchEvent(
    new CustomEvent<UnauthorizedEventDetail>(AUTH_UNAUTHORIZED_EVENT, {
      detail: { status, message },
    }),
  );
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const pathNorm = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${pathNorm}`;

  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (networkError) {
    const msg = networkError instanceof Error ? networkError.message : 'Network error';
    if (msg === 'Failed to fetch' || (networkError as Error & { code?: string })?.code === 'ECONNREFUSED') {
      throw new Error(`Cannot reach the server. Make sure the backend is running and reachable at ${baseUrl}`);
    }
    throw new Error(msg);
  }

  if (!res.ok) {
    const errPayload = await res.json().catch(() => ({ message: res.statusText }));
    const message = extractMessage(errPayload, res.statusText || 'Request failed');
    handleUnauthorized(res.status, message, !!token);
    throw new ApiError(message, res.status, errPayload);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// Upload a file (e.g. Excel) to an import endpoint.
// Do not set Content-Type so browser sets multipart boundary.
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const pathNorm = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${pathNorm}`;
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { method: 'POST', body: formData, headers });
  if (!res.ok) {
    const errPayload = await res.json().catch(() => ({ message: res.statusText }));
    const message = extractMessage(errPayload, res.statusText || 'Upload failed');
    handleUnauthorized(res.status, message, !!token);
    throw new ApiError(message, res.status, errPayload);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const authApi = {
  login: (tenantSlug: string, email: string, password: string) =>
    api<{ accessToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ tenantSlug, email, password }),
    }),
  me: () => api<{ user: AuthUser }>('/auth/me'),
};

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
  tenantSlug?: string;
}
