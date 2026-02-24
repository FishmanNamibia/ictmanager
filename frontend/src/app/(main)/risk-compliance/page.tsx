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
import { api } from '@/lib/api';
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

function toIsoDate(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function toInputDate(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

const RISK_DOMAINS = ['operations', 'vendor', 'project', 'compliance', 'security', 'data', 'finance', 'other'];

export default function RiskCompliancePage() {
  const { user } = useAuth();
  const isManager = user?.role === 'ict_manager';

  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [findingDialogOpen, setFindingDialogOpen] = useState(false);
  const [riskEditingId, setRiskEditingId] = useState<string | null>(null);
  const [findingEditingId, setFindingEditingId] = useState<string | null>(null);
  const [riskForm, setRiskForm] = useState<RiskForm>(EMPTY_RISK_FORM);
  const [findingForm, setFindingForm] = useState<FindingForm>(EMPTY_FINDING_FORM);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [riskData, findingData, statData] = await Promise.all([
        api<RiskItem[]>('/risk-compliance/risks'),
        api<AuditFinding[]>('/risk-compliance/findings'),
        api<Stats>('/risk-compliance/dashboard-stats'),
      ]);
      setRisks(riskData);
      setFindings(findingData);
      setStats(statData);
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
    { label: 'Compliance Posture', value: `${stats?.compliancePosture.overallScore ?? 0}%` },
  ]), [stats]);

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
    </Box>
  );
}
