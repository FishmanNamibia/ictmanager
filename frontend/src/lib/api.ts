// Base URL must be valid at runtime (NEXT_PUBLIC_* can be undefined in some builds)
const getApiBaseUrl = (): string => {
  const base = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? '')
    : (process.env.NEXT_PUBLIC_API_URL ?? '');
  const trimmed = (base || 'http://localhost:3001/api').trim().replace(/\/$/, '');
  return trimmed || 'http://localhost:3001/api';
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('iictms_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
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
      throw new Error('Cannot reach the server. Make sure the backend is running (e.g. npm run dev in backend) and reachable at ' + baseUrl);
    }
    throw new Error(msg);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
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
