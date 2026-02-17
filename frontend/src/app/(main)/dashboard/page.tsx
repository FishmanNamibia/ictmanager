'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Computer,
  Key,
  Apps,
  People,
  Warning,
  CheckCircle,
  VerifiedUser,
} from '@mui/icons-material';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type DashboardData = {
  assets: { total: number; byStatus: Record<string, number>; byType: Record<string, number> };
  licenses: { total: number; expiringSoon: number; overAllocated: number };
  applications: { total: number; byCriticality: Record<string, number> };
  staff: { totalProfiles: number; totalSkills: number; certificationsExpiringSoon: number };
  summary: {
    totalAssets: number;
    licenseIssues: number;
    criticalSystems: number;
    staffCount: number;
  };
};

const kpiColors = ['#1976d2', '#ed6c02', '#d32f2f', '#2e7d32', '#00897b', '#1565c0'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DashboardData>('/dashboards/ict-manager')
      .then(setData)
      .catch((e) => {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        setError(msg);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const time = new Date();
  const greeting = time.getHours() < 12 ? 'Morning' : time.getHours() < 18 ? 'Afternoon' : 'Evening';
  const firstName = user?.fullName?.split(' ')[0] || 'User';

  if (error) {
    return (
      <Box>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box>
        <Box sx={{ height: 140, borderRadius: 2, bgcolor: 'primary.main', mb: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
              <Card><CardContent><Skeleton height={100} /></CardContent></Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const { summary, licenses } = data;
  const totalActions = summary.totalAssets + licenses.total + data.applications.total + summary.staffCount;
  const completionPct = totalActions > 0 ? Math.round((summary.staffCount / Math.max(totalActions, 1)) * 100) : 0;

  const kpis = [
    { value: summary.totalAssets, label: 'Total Assets', icon: <Computer />, color: kpiColors[0] },
    { value: licenses.total, label: 'Licenses', icon: <Key />, color: kpiColors[1] },
    { value: data.applications.total, label: 'Applications', icon: <Apps />, color: kpiColors[2] },
    { value: summary.staffCount, label: 'ICT Staff', icon: <People />, color: kpiColors[3] },
    { value: summary.licenseIssues, label: 'Open Issues', icon: <Warning />, color: kpiColors[4] },
    { value: `${completionPct}%`, label: 'Portfolio Coverage', icon: <CheckCircle />, color: kpiColors[5] },
  ];

  return (
    <Box>
      {/* Greeting banner */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: '#fff',
          borderRadius: 2,
          p: 3,
          mb: 3,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Good {greeting}, {firstName}!
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
            Here&apos;s what&apos;s happening on your ICT desk today.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.15)', minWidth: 180 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                Performance period
              </Typography>
              <Typography variant="h6" fontWeight={600}>FY 2025/2026</Typography>
            </CardContent>
          </Card>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.15)', minWidth: 140 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                Daily focus
              </Typography>
              <Typography variant="body2" fontWeight={600}>Single source of truth</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* KPI cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi, i) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h4" fontWeight={700}>
                    {kpi.value}
                  </Typography>
                  <Box sx={{ color: kpi.color }}>{kpi.icon}</Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {kpi.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Widgets row */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Welcome to I-ICTMS
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your single source of truth for ICT. Get started with the core areas.
              </Typography>
              <List dense disablePadding>
                {[
                  { label: 'Assets & inventory', path: '/assets', icon: <Computer fontSize="small" /> },
                  { label: 'Licenses & compliance', path: '/licenses', icon: <Key fontSize="small" /> },
                  { label: 'Application portfolio', path: '/applications', icon: <Apps fontSize="small" /> },
                  { label: 'Staff & skills', path: '/staff', icon: <People fontSize="small" /> },
                ].map((item, i) => (
                  <ListItem
                    key={i}
                    button
                    onClick={() => router.push(item.path)}
                    sx={{ borderRadius: 1, color: 'primary.main' }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Notices
                </Typography>
                <Typography variant="caption" color="text.secondary">1 of 1</Typography>
              </Box>
              {summary.licenseIssues > 0 ? (
                <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                  <Chip label="Attention" size="small" color="warning" sx={{ mb: 1 }} />
                  <Typography variant="body2">
                    {summary.licenseIssues} license compliance issue(s). Review Licenses and asset assignments.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                  <Chip label="OK" size="small" color="success" sx={{ mb: 1 }} />
                  <Typography variant="body2">
                    No license compliance issues. Keep tracking usage and expiry dates.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                ICT tip of the day
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <VerifiedUser sx={{ color: 'warning.main', mt: 0.25 }} />
                <Box>
                  <Chip label="Governance" size="small" sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Keep your asset register and license counts up to date. A single source of truth
                    reduces audit risk and supports executive reporting.
                  </Typography>
                  <Typography variant="caption" fontWeight={600} sx={{ mt: 1, display: 'block' }}>
                    Stay compliant, stay in control.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
