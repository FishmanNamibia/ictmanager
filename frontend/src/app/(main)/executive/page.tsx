'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { api } from '@/lib/api';

type ExecutiveData = {
  ictPerformanceScore?: number;
  riskExposure?: { licenseCompliance: string; expiringLicenses: number };
  strategicAlignment?: { totalSystems: number; criticalSystems: number };
  summary?: { totalAssets: number; licenseIssues: number; criticalSystems: number; staffCount: number };
};

type GovernanceStats = {
  total: number;
  overdueForReview: number;
  approved: number;
};

type PolicyComplianceStats = {
  overallCompliancePercent: number;
  byPolicy: Array<{ policyId: string; compliancePercent: number }>;
};

type CyberDashboardStats = {
  incidentStats: {
    total: number;
    activeIncidents: number;
  };
  riskStats: {
    total: number;
    criticalCount: number;
  };
  vulnerabilityStats: {
    total: number;
    unpatchedCount: number;
    overduePatchCount: number;
  };
  accessReviewStats: {
    total: number;
    overdueCount: number;
    nextDueInDays: number | null;
  };
};

type ServiceDeskStats = {
  totalTickets: number;
  openTickets: number;
  averageResolutionTime: number;
  overdueTickets: number;
};

type DataGovernanceStats = {
  totalAssets: number;
  processingRecords: number;
  qualityMetrics: number;
  pendingDPIA: number;
  lowQualityAssets: number;
};

type AuditEvidence = {
  id: string;
  auditType: string;
  actionBy?: string | null;
  resource?: string | null;
  success: boolean;
  createdAt: string;
};

type ExecutiveState = {
  core: ExecutiveData;
  governance: GovernanceStats | null;
  policyCompliance: PolicyComplianceStats | null;
  cybersecurity: CyberDashboardStats | null;
  serviceDesk: ServiceDeskStats | null;
  dataGovernance: DataGovernanceStats | null;
  auditEvidence: AuditEvidence[];
};

function KpiCard({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={700} sx={color ? { color } : undefined}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function ExecutivePage() {
  const [data, setData] = useState<ExecutiveState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const core = await api<ExecutiveData>('/dashboards/executive');
        const [governance, policyCompliance, cybersecurity, serviceDesk, dataGovernance, auditEvidence] = await Promise.all([
          api<GovernanceStats>('/policies/governance-stats').catch(() => null),
          api<PolicyComplianceStats>('/policies/compliance/stats').catch(() => null),
          api<CyberDashboardStats>('/cybersecurity/dashboard/stats').catch(() => null),
          api<ServiceDeskStats>('/service-desk/dashboard-stats').catch(() => null),
          api<DataGovernanceStats>('/data-governance/dashboard-stats').catch(() => null),
          api<AuditEvidence[]>('/cybersecurity/audit-evidence?days=30').catch(() => []),
        ]);

        if (!mounted) return;
        setData({
          core,
          governance,
          policyCompliance,
          cybersecurity,
          serviceDesk,
          dataGovernance,
          auditEvidence,
        });
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load executive dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const score = data?.core.ictPerformanceScore ?? 0;
  const scoreColor = score >= 70 ? 'success.main' : score >= 40 ? 'warning.main' : 'error.main';
  const risk = data?.core.riskExposure ?? { licenseCompliance: 'ok', expiringLicenses: 0 };
  const alignment = data?.core.strategicAlignment ?? { totalSystems: 0, criticalSystems: 0 };

  const compliancePercent = data?.policyCompliance?.overallCompliancePercent ?? 0;
  const overduePolicies = data?.governance?.overdueForReview ?? 0;
  const openTickets = data?.serviceDesk?.openTickets ?? 0;
  const overdueTickets = data?.serviceDesk?.overdueTickets ?? 0;
  const activeIncidents = data?.cybersecurity?.incidentStats.activeIncidents ?? 0;
  const criticalRisks = data?.cybersecurity?.riskStats.criticalCount ?? 0;
  const unpatched = data?.cybersecurity?.vulnerabilityStats.unpatchedCount ?? 0;
  const overdueReviews = data?.cybersecurity?.accessReviewStats.overdueCount ?? 0;
  const totalDataAssets = data?.dataGovernance?.totalAssets ?? 0;
  const lowQualityAssets = data?.dataGovernance?.lowQualityAssets ?? 0;

  const evidencePreview = useMemo(() => (data?.auditEvidence ?? []).slice(0, 8), [data?.auditEvidence]);

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Executive ICT scorecard
        </Typography>
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent>
                  <Skeleton height={110} />
                </CardContent>
              </Card>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Skeleton height={260} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TrendingUpIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          Executive ICT scorecard
        </Typography>
      </Box>

      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Consolidated view of ICT performance, compliance posture, cyber risk, and operational health.
      </Typography>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="ICT Performance Score" value={score} subtitle="Out of 100" color={scoreColor} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label="Policy Compliance"
            value={`${compliancePercent}%`}
            subtitle={`${overduePolicies} overdue policy reviews`}
            color={compliancePercent >= 80 ? 'success.main' : compliancePercent >= 60 ? 'warning.main' : 'error.main'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label="Security Posture"
            value={activeIncidents}
            subtitle={`${criticalRisks} critical risks | ${unpatched} unpatched vulns`}
            color={activeIncidents > 0 || criticalRisks > 0 ? 'error.main' : 'success.main'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label="Service Desk"
            value={openTickets}
            subtitle={`${overdueTickets} overdue tickets`}
            color={overdueTickets > 0 ? 'warning.main' : 'success.main'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk and compliance signals
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {risk.licenseCompliance === 'warning' ? (
                  <WarningIcon color="warning" />
                ) : (
                  <CheckCircleIcon color="success" />
                )}
                <Typography variant="body2">
                  License compliance: {risk.licenseCompliance === 'warning' ? 'Attention' : 'OK'}
                </Typography>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  size="small"
                  label={`Expiring licenses: ${risk.expiringLicenses}`}
                  color={risk.expiringLicenses > 0 ? 'warning' : 'success'}
                />
                <Chip
                  size="small"
                  label={`Overdue access reviews: ${overdueReviews}`}
                  color={overdueReviews > 0 ? 'error' : 'success'}
                />
                <Chip
                  size="small"
                  label={`Total policies: ${data?.governance?.total ?? 0}`}
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Strategic and data alignment
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total systems: {alignment.totalSystems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critical systems: {alignment.criticalSystems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Data assets: {totalDataAssets}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Low-quality assets: {lowQualityAssets}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">Audit evidence (last 30 days)</Typography>
            <Typography variant="caption" color="text.secondary">
              Records: {data?.auditEvidence.length ?? 0}
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {evidencePreview.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No audit evidence records found for the selected period.
                    </TableCell>
                  </TableRow>
                ) : (
                  evidencePreview.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{row.auditType.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{row.actionBy || '-'}</TableCell>
                      <TableCell>{row.resource || '-'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={row.success ? 'success' : 'failed'} color={row.success ? 'success' : 'error'} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
