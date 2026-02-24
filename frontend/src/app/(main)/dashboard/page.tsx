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
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Computer,
  Key,
  Apps,
  People,
  Warning,
  CheckCircle,
  VerifiedUser,
  Schedule,
  Event,
  Security,
  Description,
  Folder,
  Storage,
  Support,
  TrendingUp,
  Build,
  PlayArrow,
} from '@mui/icons-material';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type LicenseExpiring = { id: string; softwareName: string; expiryDate: string };
type LicenseOverAllocated = { id: string; softwareName: string; usedSeats: number; totalSeats: number };

type DashboardData = {
  assets: { total: number; byStatus: Record<string, number>; byType: Record<string, number> };
  licenses: {
    total: number;
    expiringSoon: number;
    overAllocated: number;
    expiringIn30?: number;
    expiringIn60?: number;
    expiringIn90?: number;
    renewalsThisQuarter?: number;
    complianceRiskScore?: number;
    expiringIn30Days?: LicenseExpiring[];
    overAllocatedList?: LicenseOverAllocated[];
    renewalsDueThisQuarter?: LicenseExpiring[];
  };
  applications: { total: number; byCriticality: Record<string, number> };
  staff: { totalProfiles: number; totalSkills: number; certificationsExpiringSoon: number };
  summary: {
    totalAssets: number;
    licenseIssues: number;
    criticalSystems: number;
    staffCount: number;
  };
  governance?: {
    total: number;
    overdueForReview: number;
    approved: number;
    draft: number;
    expired: number;
    overduePolicies: Array<{ id: string; title: string; nextReviewDue: string }>;
  };
};

type AutomationRun = {
  id?: string;
  status: string;
  trigger: string;
  startedAt: string;
  completedAt?: string | null;
  processedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
};

type AutomationStatusData = {
  running: boolean;
  lastRun: AutomationRun | null;
  recentRuns: AutomationRun[];
  linkSummary: {
    total: number;
    byAutomationType: Record<string, number>;
    byTargetType: Record<string, number>;
    lastEvaluatedAt: string | null;
  };
};

const kpiColors = ['#1976d2', '#ed6c02', '#d32f2f', '#2e7d32', '#00897b', '#1565c0'];
const automationRuleLabels: Record<string, string> = {
  contract_expiry: 'Contract expiry',
  license_compliance: 'License compliance',
  policy_overdue_review: 'Policy overdue review',
  vulnerability_change: 'Vulnerability changes',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [automationStatus, setAutomationStatus] = useState<AutomationStatusData | null>(null);
  const [automationError, setAutomationError] = useState<string | null>(null);
  const [automationRunning, setAutomationRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [dashboard, automation] = await Promise.all([
          api<DashboardData>('/dashboards/ict-manager'),
          api<AutomationStatusData>('/automation/status').catch(() => null),
        ]);
        if (!mounted) return;
        setData(dashboard);
        setAutomationStatus(automation);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        if (!mounted) return;
        setError(msg);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const runAutomationNow = async () => {
    setAutomationError(null);
    setAutomationRunning(true);
    try {
      await api<{ status: string }>('/automation/run', { method: 'POST' });
      const status = await api<AutomationStatusData>('/automation/status');
      setAutomationStatus(status);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to run automation';
      setAutomationError(msg);
    } finally {
      setAutomationRunning(false);
    }
  };

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

      {/* License expiry & compliance monitoring */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5, mt: 1 }}>
        License expiry & compliance
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Schedule color="warning" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Licenses expiring in 30 days
                </Typography>
              </Box>
              {(data.licenses.expiringIn30Days?.length ?? 0) > 0 ? (
                <>
                  <Chip
                    label={(data.licenses.expiringIn30 ?? data.licenses.expiringSoon) + ' licence(s)'}
                    size="small"
                    color="warning"
                    sx={{ mb: 1 }}
                  />
                  <List dense disablePadding>
                    {(data.licenses.expiringIn30Days ?? []).slice(0, 5).map((l) => (
                      <ListItem key={l.id} dense sx={{ py: 0 }}>
                        <ListItemText
                          primary={l.softwareName}
                          secondary={l.expiryDate}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  {(data.licenses.expiringIn30Days?.length ?? 0) > 5 && (
                    <Typography variant="caption" color="text.secondary">
                      +{(data.licenses.expiringIn30Days?.length ?? 0) - 5} more
                    </Typography>
                  )}
                  <Button size="small" sx={{ mt: 1 }} onClick={() => router.push('/licenses')}>
                    View all
                  </Button>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  None in the next 30 days.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Event color="info" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Renewals due this quarter
                </Typography>
              </Box>
              {(data.licenses.renewalsDueThisQuarter?.length ?? 0) > 0 ? (
                <>
                  <Chip
                    label={(data.licenses.renewalsThisQuarter ?? 0) + ' renewal(s)'}
                    size="small"
                    color="info"
                    sx={{ mb: 1 }}
                  />
                  <List dense disablePadding>
                    {(data.licenses.renewalsDueThisQuarter ?? []).slice(0, 5).map((l) => (
                      <ListItem key={l.id} dense sx={{ py: 0 }}>
                        <ListItemText
                          primary={l.softwareName}
                          secondary={l.expiryDate}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  {(data.licenses.renewalsDueThisQuarter?.length ?? 0) > 5 && (
                    <Typography variant="caption" color="text.secondary">
                      +{(data.licenses.renewalsDueThisQuarter?.length ?? 0) - 5} more
                    </Typography>
                  )}
                  <Button size="small" sx={{ mt: 1 }} onClick={() => router.push('/licenses')}>
                    View all
                  </Button>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No renewals due this quarter.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Security color={((data.licenses.complianceRiskScore ?? 100) < 70) ? 'error' : 'success'} />
                <Typography variant="subtitle1" fontWeight={600}>
                  License compliance risk
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                <Typography variant="h4" fontWeight={700} color={((data.licenses.complianceRiskScore ?? 100) < 70) ? 'error.main' : 'success.main'}>
                  {data.licenses.complianceRiskScore ?? 100}
                </Typography>
                <Typography variant="body2" color="text.secondary">/ 100</Typography>
              </Box>
              {(data.licenses.overAllocatedList?.length ?? 0) > 0 ? (
                <Box sx={{ mt: 1 }}>
                  <Chip label="Over-licensed (usage &gt; seats)" size="small" color="error" sx={{ mb: 1 }} />
                  <List dense disablePadding>
                    {(data.licenses.overAllocatedList ?? []).slice(0, 3).map((l) => (
                      <ListItem key={l.id} dense sx={{ py: 0 }}>
                        <ListItemText
                          primary={l.softwareName}
                          secondary={`${l.usedSeats} / ${l.totalSeats} seats`}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Button size="small" sx={{ mt: 0.5 }} onClick={() => router.push('/licenses')}>
                    Fix in Licenses
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No over-allocation. Usage vs entitlement is within limits.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ICT Governance: policies overdue for review */}
      {data.governance !== undefined && (
        <>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5, mt: 1 }}>
            ICT governance
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Description color={data.governance.overdueForReview > 0 ? 'warning' : 'action'} />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Policies overdue for review
                    </Typography>
                  </Box>
                  {data.governance.overdueForReview > 0 ? (
                    <>
                      <Chip
                        label={data.governance.overdueForReview + ' policy(ies)'}
                        size="small"
                        color="warning"
                        sx={{ mb: 1 }}
                      />
                      <List dense disablePadding>
                        {data.governance.overduePolicies.slice(0, 5).map((p) => (
                          <ListItem key={p.id} dense sx={{ py: 0 }}>
                            <ListItemText
                              primary={p.title}
                              secondary={'Due: ' + p.nextReviewDue}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Button size="small" sx={{ mt: 1 }} onClick={() => router.push('/policies')}>
                        View all
                      </Button>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No policies overdue. Total policies: {data.governance.total} (Approved: {data.governance.approved}).
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Control automation */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5, mt: 1 }}>
        Control automation
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Build color={automationStatus?.running ? 'warning' : 'primary'} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Automation runner
                  </Typography>
                </Box>
                {user?.role === 'ict_manager' && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={automationRunning ? <CircularProgress size={14} color="inherit" /> : <PlayArrow />}
                    onClick={runAutomationNow}
                    disabled={automationRunning}
                  >
                    {automationRunning ? 'Running' : 'Run now'}
                  </Button>
                )}
              </Box>
              {automationError && (
                <Alert severity="error" sx={{ mb: 1.5 }}>
                  {automationError}
                </Alert>
              )}
              {automationStatus ? (
                <>
                  <Chip
                    size="small"
                    label={automationStatus.running ? 'Run in progress' : 'Idle'}
                    color={automationStatus.running ? 'warning' : 'success'}
                    sx={{ mb: 1.5 }}
                  />
                  {automationStatus.lastRun ? (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Last status: <b>{automationStatus.lastRun.status}</b>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Trigger: <b>{automationStatus.lastRun.trigger}</b>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Processed: <b>{automationStatus.lastRun.processedCount}</b>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Created/Updated: <b>{automationStatus.lastRun.createdCount}/{automationStatus.lastRun.updatedCount}</b>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Errors: <b>{automationStatus.lastRun.errorCount}</b>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Finished: <b>{formatDateTime(automationStatus.lastRun.completedAt || automationStatus.lastRun.startedAt)}</b>
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No automation runs yet for this tenant.
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Automation status not available yet.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Automation links and rules
              </Typography>
              {automationStatus ? (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Linked records: {automationStatus.linkSummary.total}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                    {Object.entries(automationStatus.linkSummary.byAutomationType).length > 0 ? (
                      Object.entries(automationStatus.linkSummary.byAutomationType).map(([rule, count]) => (
                        <Chip
                          key={rule}
                          size="small"
                          label={`${automationRuleLabels[rule] ?? rule}: ${count}`}
                          variant="outlined"
                        />
                      ))
                    ) : (
                      <Chip size="small" label="No rule links yet" variant="outlined" />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Last evaluated: {formatDateTime(automationStatus.linkSummary.lastEvaluatedAt)}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Run automations to generate linked records across modules.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
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
                  { label: 'ICT policies & governance', path: '/policies', icon: <Description fontSize="small" /> },
                  { label: 'Cybersecurity', path: '/cybersecurity', icon: <Security fontSize="small" /> },
                  { label: 'ICT projects', path: '/projects', icon: <Folder fontSize="small" /> },
                  { label: 'Data governance', path: '/data-governance', icon: <Storage fontSize="small" /> },
                  { label: 'Service desk (ITSM)', path: '/service-desk', icon: <Support fontSize="small" /> },
                  { label: 'Executive view', path: '/executive', icon: <TrendingUp fontSize="small" /> },
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
