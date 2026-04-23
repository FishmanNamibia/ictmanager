'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user?.role !== 'owner') {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router, user?.role]);

  if (loading || !isAuthenticated || user?.role !== 'owner') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
