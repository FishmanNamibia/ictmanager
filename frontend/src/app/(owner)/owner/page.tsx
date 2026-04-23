'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import {
  Business as BusinessIcon,
  CheckCircle as ActiveIcon,
  HourglassEmpty as TrialIcon,
  People as PeopleIcon,
  PauseCircle as SuspendedIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { api } from '@/lib/api';

type OwnerStats = {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  byPlan: Record<string, number>;
};

export default function SystemAdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<OwnerStats>('/owner/stats')
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={10}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={0.5}>System Admin</Typography>
      <Typography color="text.secondary" mb={3}>
        Overview of the platform. Manage tenants, subscriptions, and monitor system health.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: 'Total Companies', value: stats.totalTenants, icon: <BusinessIcon />, color: '#1976d2' },
            { label: 'Active Subscriptions', value: stats.activeTenants, icon: <ActiveIcon />, color: '#2e7d32' },
            { label: 'Trial Subscriptions', value: stats.trialTenants, icon: <TrialIcon />, color: '#0288d1' },
            { label: 'Suspended', value: stats.suspendedTenants, icon: <SuspendedIcon />, color: '#ed6c02' },
          ].map((s) => (
            <Grid item xs={12} sm={6} md={3} key={s.label}>
              <Card>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
                  <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Quick links */}
      <Typography variant="h6" fontWeight={600} mb={2}>Quick Actions</Typography>
      <Grid container spacing={2}>
        {[
          { label: 'Subscriptions & Reminders', desc: 'Manage company subscriptions, assign plans, and send reminders.', icon: <TrendingIcon />, href: '/owner/subscriptions' },
          { label: 'System Monitoring', desc: 'Monitor system health, uptime, and performance metrics.', icon: <PeopleIcon />, href: '/owner/monitoring' },
        ].map((item) => (
          <Grid item xs={12} sm={6} key={item.label}>
            <Card
              sx={{ cursor: 'pointer', transition: 'box-shadow .2s', '&:hover': { boxShadow: 4 } }}
              onClick={() => router.push(item.href)}
            >
              <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ color: '#6C63FF', mt: 0.5 }}>{item.icon}</Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>{item.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
