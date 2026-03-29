'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { api, DisasterRecoveryOverview, DisasterRecoveryPlan } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type RiskItem = {
  id: string;
  title: string;
  description?: string | null;
  domain: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  residualRiskScore?: number | null;
  status: string;
  owner?: string | null;
  mitigation?: string | null;
  reviewFrequency?: string | null;
  lastReviewDate?: string | null;
  nextReviewDate?: string | null;
  complianceArea?: string | null;
};

type AuditFinding = {
  id: string;
  findingRef: string;
  title: string;
  description?: string | null;
  source?: string | null;
  severity: string;
  status: string;
  owner?: string | null;
  dueDate?: string | null;
  closedDate?: string | null;
  correctiveAction?: string | null;
  evidenceUrl?: string | null;
  notes?: string | null;
};

type Stats = {
  risks: {
    total: number;
    open: number;
    highScore: number;
    overdueReviews: number;
    byDomain: Record<string, number>;
    byStatus: Record<string, number>;
  };
  findings: {
    total: number;
    open: number;
    overdue: number;
    highSeverityOpen: number;
    byStatus: Record<string, number>;
  };
  compliancePosture: {
    overallScore: number;
    atRiskAreas: string[];
  };
};

type AppOption = {
  id: string;
  name: string;
  criticality: string;
  status: string;
  rto?: string | null;
  rpo?: string | null;
  dependencies?: string | null;
};

type RiskForm = {
  title: string;
  domain: string;
  likelihood: string;
  impact: string;
  status: string;
  owner: string;
  complianceArea: string;
  reviewFrequency: string;
  nextReviewDate: string;
  mitigation: string;
  description: string;
};

type FindingForm = {
  findingRef: string;
  title: string;
  source: string;
  severity: string;
  status: string;
  owner: string;
  dueDate: string;
  correctiveAction: string;
  evidenceUrl: string;
  notes: string;
  description: string;
};

type DrPlanForm = {
  applicationId: string;
  planName: string;
  status: string;
  recoveryTier: string;
  failoverType: string;
  recoverySite: string;
  alternateSite: string;
  recoveryOwner: string;
  communicationOwner: string;
  activationTrigger: string;
  backupStrategy: string;
  replicationScope: string;
  dependencies: string;
  runbookUrl: string;
  lastDrTestDate: string;
  nextDrTestDate: string;
  lastBackupVerificationDate: string;
  nextBackupVerificationDate: string;
  notes: string;
};

const EMPTY_RISK_FORM: RiskForm = {
  title: '',
  domain: 'operations',
  likelihood: '3',
  impact: '3',
  status: 'open',
  owner: '',
  complianceArea: '',
  reviewFrequency: '',
  nextReviewDate: '',
  mitigation: '',
  description: '',
};

const EMPTY_FINDING_FORM: FindingForm = {
  findingRef: '',
  title: '',
  source: '',
  severity: 'medium',
  status: 'open',
  owner: '',
  dueDate: '',
  correctiveAction: '',
  evidenceUrl: '',
  notes: '',
  description: '',
};

const EMPTY_DR_PLAN_FORM: DrPlanForm = {
  applicationId: '',
  planName: '',
  status: 'draft',
  recoveryTier: 'warm',
  failoverType: 'manual',
  recoverySite: '',
  alternateSite: '',
  recoveryOwner: '',
  communicationOwner: '',
  activationTrigger: '',
  backupStrategy: '',
  replicationScope: '',
  dependencies: '',
  runbookUrl: '',
  lastDrTestDate: '',
  nextDrTestDate: '',
  lastBackupVerificationDate: '',
  nextBackupVerificationDate: '',
  notes: '',
};

function toIsoDate(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function toInputDate(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

const RISK_DOMAINS = ['operations', 'vendor', 'project', 'compliance', 'security', 'data', 'finance', 'other'];
const DR_STATUSES = ['draft', 'active', 'needs_review', 'retired'];
const DR_TIERS = ['hot', 'warm', 'cold', 'manual'];
const DR_FAILOVER_TYPES = ['automated', 'semi_automated', 'manual'];

export default function RiskCompliancePage() {
  const { user } = useAuth();
  const isManager = user?.role === 'ict_manager';

  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [applications, setApplications] = useState<AppOption[]>([]);
  const [drPlans, setDrPlans] = useState<DisasterRecoveryPlan[]>([]);
  const [drOverview, setDrOverview] = useState<DisasterRecoveryOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [findingDialogOpen, setFindingDialogOpen] = useState(false);
  const [drDialogOpen, setDrDialogOpen] = useState(false);
  const [riskEditingId, setRiskEditingId] = useState<string | null>(null);
  const [findingEditingId, setFindingEditingId] = useState<string | null>(null);
  const [drEditingId, setDrEditingId] = useState<string | null>(null);
  const [riskForm, setRiskForm] = useState<RiskForm>(EMPTY_RISK_FORM);
  const [findingForm, setFindingForm] = useState<FindingForm>(EMPTY_FINDING_FORM);
  const [drPlanForm, setDrPlanForm] = useState<DrPlanForm>(EMPTY_DR_PLAN_FORM);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [riskData, findingData, statData, appData, drPlanData, drOverviewData] = await Promise.all([
        api<RiskItem[]>('/risk-compliance/risks'),
        api<AuditFinding[]>('/risk-compliance/findings'),
        api<Stats>('/risk-compliance/dashboard-stats'),
        api<AppOption[]>('/applications'),
        api<DisasterRecoveryPlan[]>('/risk-compliance/dr-plans'),
        api<DisasterRecoveryOverview>('/risk-compliance/dr-overview'),
      ]);
      setRisks(riskData);
      setFindings(findingData);
      setStats(statData);
      setApplications(appData);
      setDrPlans(drPlanData);
      setDrOverview(drOverviewData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load risk and compliance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const cards = useMemo(() => ([
    { label: 'Open Risks', value: stats?.risks.open ?? 0 },
    { label: 'High Score Risks', value: stats?.risks.highScore ?? 0 },
    { label: 'Open Findings', value: stats?.findings.open ?? 0 },
    { label: 'Overdue Findings', value: stats?.findings.overdue ?? 0 },
    { label: 'DR Gaps', value: drOverview?.summary.uncoveredCriticalApps ?? 0 },
    { label: 'Auto Failover Plans', value: drOverview?.summary.automatedFailoverPlans ?? 0 },
    { label: 'Compliance Posture', value: `${stats?.compliancePosture.overallScore ?? 0}%` },
  ]), [drOverview, stats]);

  const openRiskCreate = () => {
    setRiskEditingId(null);
    setRiskForm(EMPTY_RISK_FORM);
    setRiskDialogOpen(true);
  };

  const openRiskEdit = (risk: RiskItem) => {
    setRiskEditingId(risk.id);
    setRiskForm({
      title: risk.title,
      domain: risk.domain || 'operations',
      likelihood: String(risk.likelihood ?? 3),
      impact: String(risk.impact ?? 3),
      status: risk.status || 'open',
      owner: risk.owner ?? '',
      complianceArea: risk.complianceArea ?? '',
      reviewFrequency: risk.reviewFrequency ?? '',
      nextReviewDate: toInputDate(risk.nextReviewDate),
      mitigation: risk.mitigation ?? '',
      description: risk.description ?? '',
    });
    setRiskDialogOpen(true);
  };

  const openFindingCreate = () => {
    setFindingEditingId(null);
    setFindingForm(EMPTY_FINDING_FORM);
    setFindingDialogOpen(true);
  };

  const populateDrPlanForm = (plan?: DisasterRecoveryPlan | null, applicationId?: string) => {
    if (!plan) {
      const app = applications.find((item) => item.id === applicationId);
      setDrPlanForm({
        ...EMPTY_DR_PLAN_FORM,
        applicationId: applicationId || '',
        planName: app ? `${app.name} Recovery Plan` : '',
        dependencies: app?.dependencies ?? '',
      });
      return;
    }
    setDrPlanForm({
      applicationId: plan.applicationId ?? '',
      planName: plan.planName,
      status: plan.status,
      recoveryTier: plan.recoveryTier,
      failoverType: plan.failoverType,
      recoverySite: plan.recoverySite ?? '',
      alternateSite: plan.alternateSite ?? '',
      recoveryOwner: plan.recoveryOwner ?? '',
      communicationOwner: plan.communicationOwner ?? '',
      activationTrigger: plan.activationTrigger ?? '',
      backupStrategy: plan.backupStrategy ?? '',
      replicationScope: plan.replicationScope ?? '',
      dependencies: plan.dependencies ?? '',
      runbookUrl: plan.runbookUrl ?? '',
      lastDrTestDate: toInputDate(plan.lastDrTestDate),
      nextDrTestDate: toInputDate(plan.nextDrTestDate),
      lastBackupVerificationDate: toInputDate(plan.lastBackupVerificationDate),
      nextBackupVerificationDate: toInputDate(plan.nextBackupVerificationDate),
      notes: plan.notes ?? '',
    });
  };

  const openDrPlanCreate = (applicationId = '') => {
    setDrEditingId(null);
    populateDrPlanForm(null, applicationId);
    setDrDialogOpen(true);
  };

  const openDrPlanEdit = (plan: DisasterRecoveryPlan) => {
    setDrEditingId(plan.id);
    populateDrPlanForm(plan);
    setDrDialogOpen(true);
  };

  const openFindingEdit = (finding: AuditFinding) => {
    setFindingEditingId(finding.id);
    setFindingForm({
      findingRef: finding.findingRef ?? '',
      title: finding.title,
      source: finding.source ?? '',
      severity: finding.severity || 'medium',
      status: finding.status || 'open',
      owner: finding.owner ?? '',
      dueDate: toInputDate(finding.dueDate),
      correctiveAction: finding.correctiveAction ?? '',
      evidenceUrl: finding.evidenceUrl ?? '',
      notes: finding.notes ?? '',
      description: finding.description ?? '',
    });
    setFindingDialogOpen(true);
  };

  const saveDrPlan = async () => {
    if (!drPlanForm.planName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        applicationId: drPlanForm.applicationId || undefined,
        planName: drPlanForm.planName.trim(),
        status: drPlanForm.status,
        recoveryTier: drPlanForm.recoveryTier,
        failoverType: drPlanForm.failoverType,
        recoverySite: drPlanForm.recoverySite.trim() || undefined,
        alternateSite: drPlanForm.alternateSite.trim() || undefined,
        recoveryOwner: drPlanForm.recoveryOwner.trim() || undefined,
        communicationOwner: drPlanForm.communicationOwner.trim() || undefined,
        activationTrigger: drPlanForm.activationTrigger.trim() || undefined,
        backupStrategy: drPlanForm.backupStrategy.trim() || undefined,
        replicationScope: drPlanForm.replicationScope.trim() || undefined,
        dependencies: drPlanForm.dependencies.trim() || undefined,
        runbookUrl: drPlanForm.runbookUrl.trim() || undefined,
        lastDrTestDate: toIsoDate(drPlanForm.lastDrTestDate),
        nextDrTestDate: toIsoDate(drPlanForm.nextDrTestDate),
        lastBackupVerificationDate: toIsoDate(drPlanForm.lastBackupVerificationDate),
        nextBackupVerificationDate: toIsoDate(drPlanForm.nextBackupVerificationDate),
        notes: drPlanForm.notes.trim() || undefined,
      };
      if (drEditingId) {
        await api(`/risk-compliance/dr-plans/${drEditingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/risk-compliance/dr-plans', { method: 'POST', body: JSON.stringify(payload) });
      }
      setDrDialogOpen(false);
      setDrEditingId(null);
      setDrPlanForm(EMPTY_DR_PLAN_FORM);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save disaster recovery plan');
    } finally {
      setSubmitting(false);
    }
  };

  const saveRisk = async () => {
    if (!riskForm.title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: riskForm.title.trim(),
        domain: riskForm.domain,
        likelihood: Number(riskForm.likelihood) || 3,
        impact: Number(riskForm.impact) || 3,
        status: riskForm.status,
        owner: riskForm.owner.trim() || undefined,
        complianceArea: riskForm.complianceArea.trim() || undefined,
        reviewFrequency: riskForm.reviewFrequency.trim() || undefined,
        nextReviewDate: toIsoDate(riskForm.nextReviewDate),
        mitigation: riskForm.mitigation.trim() || undefined,
        description: riskForm.description.trim() || undefined,
      };
      if (riskEditingId) {
        await api(`/risk-compliance/risks/${riskEditingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/risk-compliance/risks', { method: 'POST', body: JSON.stringify(payload) });
      }
      setRiskDialogOpen(false);
      setRiskEditingId(null);
      setRiskForm(EMPTY_RISK_FORM);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save risk');
    } finally {
      setSubmitting(false);
    }
  };

  const saveFinding = async () => {
    if (!findingForm.title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        findingRef: findingForm.findingRef.trim() || undefined,
        title: findingForm.title.trim(),
        source: findingForm.source.trim() || undefined,
        severity: findingForm.severity,
        status: findingForm.status,
        owner: findingForm.owner.trim() || undefined,
        dueDate: toIsoDate(findingForm.dueDate),
        correctiveAction: findingForm.correctiveAction.trim() || undefined,
        evidenceUrl: findingForm.evidenceUrl.trim() || undefined,
        notes: findingForm.notes.trim() || undefined,
        description: findingForm.description.trim() || undefined,
      };
      if (findingEditingId) {
        await api(`/risk-compliance/findings/${findingEditingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/risk-compliance/findings', { method: 'POST', body: JSON.stringify(payload) });
      }
      setFindingDialogOpen(false);
      setFindingEditingId(null);
      setFindingForm(EMPTY_FINDING_FORM);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save audit finding');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRisk = async (id: string) => {
    if (!window.confirm('Delete this risk item?')) return;
    setSubmitting(true);
    setError(null);
    try {
      await api(`/risk-compliance/risks/${id}`, { method: 'DELETE' });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete risk');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteFinding = async (id: string) => {
    if (!window.confirm('Delete this audit finding?')) return;
    setSubmitting(true);
    setError(null);
    try {
      await api(`/risk-compliance/findings/${id}`, { method: 'DELETE' });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete audit finding');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDrPlan = async (id: string) => {
    if (!window.confirm('Delete this disaster recovery plan?')) return;
    setSubmitting(true);
    setError(null);
    try {
      await api(`/risk-compliance/dr-plans/${id}`, { method: 'DELETE' });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete disaster recovery plan');
    } finally {
      setSubmitting(false);
    }
  };

  const planNameById = useMemo(
    () => new Map(drPlans.map((plan) => [plan.id, plan.planName])),
    [drPlans],
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            ICT Risk & Compliance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enterprise risk register, audit findings, and compliance posture tracking.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {cards.map((card) => (
          <Grid item xs={6} md={4} lg={3} key={card.label}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                  {card.label}
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {loading ? '...' : card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">Risk Register</Typography>
                {isManager && (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={openRiskCreate}>
                    Add risk
                  </Button>
                )}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                      <TableCell>Title</TableCell>
                      <TableCell>Domain</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell>Next Review</TableCell>
                      {isManager && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {risks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isManager ? 7 : 6} align="center">
                          No risk items yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      risks.map((risk) => (
                        <TableRow key={risk.id}>
                          <TableCell>{risk.title}</TableCell>
                          <TableCell>{risk.domain}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={risk.riskScore}
                              color={risk.riskScore >= 16 ? 'error' : risk.riskScore >= 9 ? 'warning' : 'success'}
                            />
                          </TableCell>
                          <TableCell>{risk.status}</TableCell>
                          <TableCell>{risk.owner || '-'}</TableCell>
                          <TableCell>{risk.nextReviewDate ? new Date(risk.nextReviewDate).toLocaleDateString() : '-'}</TableCell>
                          {isManager && (
                            <TableCell align="right">
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => openRiskEdit(risk)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => void deleteRisk(risk.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} gap={1} flexWrap="wrap">
                <Box>
                  <Typography variant="h6">Disaster Recovery Plans</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recovery sites, failover approach, testing cadence, and cross-system resilience gaps.
                  </Typography>
                </Box>
                {isManager && (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDrPlanCreate()}>
                    Add DR plan
                  </Button>
                )}
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                        Total Plans
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {loading ? '...' : drOverview?.summary.totalPlans ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                        Active Plans
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {loading ? '...' : drOverview?.summary.activePlans ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                        Auto Failover
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {loading ? '...' : drOverview?.summary.automatedFailoverPlans ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                        Needs Review
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {loading ? '...' : drOverview?.summary.plansNeedingReview ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <TableContainer sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                      <TableCell>Plan</TableCell>
                      <TableCell>Application</TableCell>
                      <TableCell>Recovery Site</TableCell>
                      <TableCell>Failover</TableCell>
                      <TableCell>Next Drill</TableCell>
                      <TableCell>Status</TableCell>
                      {isManager && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {drPlans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isManager ? 7 : 6} align="center">
                          No disaster recovery plans yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      drPlans.map((plan) => {
                        const app = applications.find((item) => item.id === plan.applicationId);
                        const reviewDue = !!plan.nextDrTestDate && new Date(plan.nextDrTestDate) < new Date();
                        return (
                          <TableRow key={plan.id}>
                            <TableCell>{plan.planName}</TableCell>
                            <TableCell>{app?.name || '-'}</TableCell>
                            <TableCell>{plan.recoverySite || '-'}</TableCell>
                            <TableCell>{plan.failoverType.replace('_', ' ')}</TableCell>
                            <TableCell>{plan.nextDrTestDate ? new Date(plan.nextDrTestDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={reviewDue ? 'review overdue' : plan.status}
                                color={reviewDue || plan.status === 'needs_review' ? 'warning' : plan.status === 'active' ? 'success' : 'default'}
                              />
                            </TableCell>
                            {isManager && (
                              <TableCell align="right">
                                <Tooltip title="Edit">
                                  <IconButton size="small" onClick={() => openDrPlanEdit(plan)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton size="small" color="error" onClick={() => void deleteDrPlan(plan.id)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                Automated Continuity Gaps
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                      <TableCell>Application</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>Dependencies</TableCell>
                      <TableCell>Backup Coverage</TableCell>
                      <TableCell>Gaps</TableCell>
                      {isManager && <TableCell align="right">Action</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(drOverview?.items.length ?? 0) === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isManager ? 7 : 6} align="center">
                          No critical systems require DR review right now.
                        </TableCell>
                      </TableRow>
                    ) : (
                      drOverview?.items.map((item) => (
                        <TableRow key={item.applicationId}>
                          <TableCell>{item.applicationName}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={item.severity}
                              color={item.severity === 'high' ? 'error' : item.severity === 'medium' ? 'warning' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{item.planId ? planNameById.get(item.planId) || 'Linked' : 'Missing'}</TableCell>
                          <TableCell>{item.dependencyCount}</TableCell>
                          <TableCell>{item.backupAssignmentCount}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {item.issues.length ? item.issues.join('; ') : 'Covered'}
                            </Typography>
                          </TableCell>
                          {isManager && (
                            <TableCell align="right">
                              <Button
                                size="small"
                                onClick={() => {
                                  const linkedPlan = item.planId ? drPlans.find((plan) => plan.id === item.planId) : null;
                                  if (linkedPlan) {
                                    openDrPlanEdit(linkedPlan);
                                    return;
                                  }
                                  openDrPlanCreate(item.applicationId);
                                }}
                              >
                                {item.planId ? 'Open plan' : 'Create plan'}
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">Audit Findings</Typography>
                {isManager && (
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={openFindingCreate}>
                    Add finding
                  </Button>
                )}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                      <TableCell>Ref</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell>Due</TableCell>
                      {isManager && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {findings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isManager ? 7 : 6} align="center">
                          No audit findings yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      findings.map((finding) => (
                        <TableRow key={finding.id}>
                          <TableCell>{finding.findingRef}</TableCell>
                          <TableCell>{finding.title}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={finding.severity}
                              color={['critical', 'high'].includes(finding.severity) ? 'error' : finding.severity === 'medium' ? 'warning' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{finding.status}</TableCell>
                          <TableCell>{finding.owner || '-'}</TableCell>
                          <TableCell>{finding.dueDate ? new Date(finding.dueDate).toLocaleDateString() : '-'}</TableCell>
                          {isManager && (
                            <TableCell align="right">
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => openFindingEdit(finding)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => void deleteFinding(finding.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={riskDialogOpen} onClose={() => !submitting && setRiskDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{riskEditingId ? 'Edit Risk Item' : 'Add Risk Item'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                required
                fullWidth
                value={riskForm.title}
                onChange={(e) => setRiskForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Domain"
                fullWidth
                value={riskForm.domain}
                onChange={(e) => setRiskForm((prev) => ({ ...prev, domain: e.target.value }))}
              >
                {RISK_DOMAINS.map((domain) => (
                  <MenuItem key={domain} value={domain}>
                    {domain}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Likelihood"
                fullWidth
                value={riskForm.likelihood}
                onChange={(e) => setRiskForm((prev) => ({ ...prev, likelihood: e.target.value }))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <MenuItem key={n} value={String(n)}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Impact"
                fullWidth
                value={riskForm.impact}
                onChange={(e) => setRiskForm((prev) => ({ ...prev, impact: e.target.value }))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <MenuItem key={n} value={String(n)}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Status"
                fullWidth
                value={riskForm.status}
                onChange={(e) => setRiskForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="mitigating">Mitigating</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Owner"
                fullWidth
                value={riskForm.owner}
                onChange={(e) => setRiskForm((prev) => ({ ...prev, owner: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Compliance area"
                fullWidth
                value={riskForm.complianceArea}
                onChange={(e) => setRiskForm((prev) => ({ ...prev, complianceArea: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Review frequency"
                fullWidth
                value={riskForm.reviewFrequency}
                onChange={(e) => setRiskForm((prev) => ({ ...prev, reviewFrequency: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                type="date"
                label="Next review date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={riskForm.nextReviewDate}
                onChange={(e) => setRiskForm((prev) => ({ ...prev, nextReviewDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Mitigation"
                fullWidth
                multiline
                minRows={2}
                value={riskForm.mitigation}
                onChange={(e) => setRiskForm((prev) => ({ ...prev, mitigation: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={3}
                value={riskForm.description}
                onChange={(e) => setRiskForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRiskDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={() => void saveRisk()} variant="contained" disabled={submitting || !riskForm.title.trim()}>
            {riskEditingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={findingDialogOpen} onClose={() => !submitting && setFindingDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{findingEditingId ? 'Edit Audit Finding' : 'Add Audit Finding'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Reference (optional)"
                fullWidth
                value={findingForm.findingRef}
                onChange={(e) => setFindingForm((prev) => ({ ...prev, findingRef: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                label="Title"
                required
                fullWidth
                value={findingForm.title}
                onChange={(e) => setFindingForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Source"
                fullWidth
                value={findingForm.source}
                onChange={(e) => setFindingForm((prev) => ({ ...prev, source: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Severity"
                fullWidth
                value={findingForm.severity}
                onChange={(e) => setFindingForm((prev) => ({ ...prev, severity: e.target.value }))}
              >
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Status"
                fullWidth
                value={findingForm.status}
                onChange={(e) => setFindingForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In progress</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Owner"
                fullWidth
                value={findingForm.owner}
                onChange={(e) => setFindingForm((prev) => ({ ...prev, owner: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                type="date"
                label="Due date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={findingForm.dueDate}
                onChange={(e) => setFindingForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Corrective action"
                fullWidth
                multiline
                minRows={2}
                value={findingForm.correctiveAction}
                onChange={(e) => setFindingForm((prev) => ({ ...prev, correctiveAction: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Evidence URL"
                fullWidth
                value={findingForm.evidenceUrl}
                onChange={(e) => setFindingForm((prev) => ({ ...prev, evidenceUrl: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                minRows={2}
                value={findingForm.notes}
                onChange={(e) => setFindingForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={3}
                value={findingForm.description}
                onChange={(e) => setFindingForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFindingDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={() => void saveFinding()} variant="contained" disabled={submitting || !findingForm.title.trim()}>
            {findingEditingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={drDialogOpen} onClose={() => !submitting && setDrDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{drEditingId ? 'Edit Disaster Recovery Plan' : 'Add Disaster Recovery Plan'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Application"
                fullWidth
                value={drPlanForm.applicationId}
                onChange={(e) => {
                  const applicationId = e.target.value;
                  const app = applications.find((item) => item.id === applicationId);
                  setDrPlanForm((prev) => ({
                    ...prev,
                    applicationId,
                    planName: prev.planName || (app ? `${app.name} Recovery Plan` : ''),
                    dependencies: prev.dependencies || app?.dependencies || '',
                  }));
                }}
              >
                <MenuItem value="">Standalone / shared platform</MenuItem>
                {applications.map((app) => (
                  <MenuItem key={app.id} value={app.id}>
                    {app.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Plan name"
                required
                fullWidth
                value={drPlanForm.planName}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, planName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Status"
                fullWidth
                value={drPlanForm.status}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                {DR_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Recovery tier"
                fullWidth
                value={drPlanForm.recoveryTier}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, recoveryTier: e.target.value }))}
              >
                {DR_TIERS.map((tier) => (
                  <MenuItem key={tier} value={tier}>
                    {tier}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Failover type"
                fullWidth
                value={drPlanForm.failoverType}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, failoverType: e.target.value }))}
              >
                {DR_FAILOVER_TYPES.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value.replace('_', ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Recovery site"
                fullWidth
                value={drPlanForm.recoverySite}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, recoverySite: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Alternate site"
                fullWidth
                value={drPlanForm.alternateSite}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, alternateSite: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Recovery owner"
                fullWidth
                value={drPlanForm.recoveryOwner}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, recoveryOwner: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Communication owner"
                fullWidth
                value={drPlanForm.communicationOwner}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, communicationOwner: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Activation trigger"
                fullWidth
                multiline
                minRows={2}
                value={drPlanForm.activationTrigger}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, activationTrigger: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Dependencies / interfaces"
                fullWidth
                multiline
                minRows={2}
                value={drPlanForm.dependencies}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, dependencies: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Backup strategy"
                fullWidth
                multiline
                minRows={2}
                value={drPlanForm.backupStrategy}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, backupStrategy: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Replication scope"
                fullWidth
                multiline
                minRows={2}
                value={drPlanForm.replicationScope}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, replicationScope: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Runbook URL"
                fullWidth
                value={drPlanForm.runbookUrl}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, runbookUrl: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Last DR test"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={drPlanForm.lastDrTestDate}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, lastDrTestDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Next DR test"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={drPlanForm.nextDrTestDate}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, nextDrTestDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Last backup verification"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={drPlanForm.lastBackupVerificationDate}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, lastBackupVerificationDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Next backup verification"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={drPlanForm.nextBackupVerificationDate}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, nextBackupVerificationDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                minRows={3}
                value={drPlanForm.notes}
                onChange={(e) => setDrPlanForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDrDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={() => void saveDrPlan()} variant="contained" disabled={submitting || !drPlanForm.planName.trim()}>
            {drEditingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
