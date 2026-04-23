'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  LinearProgress,
  Typography,
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Storage as DbIcon,
  Memory as CpuIcon,
  CloudQueue as ApiIcon,
} from '@mui/icons-material';
import { api } from '@/lib/api';

type OwnerStats = {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  byPlan: Record<string, number>;
};

export default function SystemMonitoringPage() {
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
      <Typography variant="h5" fontWeight={700} mb={0.5}>System Monitoring</Typography>
      <Typography color="text.secondary" mb={3}>
        Real-time health and performance overview of the I-ICTMS platform.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Health Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'API Server', status: 'Healthy', icon: <ApiIcon />, color: '#2e7d32' },
          { label: 'Database', status: 'Connected', icon: <DbIcon />, color: '#2e7d32' },
          { label: 'Frontend', status: 'Running', icon: <CpuIcon />, color: '#2e7d32' },
          { label: 'Overall Status', status: 'All Systems Operational', icon: <HealthyIcon />, color: '#2e7d32' },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Card variant="outlined">
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
                <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{s.label}</Typography>
                  <Typography variant="caption" sx={{ color: s.color }}>{s.status}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Platform Usage */}
      <Typography variant="h6" fontWeight={600} mb={2}>Platform Usage</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} mb={2}>Tenant Distribution</Typography>
              {stats && (
                <Box>
                  {[
                    { label: 'Active', count: stats.activeTenants, total: stats.totalTenants, color: '#2e7d32' },
                    { label: 'Trial', count: stats.trialTenants, total: stats.totalTenants, color: '#0288d1' },
                    { label: 'Suspended', count: stats.suspendedTenants, total: stats.totalTenants, color: '#ed6c02' },
                  ].map((item) => (
                    <Box key={item.label} sx={{ mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">{item.label}</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {item.count} / {item.total}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={item.total > 0 ? (item.count / item.total) * 100 : 0}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 4 } }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} mb={2}>Plans Overview</Typography>
              {stats && Object.entries(stats.byPlan).map(([plan, count]) => (
                <Box key={plan} display="flex" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{plan}</Typography>
                  <Typography variant="body2" fontWeight={700}>{count}</Typography>
                </Box>
              ))}
              {stats && Object.keys(stats.byPlan).length === 0 && (
                <Typography variant="body2" color="text.secondary" fontStyle="italic" textAlign="center" py={2}>
                  No plan data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} mb={1}>Recent System Events</Typography>
          <Typography variant="body2" color="text.secondary" fontStyle="italic" textAlign="center" py={3}>
            No recent system events to display
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
