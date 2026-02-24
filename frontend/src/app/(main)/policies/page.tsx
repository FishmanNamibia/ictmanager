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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
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
import CategoryIcon from '@mui/icons-material/Category';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PreviewIcon from '@mui/icons-material/Preview';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type PolicyStatus = 'draft' | 'approved' | 'under_review' | 'retired' | 'expired';
type PolicyDocumentType = 'policy' | 'standard' | 'procedure' | 'guideline';
type RiskLevel = 'high' | 'medium' | 'low';

type PolicyCategory = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
};

type PolicyRecord = {
  id: string;
  title: string;
  policyType: string;
  policyDocumentType: PolicyDocumentType;
  status: PolicyStatus;
  category?: PolicyCategory | null;
  responsibleOwner: string | null;
  ictOwner: string | null;
  approvalAuthority: string | null;
  version: string | null;
  approvalDate: string | null;
  effectiveDate: string | null;
  reviewFrequency: string | null;
  riskLevel: RiskLevel | null;
  lastReviewDate: string | null;
  nextReviewDue: string | null;
  documentUrl: string | null;
  notes: string | null;
};

type ComplianceStats = {
  overallCompliancePercent: number;
  byPolicy: Array<{ policyId: string; compliancePercent: number }>;
};

type GovernanceStats = {
  total: number;
  overdueForReview: number;
  approved: number;
};

type PolicyForm = {
  title: string;
  policyType: string;
  policyDocumentType: PolicyDocumentType;
  status: PolicyStatus;
  categoryId: string;
  responsibleOwner: string;
  ictOwner: string;
  approvalAuthority: string;
  version: string;
  reviewFrequency: string;
  riskLevel: '' | RiskLevel;
  lastReviewDate: string;
  nextReviewDue: string;
  approvalDate: string;
  effectiveDate: string;
  documentUrl: string;
  notes: string;
};

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

const EMPTY_FORM: PolicyForm = {
  title: '',
  policyType: 'other',
  policyDocumentType: 'policy',
  status: 'draft',
  categoryId: '',
  responsibleOwner: '',
  ictOwner: '',
  approvalAuthority: '',
  version: '',
  reviewFrequency: '',
  riskLevel: '',
  lastReviewDate: '',
  nextReviewDue: '',
  approvalDate: '',
  effectiveDate: '',
  documentUrl: '',
  notes: '',
};

const DOC_TYPES: Array<{ value: PolicyDocumentType; label: string }> = [
  { value: 'policy', label: 'Policy' },
  { value: 'standard', label: 'Standard' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'guideline', label: 'Guideline' },
];

const POLICY_TYPES: Array<{ value: string; label: string }> = [
  { value: 'acceptable_use', label: 'Acceptable use' },
  { value: 'security', label: 'Information security' },
  { value: 'disaster_recovery', label: 'Disaster recovery' },
  { value: 'backup', label: 'Backup and recovery' },
  { value: 'data_protection', label: 'Data protection' },
  { value: 'other', label: 'Other' },
];

const RISK_LEVELS: Array<{ value: RiskLevel; label: string }> = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

function fmtDate(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function dateInput(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function overdue(nextReview?: string | null): boolean {
  if (!nextReview) return false;
  return new Date(nextReview) < new Date();
}

function toPayload(form: PolicyForm): Record<string, unknown> {
  return {
    title: form.title.trim(),
    policyType: form.policyType,
    policyDocumentType: form.policyDocumentType,
    status: form.status,
    categoryId: form.categoryId || null,
    responsibleOwner: form.responsibleOwner.trim() || null,
    ictOwner: form.ictOwner.trim() || null,
    approvalAuthority: form.approvalAuthority.trim() || null,
    version: form.version.trim() || null,
    reviewFrequency: form.reviewFrequency.trim() || null,
    riskLevel: form.riskLevel || null,
    lastReviewDate: form.lastReviewDate || null,
    nextReviewDue: form.nextReviewDue || null,
    approvalDate: form.approvalDate || null,
    effectiveDate: form.effectiveDate || null,
    documentUrl: form.documentUrl.trim() || null,
    notes: form.notes.trim() || null,
  };
}

function fromPolicy(policy: PolicyRecord): PolicyForm {
  return {
    title: policy.title ?? '',
    policyType: policy.policyType ?? 'other',
    policyDocumentType: policy.policyDocumentType ?? 'policy',
    status: policy.status ?? 'draft',
    categoryId: policy.category?.id ?? '',
    responsibleOwner: policy.responsibleOwner ?? '',
    ictOwner: policy.ictOwner ?? '',
    approvalAuthority: policy.approvalAuthority ?? '',
    version: policy.version ?? '',
    reviewFrequency: policy.reviewFrequency ?? '',
    riskLevel: policy.riskLevel ?? '',
    lastReviewDate: dateInput(policy.lastReviewDate),
    nextReviewDue: dateInput(policy.nextReviewDue),
    approvalDate: dateInput(policy.approvalDate),
    effectiveDate: dateInput(policy.effectiveDate),
    documentUrl: policy.documentUrl ?? '',
    notes: policy.notes ?? '',
  };
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

export default function PoliciesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isIctManager = user?.role === 'ict_manager';
  const canApprove = user?.role === 'ict_manager' || user?.role === 'executive';

  const [rows, setRows] = useState<PolicyRecord[]>([]);
  const [categories, setCategories] = useState<PolicyCategory[]>([]);
  const [compliance, setCompliance] = useState<ComplianceStats | null>(null);
  const [governance, setGovernance] = useState<GovernanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | PolicyStatus>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [riskLevel, setRiskLevel] = useState<'all' | RiskLevel>('all');
  const [documentType, setDocumentType] = useState<'all' | PolicyDocumentType>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [editing, setEditing] = useState<PolicyRecord | null>(null);
  const [form, setForm] = useState<PolicyForm>(EMPTY_FORM);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuPolicyId, setMenuPolicyId] = useState<string | null>(null);

  const complianceByPolicy = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of compliance?.byPolicy ?? []) map.set(item.policyId, item.compliancePercent);
    return map;
  }, [compliance]);

  const selectedPolicy = rows.find((item) => item.id === menuPolicyId) ?? null;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (status !== 'all') qs.set('status', status);
    if (categoryId !== 'all') qs.set('categoryId', categoryId);
    if (riskLevel !== 'all') qs.set('riskLevel', riskLevel);
    if (documentType !== 'all') qs.set('documentType', documentType);
    if (search.trim()) qs.set('search', search.trim());
    if (overdueOnly) qs.set('overdue', 'true');
    try {
      const [policies, cats, complianceStats, governanceStats] = await Promise.all([
        api<PolicyRecord[]>(`/policies?${qs.toString()}`),
        api<PolicyCategory[]>('/policies/categories'),
        api<ComplianceStats>('/policies/compliance/stats').catch(() => null),
        api<GovernanceStats>('/policies/governance-stats').catch(() => null),
      ]);
      setRows(policies);
      setCategories(cats);
      setCompliance(complianceStats);
      setGovernance(governanceStats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, [categoryId, documentType, overdueOnly, riskLevel, search, status]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openNewPolicy = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEditPolicy = (policy: PolicyRecord) => {
    setEditing(policy);
    setForm(fromPolicy(policy));
    setFormOpen(true);
  };

  const savePolicy = async () => {
    if (!form.title.trim()) {
      setNotice('Policy title is required.');
      return;
    }
    setFormSaving(true);
    try {
      const payload = toPayload(form);
      if (editing) {
        await api(`/policies/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        setNotice('Policy updated.');
      } else {
        await api('/policies', { method: 'POST', body: JSON.stringify(payload) });
        setNotice('Policy created.');
      }
      setFormOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await reload();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to save policy');
    } finally {
      setFormSaving(false);
    }
  };

  const saveCategory = async () => {
    if (!categoryName.trim()) {
      setNotice('Category name is required.');
      return;
    }
    setCategorySaving(true);
    try {
      await api('/policies/categories', {
        method: 'POST',
        body: JSON.stringify({ name: categoryName.trim(), description: categoryDescription.trim() || null }),
      });
      setCategoryOpen(false);
      setCategoryName('');
      setCategoryDescription('');
      setNotice('Category added.');
      await reload();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to create category');
    } finally {
      setCategorySaving(false);
    }
  };

  const lifecycle = async (policy: PolicyRecord, action: 'review' | 'approve' | 'retire') => {
    try {
      if (action === 'review') await api(`/policies/${policy.id}/send-for-review`, { method: 'POST' });
      if (action === 'approve') await api(`/policies/${policy.id}/approve`, { method: 'POST', body: JSON.stringify({}) });
      if (action === 'retire') await api(`/policies/${policy.id}/retire`, { method: 'POST' });
      setNotice(`Policy ${action === 'review' ? 'sent for review' : action}.`);
      await reload();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Policy update failed');
    }
  };

  const removePolicy = async (policy: PolicyRecord) => {
    if (!window.confirm(`Delete "${policy.title}"?`)) return;
    try {
      await api(`/policies/${policy.id}`, { method: 'DELETE' });
      setNotice('Policy deleted.');
      await reload();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const exportEvidence = async (policy: PolicyRecord) => {
    try {
      const data = await api<unknown>(`/policies/${policy.id}/evidence`);
      saveJson(`policy-${policy.id}-evidence.json`, data);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Evidence export failed');
    }
  };

  const totalPolicies = governance?.total ?? rows.length;
  const approvedPolicies = governance?.approved ?? rows.filter((row) => row.status === 'approved').length;
  const overduePolicies = governance?.overdueForReview ?? rows.filter((row) => overdue(row.nextReviewDue)).length;
  const highRiskMissing = rows.filter((row) => row.riskLevel === 'high' && row.status !== 'approved').length;
  const complianceScore = compliance?.overallCompliancePercent ?? 100;

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1} mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>ICT Policies Module</Typography>
          <Typography color="text.secondary">Governance, lifecycle, ownership, acknowledgement, and audit evidence.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {isIctManager && <Button variant="outlined" startIcon={<CategoryIcon />} onClick={() => setCategoryOpen(true)}>New category</Button>}
          {isIctManager && <Button variant="contained" startIcon={<AddIcon />} onClick={openNewPolicy}>Add policy</Button>}
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography variant="caption">Total policies</Typography><Typography variant="h4" fontWeight={700}>{totalPolicies}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography variant="caption">Approved</Typography><Typography variant="h4" fontWeight={700} color="success.main">{approvedPolicies}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography variant="caption">Overdue reviews</Typography><Typography variant="h4" fontWeight={700} color={overduePolicies > 0 ? 'warning.main' : 'text.primary'}>{overduePolicies}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography variant="caption">Compliance score</Typography><Typography variant="h4" fontWeight={700}>{complianceScore}%</Typography><Typography variant="body2" color="text.secondary">{highRiskMissing} high-risk pending approval</Typography></CardContent></Card></Grid>
      </Grid>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                size="small"
                fullWidth
                label="Search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={() => setSearch(searchInput)}
                onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput); }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select size="small" fullWidth label="Status" value={status} onChange={(e) => setStatus(e.target.value as 'all' | PolicyStatus)}>
                <MenuItem value="all">All</MenuItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select size="small" fullWidth label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select size="small" fullWidth label="Risk" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as 'all' | RiskLevel)}>
                <MenuItem value="all">All</MenuItem>
                {RISK_LEVELS.map((risk) => <MenuItem key={risk.value} value={risk.value}>{risk.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select size="small" fullWidth label="Doc type" value={documentType} onChange={(e) => setDocumentType(e.target.value as 'all' | PolicyDocumentType)}>
                <MenuItem value="all">All</MenuItem>
                {DOC_TYPES.map((doc) => <MenuItem key={doc.value} value={doc.value}>{doc.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={1}>
              <FormControlLabel control={<Switch checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />} label="Overdue" sx={{ m: 0 }} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 2 }}><Skeleton variant="rectangular" height={280} /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'grey.50' } }}>
                    <TableCell>Policy name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Last review</TableCell>
                    <TableCell>Next review</TableCell>
                    <TableCell align="center">Compliance %</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No policies found.</TableCell></TableRow>
                  ) : rows.map((policy) => (
                    <TableRow key={policy.id} hover onClick={() => router.push(`/policies/${policy.id}`)} sx={{ cursor: 'pointer' }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{policy.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{policy.policyDocumentType} | {policy.policyType}</Typography>
                      </TableCell>
                      <TableCell>{policy.category?.name ?? '-'}</TableCell>
                      <TableCell><Chip size="small" label={STATUS_LABELS[policy.status]} color={STATUS_COLORS[policy.status]} /></TableCell>
                      <TableCell>{policy.responsibleOwner ?? '-'}</TableCell>
                      <TableCell>{fmtDate(policy.lastReviewDate)}</TableCell>
                      <TableCell>
                        {policy.nextReviewDue ? <Chip size="small" label={fmtDate(policy.nextReviewDue)} color={overdue(policy.nextReviewDue) ? 'error' : 'default'} /> : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip size="small" label={`${complianceByPolicy.get(policy.id) ?? 0}%`} />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuPolicyId(policy.id); }}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => { setMenuAnchor(null); setMenuPolicyId(null); }}>
        <MenuItem onClick={() => { if (selectedPolicy) router.push(`/policies/${selectedPolicy.id}`); setMenuAnchor(null); }}><PreviewIcon fontSize="small" sx={{ mr: 1 }} />View policy</MenuItem>
        {isIctManager && selectedPolicy && <MenuItem onClick={() => { openEditPolicy(selectedPolicy); setMenuAnchor(null); }}><EditIcon fontSize="small" sx={{ mr: 1 }} />Edit metadata</MenuItem>}
        {isIctManager && selectedPolicy && <MenuItem onClick={() => { void lifecycle(selectedPolicy, 'review'); setMenuAnchor(null); }}><PublishedWithChangesIcon fontSize="small" sx={{ mr: 1 }} />Send for review</MenuItem>}
        {canApprove && selectedPolicy && <MenuItem onClick={() => { void lifecycle(selectedPolicy, 'approve'); setMenuAnchor(null); }}><CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />Approve</MenuItem>}
        {canApprove && selectedPolicy && <MenuItem onClick={() => { void lifecycle(selectedPolicy, 'retire'); setMenuAnchor(null); }}><TaskAltIcon fontSize="small" sx={{ mr: 1 }} />Retire</MenuItem>}
        {selectedPolicy && <MenuItem onClick={() => { void exportEvidence(selectedPolicy); setMenuAnchor(null); }}><DownloadIcon fontSize="small" sx={{ mr: 1 }} />Export evidence</MenuItem>}
        {isIctManager && selectedPolicy && <MenuItem sx={{ color: 'error.main' }} onClick={() => { void removePolicy(selectedPolicy); setMenuAnchor(null); }}><DeleteIcon fontSize="small" sx={{ mr: 1 }} />Delete</MenuItem>}
      </Menu>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit policy' : 'Add policy'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={8}><TextField fullWidth required label="Policy title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as PolicyStatus }))}>{Object.entries(STATUS_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField select fullWidth label="Document type" value={form.policyDocumentType} onChange={(e) => setForm((s) => ({ ...s, policyDocumentType: e.target.value as PolicyDocumentType }))}>{DOC_TYPES.map((d) => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField select fullWidth label="Policy type" value={form.policyType} onChange={(e) => setForm((s) => ({ ...s, policyType: e.target.value }))}>{POLICY_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField select fullWidth label="Category" value={form.categoryId} onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value }))}><MenuItem value="">Unassigned</MenuItem>{categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Business owner" value={form.responsibleOwner} onChange={(e) => setForm((s) => ({ ...s, responsibleOwner: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="ICT owner" value={form.ictOwner} onChange={(e) => setForm((s) => ({ ...s, ictOwner: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Approval authority" value={form.approvalAuthority} onChange={(e) => setForm((s) => ({ ...s, approvalAuthority: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Version" value={form.version} onChange={(e) => setForm((s) => ({ ...s, version: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Review frequency" value={form.reviewFrequency} onChange={(e) => setForm((s) => ({ ...s, reviewFrequency: e.target.value }))} /></Grid>
            <Grid item xs={12} md={4}><TextField select fullWidth label="Risk level" value={form.riskLevel} onChange={(e) => setForm((s) => ({ ...s, riskLevel: e.target.value as '' | RiskLevel }))}><MenuItem value="">Not set</MenuItem>{RISK_LEVELS.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={3}><TextField type="date" fullWidth InputLabelProps={{ shrink: true }} label="Last review" value={form.lastReviewDate} onChange={(e) => setForm((s) => ({ ...s, lastReviewDate: e.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField type="date" fullWidth InputLabelProps={{ shrink: true }} label="Next review" value={form.nextReviewDue} onChange={(e) => setForm((s) => ({ ...s, nextReviewDue: e.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField type="date" fullWidth InputLabelProps={{ shrink: true }} label="Approval date" value={form.approvalDate} onChange={(e) => setForm((s) => ({ ...s, approvalDate: e.target.value }))} /></Grid>
            <Grid item xs={12} md={3}><TextField type="date" fullWidth InputLabelProps={{ shrink: true }} label="Effective date" value={form.effectiveDate} onChange={(e) => setForm((s) => ({ ...s, effectiveDate: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Document URL" value={form.documentUrl} onChange={(e) => setForm((s) => ({ ...s, documentUrl: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Notes" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void savePolicy()} disabled={formSaving}>{formSaving ? 'Saving...' : editing ? 'Save changes' : 'Create policy'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={categoryOpen} onClose={() => setCategoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add category</DialogTitle>
        <DialogContent>
          <TextField sx={{ mt: 1 }} fullWidth required label="Category name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
          <TextField sx={{ mt: 2 }} fullWidth multiline minRows={3} label="Description" value={categoryDescription} onChange={(e) => setCategoryDescription(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void saveCategory()} disabled={categorySaving}>{categorySaving ? 'Saving...' : 'Save category'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!notice} autoHideDuration={3000} onClose={() => setNotice(null)}>
        <Alert severity="info" onClose={() => setNotice(null)} sx={{ width: '100%' }}>{notice}</Alert>
      </Snackbar>
    </Box>
  );
}
