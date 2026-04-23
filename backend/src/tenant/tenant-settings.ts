import { Tenant } from './tenant.entity';
import { Role } from '../common/roles';

export const TENANT_MODULE_IDS = [
  'dashboard',
  'assets',
  'licenses',
  'applications',
  'staff',
  'policies',
  'cybersecurity',
  'risk-compliance',
  'vendors-contracts',
  'projects',
  'change-management',
  'data-governance',
  'service-desk',
  'executive',
  'user-accounts',
  'settings',
] as const;

export type TenantModuleId = (typeof TENANT_MODULE_IDS)[number];

export const CORE_TENANT_MODULE_IDS: TenantModuleId[] = ['dashboard', 'user-accounts', 'settings'];
export const OPTIONAL_TENANT_MODULE_IDS = TENANT_MODULE_IDS.filter(
  (id) => !CORE_TENANT_MODULE_IDS.includes(id),
) as TenantModuleId[];

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

export type TenantExperienceSettings = {
  tenantId: string;
  tenantSlug: string;
  branding: TenantBrandingSettings;
  theme: TenantThemeSettings;
  modules: {
    enabled: TenantModuleId[];
  };
  access: {
    roleModules: Record<Role, TenantModuleId[]>;
  };
};

const DEFAULT_SYSTEM_NAME = 'I-ICTMS';
const DEFAULT_CURRENCY = 'NAD';
const DEFAULT_TAGLINE = 'YOUR ICT COMMAND CENTRE';
const DEFAULT_LOGIN_HEADLINE = 'Your digital workspace for everyday ICT management.';
const DEFAULT_LOGIN_SUBTEXT =
  'Use I-ICTMS to manage assets and licenses, track applications, oversee ICT staff and skills, and report on risk and performance securely, in one place.';
const DEFAULT_PRIMARY_COLOR = '#0d2137';
const DEFAULT_SECONDARY_COLOR = '#c9a227';
const DEFAULT_BACKGROUND_COLOR = '#f0f2f5';
const ACCESS_MANAGED_MODULE_IDS = OPTIONAL_TENANT_MODULE_IDS;

const DEFAULT_ROLE_MODULES: Record<Role, TenantModuleId[]> = {
  [Role.OWNER]: [...ACCESS_MANAGED_MODULE_IDS],
  [Role.ICT_MANAGER]: [...ACCESS_MANAGED_MODULE_IDS],
  [Role.ICT_STAFF]: [...ACCESS_MANAGED_MODULE_IDS],
  [Role.BUSINESS_MANAGER]: [...ACCESS_MANAGED_MODULE_IDS],
  [Role.EXECUTIVE]: [...ACCESS_MANAGED_MODULE_IDS],
  [Role.AUDITOR]: [...ACCESS_MANAGED_MODULE_IDS],
  [Role.VENDOR]: [...ACCESS_MANAGED_MODULE_IDS],
};

function normalizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : fallback;
}

function normalizeText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function normalizeOptionalText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeModuleIds(value: unknown): TenantModuleId[] {
  const requested = Array.isArray(value)
    ? value.filter((item): item is TenantModuleId => TENANT_MODULE_IDS.includes(item as TenantModuleId))
    : [];
  const enabled = new Set<TenantModuleId>([...CORE_TENANT_MODULE_IDS, ...requested]);
  return TENANT_MODULE_IDS.filter((id) => enabled.has(id));
}

function normalizeRoleModuleIds(value: unknown, role: Role): TenantModuleId[] {
  const defaults = DEFAULT_ROLE_MODULES[role] ?? ACCESS_MANAGED_MODULE_IDS;
  if (!Array.isArray(value)) return [...defaults];
  return ACCESS_MANAGED_MODULE_IDS.filter((id) => value.includes(id));
}

export function normalizeTenantSettings(tenant: Tenant): TenantExperienceSettings {
  const settings = tenant.settings && typeof tenant.settings === 'object' ? tenant.settings : {};
  const branding = settings && typeof settings === 'object' && 'branding' in settings && typeof settings.branding === 'object'
    ? (settings.branding as Record<string, unknown>)
    : {};
  const theme = settings && typeof settings === 'object' && 'theme' in settings && typeof settings.theme === 'object'
    ? (settings.theme as Record<string, unknown>)
    : {};
  const modules = settings && typeof settings === 'object' && 'modules' in settings && typeof settings.modules === 'object'
    ? (settings.modules as Record<string, unknown>)
    : {};
  const access = settings && typeof settings === 'object' && 'access' in settings && typeof settings.access === 'object'
    ? (settings.access as Record<string, unknown>)
    : {};
  const roleModules = access && typeof access.roleModules === 'object'
    ? (access.roleModules as Partial<Record<Role, unknown>>)
    : {};

  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    branding: {
      organizationName: normalizeText(branding.organizationName ?? tenant.name, tenant.name),
      systemName: normalizeText(branding.systemName, DEFAULT_SYSTEM_NAME),
      logoUrl: normalizeOptionalText(branding.logoUrl ?? tenant.logoUrl),
      tagline: normalizeText(branding.tagline, DEFAULT_TAGLINE),
      loginHeadline: normalizeText(branding.loginHeadline, DEFAULT_LOGIN_HEADLINE),
      loginSubtext: normalizeText(branding.loginSubtext, DEFAULT_LOGIN_SUBTEXT),
      currency: normalizeText(branding.currency, DEFAULT_CURRENCY),
    },
    theme: {
      primaryColor: normalizeHexColor(theme.primaryColor, DEFAULT_PRIMARY_COLOR),
      secondaryColor: normalizeHexColor(theme.secondaryColor, DEFAULT_SECONDARY_COLOR),
      backgroundColor: normalizeHexColor(theme.backgroundColor, DEFAULT_BACKGROUND_COLOR),
    },
    modules: {
      enabled: normalizeModuleIds(modules.enabled),
    },
    access: {
      roleModules: {
        [Role.OWNER]: normalizeRoleModuleIds(roleModules[Role.OWNER], Role.OWNER),
        [Role.ICT_MANAGER]: normalizeRoleModuleIds(roleModules[Role.ICT_MANAGER], Role.ICT_MANAGER),
        [Role.ICT_STAFF]: normalizeRoleModuleIds(roleModules[Role.ICT_STAFF], Role.ICT_STAFF),
        [Role.BUSINESS_MANAGER]: normalizeRoleModuleIds(roleModules[Role.BUSINESS_MANAGER], Role.BUSINESS_MANAGER),
        [Role.EXECUTIVE]: normalizeRoleModuleIds(roleModules[Role.EXECUTIVE], Role.EXECUTIVE),
        [Role.AUDITOR]: normalizeRoleModuleIds(roleModules[Role.AUDITOR], Role.AUDITOR),
        [Role.VENDOR]: normalizeRoleModuleIds(roleModules[Role.VENDOR], Role.VENDOR),
      },
    },
  };
}

export function serializeTenantSettings(settings: TenantExperienceSettings): Record<string, unknown> {
  return {
    branding: settings.branding,
    theme: settings.theme,
    modules: settings.modules,
    access: settings.access,
  };
}

export function canRoleAccessTenantModule(
  settings: TenantExperienceSettings,
  role: Role,
  moduleId: TenantModuleId,
): boolean {
  if (moduleId === 'dashboard') return true;
  if (moduleId === 'settings' || moduleId === 'user-accounts') return role === Role.ICT_MANAGER;
  if (!settings.modules.enabled.includes(moduleId)) return false;
  const allowedModules = settings.access.roleModules[role] ?? DEFAULT_ROLE_MODULES[role] ?? [];
  return allowedModules.includes(moduleId);
}
