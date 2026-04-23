import { PublicTenantBranding, TenantSettings } from '@/lib/tenant-settings';

// Base URL must be valid at runtime (NEXT_PUBLIC_* can be undefined in some builds)
export const getApiBaseUrl = (): string => {
  const runtimeDefault = '/api';
  const base = process.env.NEXT_PUBLIC_API_URL ?? runtimeDefault;
  const trimmed = (base || runtimeDefault).trim().replace(/\/$/, '');
  return trimmed || '/api';
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
  login: (email: string, password: string, tenantSlug?: string) =>
    api<{ accessToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...(tenantSlug ? { tenantSlug } : {}) }),
    }),
  tenantsForEmail: (email: string) =>
    api<{ slug: string; name: string }[]>('/auth/tenants-for-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  me: () => api<{ user: AuthUser }>('/auth/me'),
};

export const tenantApi = {
  getCurrentSettings: () => api<TenantSettings>('/tenants/settings/current'),
  updateCurrentSettings: (payload: Record<string, unknown>) =>
    api<TenantSettings>('/tenants/settings/current', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getBrandingBySlug: (slug: string) =>
    api<PublicTenantBranding>(`/tenants/branding/by-slug/${encodeURIComponent(slug)}`),
  getDefaultBranding: () =>
    api<PublicTenantBranding>('/tenants/branding/default'),
};

export interface AppNotification {
  id: string;
  type: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  linkUrl: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisasterRecoveryPlan {
  id: string;
  applicationId: string | null;
  planName: string;
  status: string;
  recoveryTier: string;
  failoverType: string;
  recoverySite: string | null;
  alternateSite: string | null;
  recoveryOwner: string | null;
  communicationOwner: string | null;
  activationTrigger: string | null;
  backupStrategy: string | null;
  replicationScope: string | null;
  dependencies: string | null;
  runbookUrl: string | null;
  lastDrTestDate: string | null;
  nextDrTestDate: string | null;
  lastBackupVerificationDate: string | null;
  nextBackupVerificationDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisasterRecoveryInsight {
  applicationId: string;
  applicationName: string;
  severity: 'low' | 'medium' | 'high';
  status: 'attention_needed' | 'covered';
  issues: string[];
  owner: string | null;
  planId: string | null;
  planStatus: string | null;
  failoverType: string | null;
  dependencyCount: number;
  backupAssignmentCount: number;
}

export interface DisasterRecoveryOverview {
  summary: {
    totalPlans: number;
    activePlans: number;
    automatedFailoverPlans: number;
    plansNeedingReview: number;
    uncoveredCriticalApps: number;
  };
  items: DisasterRecoveryInsight[];
}

export const notificationApi = {
  list: (limit = 12) =>
    api<{ items: AppNotification[]; unreadCount: number }>(`/notifications?limit=${limit}`),
  markRead: (id: string) =>
    api<AppNotification | null>(`/notifications/${id}/read`, {
      method: 'POST',
    }),
  markAllRead: () =>
    api<{ items: AppNotification[]; unreadCount: number }>('/notifications/read-all', {
      method: 'POST',
    }),
};

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
  tenantSlug?: string;
}

export interface AssetRecord {
  id: string;
  assetTag: string;
  barcode: string | null;
  name: string;
  description: string | null;
  type: string;
  assetSubtype: string | null;
  status: string;
  condition: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  ipAddress: string | null;
  purchaseDate: string | null;
  warrantyEnd: string | null;
  expectedEndOfLife: string | null;
  cost: number | null;
  usefulLifeMonths: number | null;
  supplier: string | null;
  maintenanceProvider: string | null;
  maintenanceFrequencyMonths: number | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  maintenanceContractEnd: string | null;
  poNumber: string | null;
  batteryInstallDate: string | null;
  batteryReplacementDue: string | null;
  loadCapacityKva: number | null;
  runtimeMinutes: number | null;
  protectedSystems: string | null;
  assignedToUserId: string | null;
  assignedToName: string | null;
  assignedToDepartment: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetMovementRecord {
  id: string;
  movementType: string;
  occurredAt: string;
  quantity: number;
  fromLocation: string | null;
  toLocation: string | null;
  fromAssignedToName: string | null;
  toAssignedToName: string | null;
  fromDepartment: string | null;
  toDepartment: string | null;
  fromStatus: string | null;
  newStatus: string | null;
  fromCondition: string | null;
  newCondition: string | null;
  reason: string | null;
  notes: string | null;
  approvalRequired: boolean;
  approvalStatus: string;
  requestedByName: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  approvalComment: string | null;
  createdAt: string;
}

export interface AssetVerificationRecord {
  id: string;
  verificationType: string;
  checkedAt: string;
  checkedByName: string | null;
  systemLocation: string | null;
  actualLocation: string | null;
  systemAssignedToName: string | null;
  actualAssignedToName: string | null;
  systemDepartment: string | null;
  actualDepartment: string | null;
  systemStatus: string | null;
  actualStatus: string | null;
  systemCondition: string | null;
  actualCondition: string | null;
  varianceDetected: boolean;
  varianceSummary: string | null;
  resolved: boolean;
  resolutionNote: string | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AssetDocumentRecord {
  id: string;
  documentType: string;
  title: string;
  referenceNumber: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AssetAuditRecord {
  id: string;
  action: string;
  userId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

export interface AssetControlOverview {
  summary: {
    totalAssets: number;
    assignedAssets: number;
    documentedAssets: number;
    movementsLast30Days: number;
    pendingApprovals: number;
    openVariances: number;
    assetsVerifiedLast90Days: number;
    expiredWarranty: number;
    maintenanceDue: number;
  };
}

export interface AssetReportsSummary {
  summary: {
    totalAssets: number;
    assignedAssets: number;
    documentedAssets: number;
    movementCount: number;
    openVariances: number;
    disposedAssets: number;
  };
  stockBalance: Array<{
    category: string;
    subtype: string;
    total: number;
    assigned: number;
    available: number;
    maintenance: number;
    disposed: number;
  }>;
  departmentInventory: Array<{
    department: string;
    total: number;
    inUse: number;
    maintenance: number;
    disposed: number;
  }>;
  movements: Array<{
    id: string;
    assetId: string;
    movementType: string;
    occurredAt: string;
    fromLocation: string | null;
    toLocation: string | null;
    fromAssignedToName: string | null;
    toAssignedToName: string | null;
    approvalStatus: string;
    reason: string | null;
  }>;
  variances: Array<{
    id: string;
    assetId: string;
    checkedAt: string;
    varianceDetected: boolean;
    varianceSummary: string | null;
    resolved: boolean;
    resolvedAt: string | null;
    checkedByName: string | null;
  }>;
  disposedItems: Array<{
    id: string;
    assetTag: string;
    name: string;
    location: string | null;
    assignedToName: string | null;
    updatedAt: string;
  }>;
  assetAgeing: Array<{
    label: string;
    count: number;
  }>;
  auditTrail: Array<{
    id: string;
    action: string;
    entityId: string | null;
    userId: string | null;
    ip: string | null;
    createdAt: string;
  }>;
}

export const assetApi = {
  list: () => api<AssetRecord[]>('/assets'),
  create: (payload: Record<string, unknown>) =>
    api<AssetRecord>('/assets', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Record<string, unknown>) =>
    api<AssetRecord>(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: string) => api<void>(`/assets/${id}`, { method: 'DELETE' }),
  controlOverview: () => api<AssetControlOverview>('/assets/control-overview'),
  history: (id: string) => api<AssetAuditRecord[]>(`/assets/${id}/history`),
  movements: (id: string) => api<AssetMovementRecord[]>(`/assets/${id}/movements`),
  createMovement: (id: string, payload: Record<string, unknown>) =>
    api<AssetMovementRecord>(`/assets/${id}/movements`, { method: 'POST', body: JSON.stringify(payload) }),
  approveMovement: (id: string, movementId: string, payload: Record<string, unknown>) =>
    api<AssetMovementRecord>(`/assets/${id}/movements/${movementId}/approval`, { method: 'POST', body: JSON.stringify(payload) }),
  verifications: (id: string) => api<AssetVerificationRecord[]>(`/assets/${id}/verifications`),
  createVerification: (id: string, payload: Record<string, unknown>) =>
    api<AssetVerificationRecord>(`/assets/${id}/verifications`, { method: 'POST', body: JSON.stringify(payload) }),
  resolveVerification: (id: string, verificationId: string, payload: Record<string, unknown>) =>
    api<AssetVerificationRecord>(`/assets/${id}/verifications/${verificationId}/resolve`, { method: 'POST', body: JSON.stringify(payload) }),
  documents: (id: string) => api<AssetDocumentRecord[]>(`/assets/${id}/documents`),
  reports: () => api<AssetReportsSummary>('/assets/reports/summary'),
  runAlerts: () => api<Record<string, number>>('/assets/alerts/run', { method: 'POST' }),
};
