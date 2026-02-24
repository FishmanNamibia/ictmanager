'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Button,
  Stack,
} from '@mui/material';
import Link from 'next/link';
import { api } from '@/lib/api';

type DashboardStats = {
  incidentStats: {
    total: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    activeIncidents: number;
  };
  riskStats: {
    total: number;
    byLevel: Record<string, number>;
    criticalCount: number;
    overallRiskTrend: string;
  };
  vulnerabilityStats: {
    total: number;
    bySeverity: Record<string, number>;
    unpatchedCount: number;
    overduePatchCount: number;
  };
  accessReviewStats: {
    total: number;
    byStatus: Record<string, number>;
    overdueCount: number;
    nextDueInDays: number | null;
  };
};

function StatCard({ title, value, subtitle, color = 'info' }: { title: string; value: string | number; subtitle?: string; color?: 'success' | 'error' | 'warning' | 'info' }) {
  const colorMap = {
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
  };
  return (
    <Card>
      <CardContent>
        <Typography color="text.secondary" variant="body2">
          {title}
        </Typography>
        <Typography variant="h4" sx={{ mt: 1, color: colorMap[color], fontWeight: 700 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" variant="caption" sx={{ mt: 1, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function CybersecurityPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DashboardStats>('/cybersecurity/dashboard/stats')
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (error)
    return (
      <Box>
        <Typography color="error">{error}</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 2 }}>
          Cybersecurity module is not yet fully configured. Check that the backend is running.
        </Typography>
      </Box>
    );

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Cybersecurity & information security
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Cyber risk register, security incidents, vulnerability tracking, access reviews, and cyber maturity scoring.
      </Typography>

      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      ) : stats ? (
        <>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Active Incidents" value={stats.incidentStats.activeIncidents} color={stats.incidentStats.activeIncidents > 0 ? 'error' : 'success'} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Critical Risks" value={stats.riskStats.criticalCount} color={stats.riskStats.criticalCount > 0 ? 'error' : 'success'} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Unpatched Vulnerabilities" value={stats.vulnerabilityStats.unpatchedCount} color={stats.vulnerabilityStats.unpatchedCount > 0 ? 'warning' : 'success'} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Overdue Access Reviews"
                value={stats.accessReviewStats.overdueCount}
                color={stats.accessReviewStats.overdueCount > 0 ? 'error' : 'success'}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    Incidents
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Total reported</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {stats.incidentStats.total}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Active (investigating/contained)</Typography>
                      <Typography variant="body2" fontWeight={700} color="warning.main">
                        {stats.incidentStats.activeIncidents}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button fullWidth variant="outlined" size="small" sx={{ mt: 2 }} component={Link} href="/cybersecurity/incidents">
                    View incidents
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    Risks
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Total risks</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {stats.riskStats.total}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Critical</Typography>
                      <Typography variant="body2" fontWeight={700} color="error.main">
                        {stats.riskStats.criticalCount}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button fullWidth variant="outlined" size="small" sx={{ mt: 2 }} component={Link} href="/cybersecurity/risks">
                    View risk register
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    Vulnerabilities
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Total tracked</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {stats.vulnerabilityStats.total}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Unpatched</Typography>
                      <Typography variant="body2" fontWeight={700} color={stats.vulnerabilityStats.unpatchedCount > 0 ? 'warning.main' : 'success.main'}>
                        {stats.vulnerabilityStats.unpatchedCount}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Overdue remediation</Typography>
                      <Typography variant="body2" fontWeight={700} color={stats.vulnerabilityStats.overduePatchCount > 0 ? 'error.main' : 'success.main'}>
                        {stats.vulnerabilityStats.overduePatchCount}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button fullWidth variant="outlined" size="small" sx={{ mt: 2 }} component={Link} href="/cybersecurity/vulnerabilities">
                    View vulnerabilities
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    Access Reviews
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Scheduled</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {stats.accessReviewStats.total}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Overdue</Typography>
                      <Typography variant="body2" fontWeight={700} color={stats.accessReviewStats.overdueCount > 0 ? 'error.main' : 'success.main'}>
                        {stats.accessReviewStats.overdueCount}
                      </Typography>
                    </Box>
                    {stats.accessReviewStats.nextDueInDays !== null && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Next due in</Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {stats.accessReviewStats.nextDueInDays} days
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  <Button fullWidth variant="outlined" size="small" sx={{ mt: 2 }} component={Link} href="/cybersecurity/access-reviews">
                    View access reviews
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : (
        <Typography>No data available</Typography>
      )}
    </Box>
  );
}
