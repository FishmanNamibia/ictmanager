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

type ChangeRequest = {
  id: string;
  changeNumber: string;
  title: string;
  description?: string | null;
  category?: string | null;
  riskLevel: string;
  impactLevel: string;
  status: string;
  requestedBy: string;
  approver?: string | null;
  assignedTo?: string | null;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  outageExpected: boolean;
  businessApproval: boolean;
  rollbackPlan?: string | null;
  testPlan?: string | null;
  implementationNotes?: string | null;
};

type ReleaseRecord = {
  id: string;
  releaseNumber: string;
  name: string;
  version?: string | null;
  environment: string;
  status: string;
  plannedDate?: string | null;
  releaseDate?: string | null;
  changeRequestId?: string | null;
  changeRequest?: { id: string; changeNumber: string; title: string } | null;
  releaseManager?: string | null;
  notes?: string | null;
  postReleaseSummary?: string | null;
};

type Stats = {
  changes: {
    total: number;
    open: number;
    pendingApprovals: number;
    highRisk: number;
    scheduledThisMonth: number;
    successRatePercent: number;
  };
  releases: {
    total: number;
    planned: number;
    completed: number;
    failedOrRolledBack: number;
    thisMonth: number;
  };
};

type ChangeForm = {
  title: string;
  category: string;
  riskLevel: string;
  impactLevel: string;
  status: string;
  requestedBy: string;
  approver: string;
  assignedTo: string;
  plannedStart: string;
  plannedEnd: string;
  outageExpected: string;
  businessApproval: string;
  rollbackPlan: string;
  testPlan: string;
  implementationNotes: string;
  description: string;
};

type ReleaseForm = {
  name: string;
  version: string;
  environment: string;
  status: string;
  plannedDate: string;
  releaseDate: string;
  changeRequestId: string;
  releaseManager: string;
  postReleaseSummary: string;
  notes: string;
};

const EMPTY_CHANGE_FORM: ChangeForm = {
  title: '',
  category: '',
  riskLevel: 'medium',
  impactLevel: 'medium',
  status: 'requested',
  requestedBy: '',
  approver: '',
  assignedTo: '',
  plannedStart: '',
  plannedEnd: '',
  outageExpected: 'false',
  businessApproval: 'false',
  rollbackPlan: '',
  testPlan: '',
  implementationNotes: '',
  description: '',
};

const EMPTY_RELEASE_FORM: ReleaseForm = {
  name: '',
  version: '',
  environment: 'production',
  status: 'planned',
  plannedDate: '',
  releaseDate: '',
  changeRequestId: '',
  releaseManager: '',
  postReleaseSummary: '',
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

export default function ChangeManagementPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'ict_manager';
  const canCreateChange = isManager || user?.role === 'ict_staff';

  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [releases, setReleases] = useState<ReleaseRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [changeEditingId, setChangeEditingId] = useState<string | null>(null);
  const [releaseEditingId, setReleaseEditingId] = useState<string | null>(null);
  const [changeForm, setChangeForm] = useState<ChangeForm>(EMPTY_CHANGE_FORM);
  const [releaseForm, setReleaseForm] = useState<ReleaseForm>(EMPTY_RELEASE_FORM);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [changeData, releaseData, statData] = await Promise.all([
        api<ChangeRequest[]>('/change-management/changes'),
        api<ReleaseRecord[]>('/change-management/releases'),
        api<Stats>('/change-management/dashboard-stats'),
      ]);
      setChanges(changeData);
      setReleases(releaseData);
      setStats(statData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load change management data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!user?.email) return;
    setChangeForm((prev) => ({ ...prev, requestedBy: prev.requestedBy || user.email }));
  }, [user?.email]);

  const cards = useMemo(() => ([
    { label: 'Open Changes', value: stats?.changes.open ?? 0 },
    { label: 'Pending Approvals', value: stats?.changes.pendingApprovals ?? 0 },
    { label: 'High Risk Changes', value: stats?.changes.highRisk ?? 0 },
    { label: 'Change Success %', value: `${stats?.changes.successRatePercent ?? 0}%` },
    { label: 'Releases This Month', value: stats?.releases.thisMonth ?? 0 },
    { label: 'Failed/Rolled Back', value: stats?.releases.failedOrRolledBack ?? 0 },
  ]), [stats]);

  const openChangeCreate = () => {
    setChangeEditingId(null);
    setChangeForm((prev) => ({ ...EMPTY_CHANGE_FORM, requestedBy: prev.requestedBy || user?.email || '' }));
    setChangeDialogOpen(true);
  };

  const openChangeEdit = (change: ChangeRequest) => {
    setChangeEditingId(change.id);
    setChangeForm({
      title: change.title ?? '',
      category: change.category ?? '',
      riskLevel: change.riskLevel ?? 'medium',
      impactLevel: change.impactLevel ?? 'medium',
      status: change.status ?? 'requested',
      requestedBy: change.requestedBy ?? '',
      approver: change.approver ?? '',
      assignedTo: change.assignedTo ?? '',
      plannedStart: toInputDate(change.plannedStart),
      plannedEnd: toInputDate(change.plannedEnd),
      outageExpected: change.outageExpected ? 'true' : 'false',
      businessApproval: change.businessApproval ? 'true' : 'false',
      rollbackPlan: change.rollbackPlan ?? '',
      testPlan: change.testPlan ?? '',
      implementationNotes: change.implementationNotes ?? '',
      description: change.description ?? '',
    });
    setChangeDialogOpen(true);
  };

  const openReleaseCreate = () => {
    setReleaseEditingId(null);
    setReleaseForm((prev) => ({ ...EMPTY_RELEASE_FORM, changeRequestId: prev.changeRequestId || changes[0]?.id || '' }));
    setReleaseDialogOpen(true);
  };

  const openReleaseEdit = (release: ReleaseRecord) => {
    setReleaseEditingId(release.id);
    setReleaseForm({
      name: release.name ?? '',
      version: release.version ?? '',
      environment: release.environment ?? 'production',
      status: release.status ?? 'planned',
      plannedDate: toInputDate(release.plannedDate),
      releaseDate: toInputDate(release.releaseDate),
      changeRequestId: release.changeRequestId ?? '',
      releaseManager: release.releaseManager ?? '',
      postReleaseSummary: release.postReleaseSummary ?? '',
      notes: release.notes ?? '',
    });
    setReleaseDialogOpen(true);
  };

  const saveChange = async () => {
    if (!changeForm.title.trim() || !changeForm.requestedBy.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: changeForm.title.trim(),
        category: changeForm.category.trim() || undefined,
        riskLevel: changeForm.riskLevel,
        impactLevel: changeForm.impactLevel,
        status: changeForm.status,
        requestedBy: changeForm.requestedBy.trim(),
        approver: changeForm.approver.trim() || undefined,
        assignedTo: changeForm.assignedTo.trim() || undefined,
        plannedStart: toIsoDate(changeForm.plannedStart),
        plannedEnd: toIsoDate(changeForm.plannedEnd),
        outageExpected: changeForm.outageExpected === 'true',
        businessApproval: changeForm.businessApproval === 'true',
        rollbackPlan: changeForm.rollbackPlan.trim() || undefined,
        testPlan: changeForm.testPlan.trim() || undefined,
        implementationNotes: changeForm.implementationNotes.trim() || undefined,
        description: changeForm.description.trim() || undefined,
      };
      if (changeEditingId) {
        await api(`/change-management/changes/${changeEditingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/change-management/changes', { method: 'POST', body: JSON.stringify(payload) });
      }
      setChangeDialogOpen(false);
      setChangeEditingId(null);
      setChangeForm(EMPTY_CHANGE_FORM);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save change request');
    } finally {
      setSubmitting(false);
    }
  };

  const saveRelease = async () => {
    if (!releaseForm.name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: releaseForm.name.trim(),
        version: releaseForm.version.trim() || undefined,
        environment: releaseForm.environment.trim() || 'production',
        status: releaseForm.status,
        plannedDate: toIsoDate(releaseForm.plannedDate),
        releaseDate: toIsoDate(releaseForm.releaseDate),
        changeRequestId: releaseForm.changeRequestId || undefined,
        releaseManager: releaseForm.releaseManager.trim() || undefined,
        postReleaseSummary: releaseForm.postReleaseSummary.trim() || undefined,
        notes: releaseForm.notes.trim() || undefined,
      };
      if (releaseEditingId) {
        await api(`/change-management/releases/${releaseEditingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/change-management/releases', { method: 'POST', body: JSON.stringify(payload) });
      }
      setReleaseDialogOpen(false);
      setReleaseEditingId(null);
      setReleaseForm(EMPTY_RELEASE_FORM);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save release');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteChange = async (id: string) => {
    if (!window.confirm('Delete this change request?')) return;
    setSubmitting(true);
    setError(null);
    try {
      await api(`/change-management/changes/${id}`, { method: 'DELETE' });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete change request');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRelease = async (id: string) => {
    if (!window.confirm('Delete this release record?')) return;
    setSubmitting(true);
    setError(null);
    try {
      await api(`/change-management/releases/${id}`, { method: 'DELETE' });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete release');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Change Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Change governance, approvals, rollback planning, and release traceability.
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
          <Grid item xs={6} md={4} lg={2} key={card.label}>
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
                <Typography variant="h6">Change Requests</Typography>
                {canCreateChange && (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={openChangeCreate}>
                    New change
                  </Button>
                )}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                      <TableCell>Change</TableCell>
                      <TableCell>Risk</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Requested By</TableCell>
                      <TableCell>Planned Start</TableCell>
                      {isManager && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {changes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isManager ? 6 : 5} align="center">
                          No change requests yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      changes.map((change) => (
                        <TableRow key={change.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{change.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{change.changeNumber}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={change.riskLevel}
                              color={['high', 'critical'].includes(change.riskLevel) ? 'error' : change.riskLevel === 'medium' ? 'warning' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{change.status}</TableCell>
                          <TableCell>{change.requestedBy}</TableCell>
                          <TableCell>{change.plannedStart ? new Date(change.plannedStart).toLocaleDateString() : '-'}</TableCell>
                          {isManager && (
                            <TableCell align="right">
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => openChangeEdit(change)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => void deleteChange(change.id)}>
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
                <Typography variant="h6">Releases</Typography>
                {isManager && (
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={openReleaseCreate}>
                    New release
                  </Button>
                )}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                      <TableCell>Release</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Environment</TableCell>
                      <TableCell>Change Ref</TableCell>
                      <TableCell>Planned Date</TableCell>
                      {isManager && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {releases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isManager ? 6 : 5} align="center">
                          No releases yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      releases.map((release) => (
                        <TableRow key={release.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{release.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{release.releaseNumber}</Typography>
                          </TableCell>
                          <TableCell>{release.status}</TableCell>
                          <TableCell>{release.environment}</TableCell>
                          <TableCell>{release.changeRequest?.changeNumber || '-'}</TableCell>
                          <TableCell>{release.plannedDate ? new Date(release.plannedDate).toLocaleDateString() : '-'}</TableCell>
                          {isManager && (
                            <TableCell align="right">
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => openReleaseEdit(release)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => void deleteRelease(release.id)}>
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

      <Dialog open={changeDialogOpen} onClose={() => !submitting && setChangeDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{changeEditingId ? 'Edit Change Request' : 'Create Change Request'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField label="Title" required fullWidth value={changeForm.title} onChange={(e) => setChangeForm((prev) => ({ ...prev, title: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Category" fullWidth value={changeForm.category} onChange={(e) => setChangeForm((prev) => ({ ...prev, category: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select label="Risk level" fullWidth value={changeForm.riskLevel} onChange={(e) => setChangeForm((prev) => ({ ...prev, riskLevel: e.target.value }))}>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select label="Impact level" fullWidth value={changeForm.impactLevel} onChange={(e) => setChangeForm((prev) => ({ ...prev, impactLevel: e.target.value }))}>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select label="Status" fullWidth value={changeForm.status} onChange={(e) => setChangeForm((prev) => ({ ...prev, status: e.target.value }))}>
                <MenuItem value="requested">Requested</MenuItem>
                <MenuItem value="assessment">Assessment</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="implemented">Implemented</MenuItem>
                <MenuItem value="backed_out">Backed out</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Requested by" required fullWidth value={changeForm.requestedBy} onChange={(e) => setChangeForm((prev) => ({ ...prev, requestedBy: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Approver" fullWidth value={changeForm.approver} onChange={(e) => setChangeForm((prev) => ({ ...prev, approver: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Assigned to" fullWidth value={changeForm.assignedTo} onChange={(e) => setChangeForm((prev) => ({ ...prev, assignedTo: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField type="date" label="Planned start" fullWidth InputLabelProps={{ shrink: true }} value={changeForm.plannedStart} onChange={(e) => setChangeForm((prev) => ({ ...prev, plannedStart: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField type="date" label="Planned end" fullWidth InputLabelProps={{ shrink: true }} value={changeForm.plannedEnd} onChange={(e) => setChangeForm((prev) => ({ ...prev, plannedEnd: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select label="Outage expected" fullWidth value={changeForm.outageExpected} onChange={(e) => setChangeForm((prev) => ({ ...prev, outageExpected: e.target.value }))}>
                <MenuItem value="false">No</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select label="Business approval" fullWidth value={changeForm.businessApproval} onChange={(e) => setChangeForm((prev) => ({ ...prev, businessApproval: e.target.value }))}>
                <MenuItem value="false">No</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Rollback plan" fullWidth multiline minRows={2} value={changeForm.rollbackPlan} onChange={(e) => setChangeForm((prev) => ({ ...prev, rollbackPlan: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Test plan" fullWidth multiline minRows={2} value={changeForm.testPlan} onChange={(e) => setChangeForm((prev) => ({ ...prev, testPlan: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Implementation notes" fullWidth multiline minRows={2} value={changeForm.implementationNotes} onChange={(e) => setChangeForm((prev) => ({ ...prev, implementationNotes: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" fullWidth multiline minRows={3} value={changeForm.description} onChange={(e) => setChangeForm((prev) => ({ ...prev, description: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangeDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={() => void saveChange()} variant="contained" disabled={submitting || !changeForm.title.trim() || !changeForm.requestedBy.trim()}>
            {changeEditingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={releaseDialogOpen} onClose={() => !submitting && setReleaseDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{releaseEditingId ? 'Edit Release' : 'Create Release'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField label="Name" required fullWidth value={releaseForm.name} onChange={(e) => setReleaseForm((prev) => ({ ...prev, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Version" fullWidth value={releaseForm.version} onChange={(e) => setReleaseForm((prev) => ({ ...prev, version: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Environment" fullWidth value={releaseForm.environment} onChange={(e) => setReleaseForm((prev) => ({ ...prev, environment: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select label="Status" fullWidth value={releaseForm.status} onChange={(e) => setReleaseForm((prev) => ({ ...prev, status: e.target.value }))}>
                <MenuItem value="planned">Planned</MenuItem>
                <MenuItem value="in_progress">In progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="rolled_back">Rolled back</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField type="date" label="Planned date" fullWidth InputLabelProps={{ shrink: true }} value={releaseForm.plannedDate} onChange={(e) => setReleaseForm((prev) => ({ ...prev, plannedDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField type="date" label="Release date" fullWidth InputLabelProps={{ shrink: true }} value={releaseForm.releaseDate} onChange={(e) => setReleaseForm((prev) => ({ ...prev, releaseDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select label="Change request" fullWidth value={releaseForm.changeRequestId} onChange={(e) => setReleaseForm((prev) => ({ ...prev, changeRequestId: e.target.value }))}>
                <MenuItem value="">None</MenuItem>
                {changes.map((change) => (
                  <MenuItem key={change.id} value={change.id}>
                    {change.changeNumber} - {change.title}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Release manager" fullWidth value={releaseForm.releaseManager} onChange={(e) => setReleaseForm((prev) => ({ ...prev, releaseManager: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Post release summary" fullWidth multiline minRows={2} value={releaseForm.postReleaseSummary} onChange={(e) => setReleaseForm((prev) => ({ ...prev, postReleaseSummary: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" fullWidth multiline minRows={2} value={releaseForm.notes} onChange={(e) => setReleaseForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReleaseDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={() => void saveRelease()} variant="contained" disabled={submitting || !releaseForm.name.trim()}>
            {releaseEditingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

