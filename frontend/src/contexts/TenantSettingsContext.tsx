'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { tenantApi } from '@/lib/api';
import {
  AppModuleId,
  AppUserRole,
  canAccessModule as tenantCanAccessModule,
  DEFAULT_TENANT_SETTINGS,
  isModuleEnabled as isTenantModuleEnabled,
  normalizeTenantSettings,
  TenantSettings,
} from '@/lib/tenant-settings';
import { useAuth } from '@/contexts/AuthContext';

type TenantSettingsContextType = {
  settings: TenantSettings;
  loading: boolean;
  refreshSettings: () => Promise<TenantSettings>;
  updateSettings: (payload: Record<string, unknown>) => Promise<TenantSettings>;
  isModuleEnabled: (moduleId: AppModuleId) => boolean;
  canAccessModule: (moduleId: AppModuleId, role?: AppUserRole | string | null) => boolean;
};

const TenantSettingsContext = createContext<TenantSettingsContextType | null>(null);

export function TenantSettingsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [settings, setSettings] = useState<TenantSettings>(DEFAULT_TENANT_SETTINGS);
  const [loading, setLoading] = useState(false);

  const refreshSettings = useCallback(async () => {
    if (!isAuthenticated || !user) {
      const defaults = normalizeTenantSettings({
        ...DEFAULT_TENANT_SETTINGS,
        tenantId: '',
        tenantSlug: '',
      });
      setSettings(defaults);
      return defaults;
    }

    setLoading(true);
    try {
      const data = normalizeTenantSettings(await tenantApi.getCurrentSettings());
      setSettings(data);
      return data;
    } catch {
      const fallback = normalizeTenantSettings({
        ...DEFAULT_TENANT_SETTINGS,
        tenantId: user.tenantId,
        tenantSlug: user.tenantSlug ?? '',
      });
      setSettings(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const updateSettings = useCallback(async (payload: Record<string, unknown>) => {
    const updated = normalizeTenantSettings(await tenantApi.updateCurrentSettings(payload));
    setSettings(updated);
    return updated;
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  const value = useMemo<TenantSettingsContextType>(() => ({
    settings,
    loading,
    refreshSettings,
    updateSettings,
    isModuleEnabled: (moduleId: AppModuleId) => isTenantModuleEnabled(settings, moduleId),
    canAccessModule: (moduleId: AppModuleId, role?: AppUserRole | string | null) =>
      tenantCanAccessModule(settings, moduleId, role),
  }), [loading, refreshSettings, settings, updateSettings]);

  return (
    <TenantSettingsContext.Provider value={value}>
      {children}
    </TenantSettingsContext.Provider>
  );
}

export function useTenantSettings() {
  const context = useContext(TenantSettingsContext);
  if (!context) throw new Error('useTenantSettings must be used within TenantSettingsProvider');
  return context;
}
