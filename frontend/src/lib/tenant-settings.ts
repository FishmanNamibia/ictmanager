export const APP_MODULES = [
  { id: 'dashboard', path: '/dashboard', label: 'My Desk', description: 'Operational landing page and summary dashboard.', core: true },
  { id: 'assets', path: '/assets', label: 'Assets', description: 'Asset register, lifecycle, stock control, and audit tracking.', core: false },
  { id: 'licenses', path: '/licenses', label: 'Licenses', description: 'Software license management and renewal oversight.', core: false },
  { id: 'applications', path: '/applications', label: 'Applications', description: 'Application portfolio and ownership tracking.', core: false },
  { id: 'staff', path: '/staff', label: 'Staff & Skills', description: 'ICT staffing, capacity, and skills management.', core: false },
  { id: 'policies', path: '/policies', label: 'ICT Policies', description: 'Policy register, acknowledgements, and reviews.', core: false },
  { id: 'cybersecurity', path: '/cybersecurity', label: 'Cybersecurity', description: 'Security controls, incidents, and monitoring.', core: false },
  { id: 'risk-compliance', path: '/risk-compliance', label: 'ICT Risk & Compliance', description: 'Risks, compliance evidence, and DR oversight.', core: false },
  { id: 'vendors-contracts', path: '/vendors-contracts', label: 'Vendors & Contracts', description: 'Supplier register, contracts, and renewals.', core: false },
  { id: 'projects', path: '/projects', label: 'ICT Projects', description: 'ICT project pipeline and status tracking.', core: false },
  { id: 'change-management', path: '/change-management', label: 'Change Management', description: 'Change requests, CAB visibility, and approvals.', core: false },
  { id: 'data-governance', path: '/data-governance', label: 'Data Governance', description: 'Data stewardship and governance controls.', core: false },
  { id: 'service-desk', path: '/service-desk', label: 'Service Desk', description: 'Tickets, service levels, and support demand.', core: false },
  { id: 'executive', path: '/executive', label: 'Executive View', description: 'Board and EXCO reporting with executive summaries.', core: false },
  {
    id: 'user-accounts',
    path: '/user-accounts',
    label: 'User accounts',
    description: 'Create login users for your organisation and assign application roles.',
    core: true,
    roles: ['ict_manager'],
  },
  { id: 'settings', path: '/settings', label: 'Settings', description: 'Tenant branding, theme, and enabled module setup.', core: true, roles: ['ict_manager'] },
] as const;

export type AppModuleId = (typeof APP_MODULES)[number]['id'];
export const APP_ROLES = [
  { id: 'ict_manager', label: 'ICT Manager' },
  { id: 'ict_staff', label: 'ICT Staff' },
  { id: 'business_manager', label: 'Business Manager' },
  { id: 'executive', label: 'Executive' },
  { id: 'auditor', label: 'Auditor' },
  { id: 'vendor', label: 'Vendor' },
] as const;

export type AppUserRole = (typeof APP_ROLES)[number]['id'];
export const ROLE_MANAGED_MODULES = APP_MODULES.filter((item) => !item.core).map((item) => item.id) as AppModuleId[];

const DEFAULT_ROLE_MODULES: Record<AppUserRole, AppModuleId[]> = {
  ict_manager: [...ROLE_MANAGED_MODULES],
  ict_staff: [...ROLE_MANAGED_MODULES],
  business_manager: [...ROLE_MANAGED_MODULES],
  executive: [...ROLE_MANAGED_MODULES],
  auditor: [...ROLE_MANAGED_MODULES],
  vendor: [...ROLE_MANAGED_MODULES],
};

export const SUPPORTED_CURRENCIES = [
  { value: 'NAD', label: 'NAD – Namibian Dollar' },
  { value: 'USD', label: 'USD – US Dollar' },
  { value: 'ZAR', label: 'ZAR – South African Rand' },
  { value: 'EUR', label: 'EUR – Euro' },
  { value: 'GBP', label: 'GBP – British Pound' },
  { value: 'BWP', label: 'BWP – Botswana Pula' },
  { value: 'ZMW', label: 'ZMW – Zambian Kwacha' },
  { value: 'KES', label: 'KES – Kenyan Shilling' },
  { value: 'NGN', label: 'NGN – Nigerian Naira' },
  { value: 'GHS', label: 'GHS – Ghanaian Cedi' },
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]['value'];

export type TenantBrandingSettings = {
  organizationName: string;
  systemName: string;
  logoUrl: string;
  tagline: string;
  loginHeadline: string;
  loginSubtext: string;
  currency: string;
};

export type TenantThemeSettings = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
};

export type TenantSettings = {
  tenantId: string;
  tenantSlug: string;
  branding: TenantBrandingSettings;
  theme: TenantThemeSettings;
  modules: {
    enabled: AppModuleId[];
  };
  access: {
    roleModules: Record<AppUserRole, AppModuleId[]>;
  };
};

export type PublicTenantBranding = Pick<TenantSettings, 'tenantId' | 'tenantSlug' | 'branding' | 'theme'>;

export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  tenantId: '',
  tenantSlug: '',
  branding: {
    organizationName: 'Integrated ICT Management System',
    systemName: 'I-ICTMS',
    logoUrl: '',
    tagline: 'YOUR ICT COMMAND CENTRE',
    loginHeadline: 'Your digital workspace for everyday ICT management.',
    loginSubtext:
      'Use I-ICTMS to manage assets and licenses, track applications, oversee ICT staff and skills, and report on risk and performance securely, in one place.',
    currency: 'NAD',
  },
  theme: {
    primaryColor: '#0d2137',
    secondaryColor: '#c9a227',
    backgroundColor: '#f0f2f5',
  },
  modules: {
    enabled: APP_MODULES.map((item) => item.id),
  },
  access: {
    roleModules: DEFAULT_ROLE_MODULES,
  },
};

export const OPTIONAL_APP_MODULES = APP_MODULES.filter((item) => !item.core);

export function normalizeTenantSettings(input?: Partial<TenantSettings> | null): TenantSettings {
  const enabled = Array.isArray(input?.modules?.enabled)
    ? APP_MODULES
        .map((item) => item.id)
        .filter((id) => input?.modules?.enabled?.includes(id))
    : DEFAULT_TENANT_SETTINGS.modules.enabled;

  const withCore = Array.from(
    new Set([
      ...APP_MODULES.filter((item) => item.core).map((item) => item.id),
      ...enabled,
    ]),
  ) as AppModuleId[];

  const normalizedRoleModules = APP_ROLES.reduce<Record<AppUserRole, AppModuleId[]>>((acc, role) => {
    const requested = input?.access?.roleModules?.[role.id];
    acc[role.id] = Array.isArray(requested)
      ? ROLE_MANAGED_MODULES.filter((moduleId) => requested.includes(moduleId))
      : [...DEFAULT_ROLE_MODULES[role.id]];
    return acc;
  }, {} as Record<AppUserRole, AppModuleId[]>);

  return {
    tenantId: input?.tenantId ?? DEFAULT_TENANT_SETTINGS.tenantId,
    tenantSlug: input?.tenantSlug ?? DEFAULT_TENANT_SETTINGS.tenantSlug,
    branding: {
      ...DEFAULT_TENANT_SETTINGS.branding,
      ...input?.branding,
    },
    theme: {
      ...DEFAULT_TENANT_SETTINGS.theme,
      ...input?.theme,
    },
    modules: {
      enabled: APP_MODULES.map((item) => item.id).filter((id) => withCore.includes(id)),
    },
    access: {
      roleModules: normalizedRoleModules,
    },
  };
}

export function isModuleEnabled(settings: TenantSettings, moduleId: AppModuleId): boolean {
  const module = APP_MODULES.find((item) => item.id === moduleId);
  if (!module) return false;
  if (module.core) return true;
  return settings.modules.enabled.includes(moduleId);
}

export function canAccessModule(settings: TenantSettings, moduleId: AppModuleId, role?: string | null): boolean {
  const module = APP_MODULES.find((item) => item.id === moduleId);
  if (!module || !role) return false;
  if (moduleId === 'dashboard') return true;
  if (moduleId === 'settings' || moduleId === 'user-accounts') return role === 'ict_manager';
  if (!isModuleEnabled(settings, moduleId)) return false;
  const roleId = APP_ROLES.find((item) => item.id === role)?.id;
  if (!roleId) return false;
  return settings.access.roleModules[roleId].includes(moduleId);
}

export function getModuleForPath(pathname: string) {
  return [...APP_MODULES]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)) ?? null;
}
