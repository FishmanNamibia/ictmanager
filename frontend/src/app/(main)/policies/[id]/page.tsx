'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import LinkIcon from '@mui/icons-material/Link';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import SaveIcon from '@mui/icons-material/Save';
import UpdateIcon from '@mui/icons-material/Update';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type PolicyStatus = 'draft' | 'approved' | 'under_review' | 'retired' | 'expired';

type PolicyCategory = { id: string; name: string };
type PolicyRecord = {
  id: string;
  title: string;
  policyType: string;
  policyDocumentType: string;
  status: PolicyStatus;
  category?: PolicyCategory | null;
  responsibleOwner: string | null;
  ictOwner: string | null;
  approvalAuthority: string | null;
  version: string | null;
  approvalDate: string | null;
  effectiveDate: string | null;
  reviewFrequency: string | null;
  riskLevel: string | null;
  lastReviewDate: string | null;
  nextReviewDue: string | null;
  documentUrl: string | null;
  notes: string | null;
};

type VersionRecord = {
  id: string;
  versionLabel: string;
  documentUrl: string | null;
  changeSummary: string | null;
  uploadedBy: string | null;
  isCurrent: boolean;
  uploadedAt: string;
};

type WorkflowRecord = {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorName: string | null;
  comments: string | null;
  createdAt: string;
};

type ScopeRecord = { id: string; role: string | null; department: string | null };
type AckRecord = { id: string; userId: string; acknowledgedAt: string; ipAddress: string | null };
type UserLite = { id: string; email: string; fullName: string; role?: string; department?: string | null };
type ComplianceRecord = { policyId: string; compliancePercent: number; requiredUsers: number; acknowledgedUsers: number; outstandingUsers: number };
type ComplianceStats = { byPolicy: ComplianceRecord[] };
type ApplicationLite = { id: string; name: string };
type AssetLite = { id: string; assetTag: string; name: string };
type LicenseLite = { id: string; softwareName: string };
type LinkedEntities = { applications: ApplicationLite[]; assets: AssetLite[]; licenses: LicenseLite[] };
type ScopeDraftRow = { role: string; department: string };
type VersionForm = { versionLabel: string; documentUrl: string; changeSummary: string; isCurrent: boolean };

const STATUS_LABELS: Record<PolicyStatus, string> = {
  draft: 'Draft',
  approved: 'Approved',
  under_review: 'Under review',
  retired: 'Retired',
  expired: 'Expired',
};

const STATUS_COLORS: Record<PolicyStatus, 'default' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  approved: 'success',
  under_review: 'warning',
  retired: 'default',
  expired: 'error',
};

const ROLE_OPTIONS = [
  { value: '', label: 'Any role' },
  { value: 'ict_manager', label: 'ICT Manager' },
  { value: 'ict_staff', label: 'ICT Staff' },
  { value: 'business_manager', label: 'Business Manager' },
  { value: 'executive', label: 'Executive' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'vendor', label: 'Vendor' },
];

function fmtDate(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function saveJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

export default function PolicyDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const isIctManager = user?.role === 'ict_manager';
  const canApprove = user?.role === 'ict_manager' || user?.role === 'executive';

  const [policy, setPolicy] = useState<PolicyRecord | null>(null);
  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowRecord[]>([]);
  const [scope, setScope] = useState<ScopeRecord[]>([]);
  const [scopeDraft, setScopeDraft] = useState<ScopeDraftRow[]>([{ role: '', department: '' }]);
  const [acknowledgements, setAcknowledgements] = useState<AckRecord[]>([]);
  const [unacknowledged, setUnacknowledged] = useState<UserLite[]>([]);
  const [links, setLinks] = useState<LinkedEntities>({ applications: [], assets: [], licenses: [] });
  const [compliance, setCompliance] = useState<ComplianceRecord | null>(null);

  const [applications, setApplications] = useState<ApplicationLite[]>([]);
  const [assets, setAssets] = useState<AssetLite[]>([]);
  const [licenses, setLicenses] = useState<LicenseLite[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);

  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedLicenseId, setSelectedLicenseId] = useState('');
  const [versionForm, setVersionForm] = useState<VersionForm>({ versionLabel: '', documentUrl: '', changeSummary: '', isCurrent: true });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const usersById = useMemo(() => {
    const map = new Map<string, UserLite>();
    users.forEach((item) => map.set(item.id, item));
    return map;
  }, [users]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [policyData, versionData, workflowData, scopeData, ackData, unackData, linkData, complianceData, appData, assetData, licenseData, userData] =
        await Promise.all([
          api<PolicyRecord>(`/policies/${id}`),
          api<VersionRecord[]>(`/policies/${id}/versions`),
          api<WorkflowRecord[]>(`/policies/${id}/workflow`),
          api<ScopeRecord[]>(`/policies/${id}/ack-scope`),
          api<AckRecord[]>(`/policies/${id}/acknowledgements`),
          api<UserLite[]>(`/policies/${id}/unacknowledged`),
          api<LinkedEntities>(`/policies/${id}/links`),
          api<ComplianceStats>('/policies/compliance/stats').catch(() => ({ byPolicy: [] })),
          api<ApplicationLite[]>('/applications').catch(() => []),
          api<AssetLite[]>('/assets').catch(() => []),
          api<LicenseLite[]>('/licenses').catch(() => []),
          api<UserLite[]>('/users').catch(() => []),
        ]);

      setPolicy(policyData);
      setVersions(versionData);
      setWorkflow(workflowData);
      setScope(scopeData);
      setScopeDraft(scopeData.length ? scopeData.map((s) => ({ role: s.role ?? '', department: s.department ?? '' })) : [{ role: '', department: '' }]);
      setAcknowledgements(ackData);
      setUnacknowledged(unackData);
      setLinks(linkData);
      setCompliance(complianceData.byPolicy.find((row) => row.policyId === id) ?? null);
      setApplications(appData);
      setAssets(assetData);
      setLicenses(licenseData);
      setUsers(userData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load policy details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const runLifecycleAction = async (action: 'review' | 'approve' | 'retire') => {
    if (!policy) return;
    setBusy(action);
    try {
      if (action === 'review') await api(`/policies/${policy.id}/send-for-review`, { method: 'POST' });
      if (action === 'approve') await api(`/policies/${policy.id}/approve`, { method: 'POST', body: JSON.stringify({}) });
      if (action === 'retire') await api(`/policies/${policy.id}/retire`, { method: 'POST' });
      setNotice('Policy updated.');
      await loadData();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Policy update failed');
    } finally {
      setBusy(null);
    }
  };

  const acknowledgePolicy = async () => {
    setBusy('ack');
    try {
      await api(`/policies/${id}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null }),
      });
      setNotice('Acknowledgement recorded.');
      await loadData();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to acknowledge');
    } finally {
      setBusy(null);
    }
  };

  const exportEvidence = async () => {
    setBusy('evidence');
    try {
      const data = await api<unknown>(`/policies/${id}/evidence`);
      saveJson(`policy-${id}-evidence.json`, data);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Evidence export failed');
    } finally {
      setBusy(null);
    }
  };

  const addVersion = async () => {
    if (!versionForm.versionLabel.trim()) {
      setNotice('Version label is required.');
      return;
    }
    setBusy('addVersion');
    try {
      await api(`/policies/${id}/versions`, {
        method: 'POST',
        body: JSON.stringify({
          versionLabel: versionForm.versionLabel.trim(),
          documentUrl: versionForm.documentUrl.trim() || null,
          changeSummary: versionForm.changeSummary.trim() || null,
          isCurrent: versionForm.isCurrent,
        }),
      });
      setVersionForm({ versionLabel: '', documentUrl: '', changeSummary: '', isCurrent: true });
      setNotice('Version added.');
      await loadData();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to add version');
    } finally {
      setBusy(null);
    }
  };

  const setCurrentVersion = async (versionId: string) => {
    setBusy(`setCurrent-${versionId}`);
    try {
      await api(`/policies/${id}/versions/${versionId}/set-current`, { method: 'POST' });
      setNotice('Current version updated.');
      await loadData();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to set current version');
    } finally {
      setBusy(null);
    }
  };

  const saveScope = async () => {
    setBusy('scope');
    try {
      const clean = scopeDraft
        .map((row) => ({ role: row.role.trim(), department: row.department.trim() }))
        .filter((row) => row.role || row.department);
      await api(`/policies/${id}/ack-scope`, { method: 'PUT', body: JSON.stringify({ scopes: clean }) });
      setNotice('Acknowledgement scope saved.');
      await loadData();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to save scope');
    } finally {
      setBusy(null);
    }
  };

  const addScopeRow = () => setScopeDraft((curr) => [...curr, { role: '', department: '' }]);
  const removeScopeRow = (index: number) => setScopeDraft((curr) => curr.filter((_, i) => i !== index));
  const updateScopeRow = (index: number, field: 'role' | 'department', value: string) => {
    setScopeDraft((curr) => curr.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const linkEntity = async (kind: 'application' | 'asset' | 'license', entityId: string) => {
    if (!entityId) return;
    setBusy(`link-${kind}`);
    try {
      const body =
        kind === 'application'
          ? { applicationId: entityId }
          : kind === 'asset'
            ? { assetId: entityId }
            : { licenseId: entityId };
      await api(`/policies/${id}/link-${kind}`, { method: 'POST', body: JSON.stringify(body) });
      setNotice('Link added.');
      if (kind === 'application') setSelectedApplicationId('');
      if (kind === 'asset') setSelectedAssetId('');
      if (kind === 'license') setSelectedLicenseId('');
      await loadData();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to link entity');
    } finally {
      setBusy(null);
    }
  };

  const unlinkEntity = async (kind: 'application' | 'asset' | 'license', entityId: string) => {
    setBusy(`unlink-${kind}-${entityId}`);
    try {
      const body =
        kind === 'application'
          ? { applicationId: entityId }
          : kind === 'asset'
            ? { assetId: entityId }
            : { licenseId: entityId };
      await api(`/policies/${id}/unlink-${kind}`, { method: 'POST', body: JSON.stringify(body) });
      setNotice('Link removed.');
      await loadData();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to unlink entity');
    } finally {
      setBusy(null);
    }
  };

  if (error) return <Alert severity="error">{error}</Alert>;
  if (loading || !policy) return <Skeleton variant="rectangular" height={500} />;

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1} mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{policy.title}</Typography>
          <Stack direction="row" spacing={1} mt={0.75}>
            <Chip size="small" label={STATUS_LABELS[policy.status]} color={STATUS_COLORS[policy.status]} />
            <Chip size="small" label={policy.category?.name ?? 'Unassigned'} variant="outlined" />
            <Chip size="small" label={policy.policyDocumentType} variant="outlined" />
          </Stack>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" onClick={() => router.back()}>Back</Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => void exportEvidence()} disabled={busy === 'evidence'}>Evidence</Button>
          <Button variant="outlined" startIcon={<PlaylistAddCheckIcon />} onClick={() => void acknowledgePolicy()} disabled={busy === 'ack'}>Acknowledge</Button>
          {isIctManager && <Button variant="outlined" startIcon={<UpdateIcon />} onClick={() => void runLifecycleAction('review')} disabled={busy === 'review'}>Send for review</Button>}
          {canApprove && <Button variant="contained" startIcon={<CheckIcon />} onClick={() => void runLifecycleAction('approve')} disabled={busy === 'approve'}>Approve</Button>}
          {canApprove && <Button color="warning" variant="outlined" startIcon={<HistoryIcon />} onClick={() => void runLifecycleAction('retire')} disabled={busy === 'retire'}>Retire</Button>}
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={1}>Policy register metadata</Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}><Typography color="text.secondary">Business owner</Typography><Typography>{policy.responsibleOwner ?? '-'}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">ICT owner</Typography><Typography>{policy.ictOwner ?? '-'}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Approval authority</Typography><Typography>{policy.approvalAuthority ?? '-'}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Version</Typography><Typography>{policy.version ?? '-'}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Risk level</Typography><Typography>{policy.riskLevel ?? '-'}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Review frequency</Typography><Typography>{policy.reviewFrequency ?? '-'}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Last review</Typography><Typography>{fmtDate(policy.lastReviewDate)}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Next review due</Typography><Typography>{fmtDate(policy.nextReviewDue)}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Approval date</Typography><Typography>{fmtDate(policy.approvalDate)}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Effective date</Typography><Typography>{fmtDate(policy.effectiveDate)}</Typography></Grid>
              </Grid>
              {policy.notes ? (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography color="text.secondary">Notes</Typography>
                  <Typography>{policy.notes}</Typography>
                </>
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={1}>Acknowledgement compliance</Typography>
              <Typography variant="h4" fontWeight={700}>{compliance?.compliancePercent ?? 0}%</Typography>
              <Typography color="text.secondary">
                Required users: {compliance?.requiredUsers ?? 0} | Acknowledged: {compliance?.acknowledgedUsers ?? 0} | Outstanding: {compliance?.outstandingUsers ?? 0}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography color="text.secondary">Acknowledged records</Typography>
              <Typography>{acknowledgements.length}</Typography>
              <Typography color="text.secondary">Unacknowledged users</Typography>
              <Typography>{unacknowledged.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight={700}>Acknowledgement scope</Typography>
                {isIctManager && <Button startIcon={<SaveIcon />} variant="contained" onClick={() => void saveScope()} disabled={busy === 'scope'}>Save scope</Button>}
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={1.5}>
                Empty scope means all active users in the tenant must acknowledge this policy.
              </Typography>
              {scopeDraft.map((row, index) => (
                <Stack key={`${index}-${row.role}-${row.department}`} direction={{ xs: 'column', md: 'row' }} spacing={1} mb={1}>
                  <TextField
                    select
                    size="small"
                    label="Role"
                    value={row.role}
                    onChange={(e) => updateScopeRow(index, 'role', e.target.value)}
                    sx={{ minWidth: 200 }}
                    disabled={!isIctManager}
                  >
                    {ROLE_OPTIONS.map((role) => <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>)}
                  </TextField>
                  <TextField
                    size="small"
                    label="Department"
                    value={row.department}
                    onChange={(e) => updateScopeRow(index, 'department', e.target.value)}
                    sx={{ minWidth: 240 }}
                    disabled={!isIctManager}
                  />
                  {isIctManager && (
                    <IconButton size="small" color="error" onClick={() => removeScopeRow(index)} disabled={scopeDraft.length <= 1}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              ))}
              {isIctManager && <Button startIcon={<AddIcon />} onClick={addScopeRow}>Add scope row</Button>}
              {scope.length > 0 && <Typography variant="body2" color="text.secondary" mt={1}>Current saved rows: {scope.length}</Typography>}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={1}>Version control</Typography>
              <TableContainer sx={{ mb: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Version</TableCell>
                      <TableCell>Uploaded</TableCell>
                      <TableCell>By</TableCell>
                      <TableCell>Summary</TableCell>
                      <TableCell>Current</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {versions.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center">No versions yet.</TableCell></TableRow>
                    ) : versions.map((version) => (
                      <TableRow key={version.id}>
                        <TableCell>{version.versionLabel}</TableCell>
                        <TableCell>{fmtDate(version.uploadedAt)}</TableCell>
                        <TableCell>{version.uploadedBy ?? '-'}</TableCell>
                        <TableCell>{version.changeSummary ?? '-'}</TableCell>
                        <TableCell>{version.isCurrent ? <Chip size="small" label="Current" color="success" /> : '-'}</TableCell>
                        <TableCell align="right">
                          {!version.isCurrent && isIctManager && (
                            <Button size="small" onClick={() => void setCurrentVersion(version.id)} disabled={busy === `setCurrent-${version.id}`}>
                              Set current
                            </Button>
                          )}
                          {version.documentUrl && (
                            <Button size="small" onClick={() => window.open(version.documentUrl ?? '', '_blank', 'noopener,noreferrer')}>Open</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {isIctManager && (
                <Grid container spacing={1}>
                  <Grid item xs={12} md={2}><TextField size="small" fullWidth label="Version" value={versionForm.versionLabel} onChange={(e) => setVersionForm((s) => ({ ...s, versionLabel: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={4}><TextField size="small" fullWidth label="Document URL" value={versionForm.documentUrl} onChange={(e) => setVersionForm((s) => ({ ...s, documentUrl: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={4}><TextField size="small" fullWidth label="Change summary" value={versionForm.changeSummary} onChange={(e) => setVersionForm((s) => ({ ...s, changeSummary: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><Button variant="contained" startIcon={<AddIcon />} onClick={() => void addVersion()} disabled={busy === 'addVersion'} fullWidth>Add version</Button></Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={1}>Workflow history</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>When</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Actor</TableCell>
                      <TableCell>Comments</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workflow.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center">No workflow events yet.</TableCell></TableRow>
                    ) : workflow.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{fmtDate(event.createdAt)}</TableCell>
                        <TableCell>{event.action}</TableCell>
                        <TableCell>{event.fromStatus ?? '-'}</TableCell>
                        <TableCell>{event.toStatus ?? '-'}</TableCell>
                        <TableCell>{event.actorName ?? '-'}</TableCell>
                        <TableCell>{event.comments ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={1}>Linked module entities</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography fontWeight={600}>Applications</Typography>
                  {links.applications.map((app) => (
                    <Stack key={app.id} direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
                      <Typography variant="body2">{app.name}</Typography>
                      {isIctManager && <IconButton size="small" onClick={() => void unlinkEntity('application', app.id)}><DeleteIcon fontSize="small" /></IconButton>}
                    </Stack>
                  ))}
                  {isIctManager && (
                    <Stack direction="row" spacing={1} mt={1}>
                      <TextField select size="small" label="Add application" value={selectedApplicationId} onChange={(e) => setSelectedApplicationId(e.target.value)} sx={{ minWidth: 220 }}>
                        <MenuItem value="">Select</MenuItem>
                        {applications.map((app) => <MenuItem key={app.id} value={app.id}>{app.name}</MenuItem>)}
                      </TextField>
                      <Button variant="outlined" startIcon={<LinkIcon />} onClick={() => void linkEntity('application', selectedApplicationId)}>Link</Button>
                    </Stack>
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography fontWeight={600}>Assets</Typography>
                  {links.assets.map((asset) => (
                    <Stack key={asset.id} direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
                      <Typography variant="body2">{asset.assetTag} - {asset.name}</Typography>
                      {isIctManager && <IconButton size="small" onClick={() => void unlinkEntity('asset', asset.id)}><DeleteIcon fontSize="small" /></IconButton>}
                    </Stack>
                  ))}
                  {isIctManager && (
                    <Stack direction="row" spacing={1} mt={1}>
                      <TextField select size="small" label="Add asset" value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)} sx={{ minWidth: 220 }}>
                        <MenuItem value="">Select</MenuItem>
                        {assets.map((asset) => <MenuItem key={asset.id} value={asset.id}>{asset.assetTag} - {asset.name}</MenuItem>)}
                      </TextField>
                      <Button variant="outlined" startIcon={<LinkIcon />} onClick={() => void linkEntity('asset', selectedAssetId)}>Link</Button>
                    </Stack>
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography fontWeight={600}>Licenses</Typography>
                  {links.licenses.map((license) => (
                    <Stack key={license.id} direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
                      <Typography variant="body2">{license.softwareName}</Typography>
                      {isIctManager && <IconButton size="small" onClick={() => void unlinkEntity('license', license.id)}><DeleteIcon fontSize="small" /></IconButton>}
                    </Stack>
                  ))}
                  {isIctManager && (
                    <Stack direction="row" spacing={1} mt={1}>
                      <TextField select size="small" label="Add license" value={selectedLicenseId} onChange={(e) => setSelectedLicenseId(e.target.value)} sx={{ minWidth: 220 }}>
                        <MenuItem value="">Select</MenuItem>
                        {licenses.map((license) => <MenuItem key={license.id} value={license.id}>{license.softwareName}</MenuItem>)}
                      </TextField>
                      <Button variant="outlined" startIcon={<LinkIcon />} onClick={() => void linkEntity('license', selectedLicenseId)}>Link</Button>
                    </Stack>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={1}>Acknowledged users</Typography>
              {acknowledgements.length === 0 ? (
                <Typography color="text.secondary">No acknowledgements yet.</Typography>
              ) : acknowledgements.slice(0, 10).map((ack) => {
                const u = usersById.get(ack.userId);
                return (
                  <Typography key={ack.id} variant="body2">
                    {(u?.fullName ?? ack.userId)} | {fmtDate(ack.acknowledgedAt)} | {ack.ipAddress ?? 'No IP'}
                  </Typography>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={1}>Unacknowledged users</Typography>
              {unacknowledged.length === 0 ? (
                <Typography color="text.secondary">All scoped users have acknowledged this policy.</Typography>
              ) : unacknowledged.slice(0, 10).map((u) => (
                <Typography key={u.id} variant="body2">
                  {u.fullName} ({u.email}) | {u.department ?? 'No department'}
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={!!notice} autoHideDuration={3000} onClose={() => setNotice(null)}>
        <Alert severity="info" onClose={() => setNotice(null)} sx={{ width: '100%' }}>
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  );
}
