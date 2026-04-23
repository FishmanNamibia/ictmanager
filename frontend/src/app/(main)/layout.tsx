'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantSettings } from '@/contexts/TenantSettingsContext';
import AppShell from '@/components/AppShell';
import { Box, CircularProgress } from '@mui/material';
import { getModuleForPath } from '@/lib/tenant-settings';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, user } = useAuth();
  const { loading: settingsLoading, canAccessModule } = useTenantSettings();
  const router = useRouter();
  const pathname = usePathname();
  const activeModule = getModuleForPath(pathname);

  useEffect(() => {
    if (loading || settingsLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user?.role === 'owner') {
      router.replace('/owner');
      return;
    }
    if (activeModule && !canAccessModule(activeModule.id, user?.role)) {
      router.replace('/dashboard');
    }
  }, [activeModule, canAccessModule, isAuthenticated, loading, router, settingsLoading, user?.role]);

  if (loading || settingsLoading || !isAuthenticated || user?.role === 'owner' || (activeModule && !canAccessModule(activeModule.id, user?.role))) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return <AppShell>{children}</AppShell>;
}
