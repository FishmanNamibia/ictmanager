'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Chip, Skeleton, IconButton, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  LinearProgress, Tooltip, Collapse,
} from '@mui/material';
import { api } from '@/lib/api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AppsIcon from '@mui/icons-material/Apps';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SecurityIcon from '@mui/icons-material/Security';
import StorageIcon from '@mui/icons-material/Storage';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ApplicationFormDialog, { AppFormData } from '@/components/ApplicationFormDialog';

// ── Types ─────────────────────────────────────────────────────────────────

type AppRecord = {
  id: string; name: string; acronym: string | null; description: string | null;
  category: string | null; appType: string | null; status: string;
  goLiveDate: string | null; version: string | null;
  businessOwner: string | null; systemOwner: string | null; ictOwner: string | null;
  supportTeam: string | null; vendorName: string | null; supportModel: string | null;
  criticality: string; tier: string | null; dataSensitivity: string | null;
  availabilityRequirement: string | null; rto: string | null; rpo: string | null;
  hostingType: string; environments: string | null; dataCenter: string | null;
  databaseType: string | null; domainUrl: string | null;
  integrations: string | null; dependencies: string | null;
  authMethod: string | null; accessControl: string | null;
  auditLogging: boolean; encryptionAtRest: boolean; encryptionInTransit: boolean;
  complianceTags: string | null; lastSecurityReview: string | null;
  vulnerabilityStatus: string | null;
  lifecycleStage: string | null; endOfSupportDate: string | null;
  plannedUpgradeDate: string | null; plannedReplacement: string | null;
  annualMaintenanceCost: number | null; contractEndDate: string | null;
  procurementRef: string | null; vendorSlaLevel: string | null;
  healthStatus: string; uptimePercent: number | null;
  openIncidents: number; openSecurityIssues: number;
  backupSuccessRate: number | null; lastReviewDate: string | null;
  notes: string | null;
  // computed
  healthScore: number; healthLabel: string;
  daysToContractExpiry: number | null; daysToEndOfSupport: number | null;
  contractExpiringSoon: boolean; endOfSupportSoon: boolean;
};

type Stats = {
  total: number; live: number; deprecated: number; retired: number;
  byCriticality: Record<string, number>; byStatus: Record<string, number>;
  byHealth: Record<string, number>; tier1Count: number;
  contractsExpiringSoon: number; endOfSupportSoon: number;
  criticalHealth: number; totalAnnualCost: number;
};

// ── Config maps ────────────────────────────────────────────────────────────

const HEALTH_CONFIG: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default'; icon: React.ReactNode }> = {
  healthy:          { label: '🟢 Healthy',          color: 'success', icon: <CheckCircleIcon fontSize="inherit" /> },
  needs_attention:  { label: '🟠 Needs Attention',  color: 'warning', icon: <WarningAmberIcon fontSize="inherit" /> },
  critical:         { label: '🔴 Critical',          color: 'error',   icon: <SecurityIcon fontSize="inherit" /> },
  unknown:          { label: '⚫ Unknown',           color: 'default', icon: null },
};

const CRIT_COLOR: Record<string, 'error' | 'warning' | 'default'> = {
  critical: 'error', high: 'warning', medium: 'default', low: 'default',
};

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  live: 'success', proposed: 'info', in_development: 'warning',
  deprecated: 'error', retired: 'default',
};

function fmt(n: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', maximumFractionDigits: 0 }).format(n);
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: React.ReactNode;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={700} color={color ?? 'text.primary'} lineHeight={1.1} sx={{ mt: 0.5 }}>
              {value}
            </Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
          {icon && <Box sx={{ color: color ?? 'text.secondary', opacity: 0.6, fontSize: 34 }}>{icon}</Box>}
        </Box>
      </CardContent>
    </Card>
  );
}

// ── App to form ───────────────────────────────────────────────────────────

function appToForm(a: AppRecord): Partial<AppFormData> {
  return {
    name: a.name, acronym: a.acronym ?? '', description: a.description ?? '',
    category: a.category ?? '', appType: a.appType ?? '', status: a.status,
    goLiveDate: a.goLiveDate?.slice(0, 10) ?? '', version: a.version ?? '',
    businessOwner: a.businessOwner ?? '', systemOwner: a.systemOwner ?? '',
    ictOwner: a.ictOwner ?? '', supportTeam: a.supportTeam ?? '',
    vendorName: a.vendorName ?? '', supportModel: a.supportModel ?? '',
    criticality: a.criticality, tier: a.tier ?? '',
    dataSensitivity: a.dataSensitivity ?? 'internal',
    availabilityRequirement: a.availabilityRequirement ?? '',
    rto: a.rto ?? '', rpo: a.rpo ?? '',
    hostingType: a.hostingType, environments: a.environments ?? '',
    dataCenter: a.dataCenter ?? '', databaseType: a.databaseType ?? '',
    domainUrl: a.domainUrl ?? '', integrations: a.integrations ?? '',
    dependencies: a.dependencies ?? '',
    authMethod: a.authMethod ?? '', accessControl: a.accessControl ?? 'rbac',
    auditLogging: a.auditLogging, auditRetentionDays: '',
    encryptionAtRest: a.encryptionAtRest, encryptionInTransit: a.encryptionInTransit,
    complianceTags: a.complianceTags ?? '',
    lastSecurityReview: a.lastSecurityReview?.slice(0, 10) ?? '',
    vulnerabilityStatus: a.vulnerabilityStatus ?? 'unknown',
    lifecycleStage: a.lifecycleStage ?? '',
    endOfSupportDate: a.endOfSupportDate?.slice(0, 10) ?? '',
    plannedUpgradeDate: a.plannedUpgradeDate?.slice(0, 10) ?? '',
    plannedReplacement: a.plannedReplacement ?? '',
    annualMaintenanceCost: a.annualMaintenanceCost != null ? String(a.annualMaintenanceCost) : '',
    contractStartDate: '', contractEndDate: a.contractEndDate?.slice(0, 10) ?? '',
    procurementRef: a.procurementRef ?? '', vendorSlaLevel: a.vendorSlaLevel ?? '',
    healthStatus: a.healthStatus,
    uptimePercent: a.uptimePercent != null ? String(a.uptimePercent) : '',
    openIncidents: String(a.openIncidents), openSecurityIssues: String(a.openSecurityIssues),
    backupSuccessRate: a.backupSuccessRate != null ? String(a.backupSuccessRate) : '',
    lastReviewDate: a.lastReviewDate?.slice(0, 10) ?? '',
    notes: a.notes ?? '',
  };
}

function formToPayload(d: AppFormData): Record<string, unknown> {
  return {
    name: d.name.trim(), acronym: d.acronym.trim() || undefined,
    description: d.description.trim() || undefined,
    category: d.category || undefined, appType: d.appType || undefined,
    status: d.status, goLiveDate: d.goLiveDate || undefined, version: d.version.trim() || undefined,
    businessOwner: d.businessOwner.trim() || undefined, systemOwner: d.systemOwner.trim() || undefined,
    ictOwner: d.ictOwner.trim() || undefined, supportTeam: d.supportTeam.trim() || undefined,
    vendorName: d.vendorName.trim() || undefined, supportModel: d.supportModel || undefined,
    criticality: d.criticality, tier: d.tier || undefined,
    dataSensitivity: d.dataSensitivity || undefined,
    availabilityRequirement: d.availabilityRequirement.trim() || undefined,
    rto: d.rto.trim() || undefined, rpo: d.rpo.trim() || undefined,
    hostingType: d.hostingType, environments: d.environments.trim() || undefined,
    dataCenter: d.dataCenter.trim() || undefined, databaseType: d.databaseType.trim() || undefined,
    domainUrl: d.domainUrl.trim() || undefined, integrations: d.integrations.trim() || undefined,
    dependencies: d.dependencies.trim() || undefined,
    authMethod: d.authMethod || undefined, accessControl: d.accessControl || undefined,
    auditLogging: d.auditLogging,
    auditRetentionDays: d.auditRetentionDays ? parseInt(d.auditRetentionDays) : undefined,
    encryptionAtRest: d.encryptionAtRest, encryptionInTransit: d.encryptionInTransit,
    complianceTags: d.complianceTags.trim() || undefined,
    lastSecurityReview: d.lastSecurityReview || undefined,
    vulnerabilityStatus: d.vulnerabilityStatus || undefined,
    lifecycleStage: d.lifecycleStage || undefined,
    endOfSupportDate: d.endOfSupportDate || undefined,
    plannedUpgradeDate: d.plannedUpgradeDate || undefined,
    plannedReplacement: d.plannedReplacement.trim() || undefined,
    annualMaintenanceCost: d.annualMaintenanceCost ? parseFloat(d.annualMaintenanceCost) : undefined,
    contractStartDate: d.contractStartDate || undefined,
    contractEndDate: d.contractEndDate || undefined,
    procurementRef: d.procurementRef.trim() || undefined, vendorSlaLevel: d.vendorSlaLevel || undefined,
    uptimePercent: d.uptimePercent ? parseFloat(d.uptimePercent) : undefined,
    openIncidents: parseInt(d.openIncidents) || 0,
    openSecurityIssues: parseInt(d.openSecurityIssues) || 0,
    backupSuccessRate: d.backupSuccessRate ? parseFloat(d.backupSuccessRate) : undefined,
    lastReviewDate: d.lastReviewDate || undefined,
    notes: d.notes.trim() || undefined,
  };
}

// ── Detail panel ──────────────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <Box display="flex" gap={1} mb={0.5}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 160 }}>{label}</Typography>
      <Typography variant="caption">{value}</Typography>
    </Box>
  );
}

function AppDetailPanel({ app }: { app: AppRecord }) {
  const hc = HEALTH_CONFIG[app.healthLabel] ?? HEALTH_CONFIG.unknown;
  return (
    <Box sx={{ px: 4, py: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Typography variant="overline" fontWeight={700}>Ownership</Typography>
          <DetailRow label="Business Owner" value={app.businessOwner} />
          <DetailRow label="System Owner" value={app.systemOwner} />
          <DetailRow label="ICT Owner" value={app.ictOwner} />
          <DetailRow label="Support Team" value={app.supportTeam} />
          <DetailRow label="Support Model" value={app.supportModel} />
          <DetailRow label="Vendor" value={app.vendorName} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="overline" fontWeight={700}>Infrastructure</Typography>
          <DetailRow label="Hosting" value={app.hostingType?.replace('_', '-')} />
          <DetailRow label="Data Centre" value={app.dataCenter} />
          <DetailRow label="Database" value={app.databaseType} />
          <DetailRow label="Environments" value={app.environments} />
          <DetailRow label="URL / Domain" value={app.domainUrl} />
          <DetailRow label="Integrations" value={app.integrations} />
          <DetailRow label="Dependencies" value={app.dependencies} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="overline" fontWeight={700}>Health &amp; Security</Typography>
          <DetailRow label="Health Score" value={
            <Box display="flex" alignItems="center" gap={1}>
              <Chip label={`${app.healthScore}/100 – ${hc.label}`} size="small" color={hc.color} />
            </Box>
          } />
          <DetailRow label="Uptime (30d)" value={app.uptimePercent != null ? `${app.uptimePercent}%` : '—'} />
          <DetailRow label="Open Incidents" value={String(app.openIncidents)} />
          <DetailRow label="Security Issues" value={String(app.openSecurityIssues)} />
          <DetailRow label="Backup Success" value={app.backupSuccessRate != null ? `${app.backupSuccessRate}%` : '—'} />
          <DetailRow label="Auth Method" value={app.authMethod} />
          <DetailRow label="Encryption" value={[app.encryptionAtRest ? 'At Rest' : null, app.encryptionInTransit ? 'In Transit' : null].filter(Boolean).join(', ') || '—'} />
          <DetailRow label="Vuln Status" value={app.vulnerabilityStatus} />
          <DetailRow label="Compliance Tags" value={app.complianceTags} />
          <DetailRow label="RTO / RPO" value={app.rto || app.rpo ? `${app.rto ?? '—'} / ${app.rpo ?? '—'}` : null} />
          <DetailRow label="Contract Expiry" value={app.contractEndDate ? new Date(app.contractEndDate).toLocaleDateString() : null} />
          <DetailRow label="Annual Cost" value={fmt(app.annualMaintenanceCost)} />
        </Grid>
      </Grid>
    </Box>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const [list, setList] = useState<AppRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [critFilter, setCritFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hostingFilter, setHostingFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (critFilter)    p.set('criticality', critFilter);
    if (statusFilter)  p.set('status', statusFilter);
    if (hostingFilter) p.set('hostingType', hostingFilter);
    if (healthFilter)  p.set('healthLabel', healthFilter);
    if (search)        p.set('search', search);
    return p.toString();
  }, [critFilter, statusFilter, hostingFilter, healthFilter, search]);

  const fetchList = useCallback(() => {
    setLoading(true);
    api<AppRecord[]>(`/applications?${buildQuery()}`)
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [buildQuery]);

  const fetchStats = useCallback(() => {
    api<Stats>('/applications/stats').then(setStats).catch(() => null);
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleAdd = () => { setEditing(null); setFormOpen(true); };
  const handleEdit = (a: AppRecord) => { setEditing(a); setFormOpen(true); };

  const handleFormSubmit = async (data: AppFormData) => {
    const payload = formToPayload(data);
    if (editing) {
      await api(`/applications/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/applications', { method: 'POST', body: JSON.stringify(payload) });
    }
    fetchList(); fetchStats();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await api(`/applications/${deleteId}`, { method: 'DELETE' }); fetchList(); fetchStats(); setDeleteId(null); }
    finally { setDeleting(false); }
  };

  const toDelete = deleteId ? list.find((a) => a.id === deleteId) : null;
  const clearFilters = () => { setCritFilter(''); setStatusFilter(''); setHostingFilter(''); setHealthFilter(''); setSearch(''); setSearchInput(''); };

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      {/* ── Header ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Application &amp; Systems Portfolio</Typography>
          <Typography variant="body2" color="text.secondary">
            Ownership · Health · Security · Lifecycle · Compliance
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>Register Application</Button>
      </Box>

      {/* ── Stat Cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Total Systems" value={stats?.total ?? '…'} sub={`${stats?.live ?? 0} live`}
            icon={<AppsIcon fontSize="inherit" />} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Tier 1 (Mission Critical)" value={stats?.tier1Count ?? '…'}
            color={(stats?.tier1Count ?? 0) > 0 ? 'error.main' : undefined}
            sub="Highest availability required" icon={<StorageIcon fontSize="inherit" />} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Critical Health" value={stats?.criticalHealth ?? '…'}
            color={(stats?.criticalHealth ?? 0) > 0 ? 'error.main' : undefined}
            sub="Score < 50 – needs urgent action" icon={<SecurityIcon fontSize="inherit" />} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="End-of-Support ≤180d" value={stats?.endOfSupportSoon ?? '…'}
            color={(stats?.endOfSupportSoon ?? 0) > 0 ? 'warning.main' : undefined}
            sub="Plan upgrade/migration" icon={<WarningAmberIcon fontSize="inherit" />} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Contracts Expiring ≤90d" value={stats?.contractsExpiringSoon ?? '…'}
            color={(stats?.contractsExpiringSoon ?? 0) > 0 ? 'warning.main' : undefined}
            sub="Renewal action needed" icon={<EventNoteIcon fontSize="inherit" />} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Annual IT Cost" value={fmt(stats?.totalAnnualCost ?? null)}
            sub="Maintenance & contracts" />
        </Grid>
      </Grid>

      {/* ── Filters ── */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        <TextField size="small" label="Search name / category / owner"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput); }}
          onBlur={() => setSearch(searchInput)}
          sx={{ minWidth: 240 }} />
        <TextField select size="small" label="Criticality" value={critFilter}
          onChange={(e) => setCritFilter(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All criticalities</MenuItem>
          {['critical','high','medium','low'].map((v) => <MenuItem key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Status" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All statuses</MenuItem>
          {['proposed','in_development','live','deprecated','retired'].map((v) => <MenuItem key={v} value={v}>{v.replace('_',' ')}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Hosting" value={hostingFilter}
          onChange={(e) => setHostingFilter(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All hosting</MenuItem>
          {['on_prem','cloud','vendor','hybrid'].map((v) => <MenuItem key={v} value={v}>{v.replace('_','-')}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Health" value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All health</MenuItem>
          {['healthy','needs_attention','critical','unknown'].map((v) => <MenuItem key={v} value={v}>{v.replace('_',' ')}</MenuItem>)}
        </TextField>
        {(critFilter||statusFilter||hostingFilter||healthFilter||search) && (
          <Button size="small" onClick={clearFilters}>Clear</Button>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {list.length} system{list.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* ── Table ── */}
      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {loading ? (
            <Box sx={{ p: 2 }}><Skeleton variant="rectangular" height={300} /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'grey.50' } }}>
                    <TableCell width={28} />
                    <TableCell>System</TableCell>
                    <TableCell>Category / Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Criticality</TableCell>
                    <TableCell>Tier</TableCell>
                    <TableCell>Health Score</TableCell>
                    <TableCell>Hosting</TableCell>
                    <TableCell>Data Sensitivity</TableCell>
                    <TableCell>Business Owner</TableCell>
                    <TableCell>ICT Owner</TableCell>
                    <TableCell>End of Support</TableCell>
                    <TableCell>Contract Expiry</TableCell>
                    <TableCell>Annual Cost</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={15} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No applications registered yet. Click &quot;Register Application&quot; to start.
                      </TableCell>
                    </TableRow>
                  ) : (
                    list.map((a) => {
                      const hc = HEALTH_CONFIG[a.healthLabel] ?? HEALTH_CONFIG.unknown;
                      const isExpanded = expandedId === a.id;
                      const eosWarning = a.daysToEndOfSupport != null && a.daysToEndOfSupport >= 0 && a.daysToEndOfSupport <= 180;
                      const contractWarn = a.contractExpiringSoon;
                      return (
                        <>
                          <TableRow key={a.id} hover
                            sx={{ '& td': { fontSize: '0.78rem' }, cursor: 'pointer',
                              bgcolor: a.healthLabel === 'critical' ? 'error.50' : a.endOfSupportSoon ? 'warning.50' : undefined }}>
                            <TableCell>
                              <IconButton size="small" onClick={() => setExpandedId(isExpanded ? null : a.id)}>
                                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                              </IconButton>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {a.name}
                              {a.acronym && <Typography variant="caption" color="text.secondary" display="block">{a.acronym}</Typography>}
                              {a.domainUrl && <Typography variant="caption" color="primary" display="block"
                                component="a" href={a.domainUrl} target="_blank" onClick={(e) => e.stopPropagation()}>
                                {a.domainUrl.replace(/^https?:\/\//, '')}
                              </Typography>}
                            </TableCell>
                            <TableCell>
                              {a.category && <Typography variant="caption" display="block" fontWeight={600}>{a.category}</Typography>}
                              {a.appType && <Chip label={a.appType.replace('_', ' ')} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />}
                            </TableCell>
                            <TableCell>
                              <Chip label={a.status.replace('_', ' ')} size="small"
                                color={STATUS_COLOR[a.status] ?? 'default'} />
                            </TableCell>
                            <TableCell>
                              <Chip label={a.criticality} size="small" color={CRIT_COLOR[a.criticality] ?? 'default'} />
                            </TableCell>
                            <TableCell>
                              {a.tier
                                ? <Chip label={a.tier.toUpperCase().replace('TIER', 'T')} size="small"
                                    color={a.tier === 'tier1' ? 'error' : a.tier === 'tier2' ? 'warning' : 'default'} variant="outlined" />
                                : '—'}
                            </TableCell>
                            <TableCell sx={{ minWidth: 130 }}>
                              {a.healthLabel === 'unknown' ? (
                                <Chip label="⚫ Unknown" size="small" variant="outlined" />
                              ) : (
                                <Tooltip title={`Score: ${a.healthScore}/100`}>
                                  <Box>
                                    <Chip label={hc.label} size="small" color={hc.color} sx={{ mb: 0.25 }} />
                                    <LinearProgress variant="determinate" value={a.healthScore}
                                      color={hc.color === 'success' ? 'success' : hc.color === 'warning' ? 'warning' : 'error'}
                                      sx={{ height: 4, borderRadius: 2 }} />
                                  </Box>
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip label={a.hostingType.replace('_', '-')} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              {a.dataSensitivity
                                ? <Chip label={a.dataSensitivity} size="small"
                                    color={a.dataSensitivity === 'restricted' ? 'error' : a.dataSensitivity === 'confidential' ? 'warning' : 'default'}
                                    variant="outlined" />
                                : '—'}
                            </TableCell>
                            <TableCell>{a.businessOwner ?? '—'}</TableCell>
                            <TableCell>{a.ictOwner ?? '—'}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {a.endOfSupportDate ? (
                                <Chip
                                  label={eosWarning ? `${a.daysToEndOfSupport}d` : new Date(a.endOfSupportDate).toLocaleDateString()}
                                  size="small"
                                  color={eosWarning ? 'error' : 'default'}
                                  variant={eosWarning ? 'filled' : 'outlined'}
                                />
                              ) : '—'}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {a.contractEndDate ? (
                                <Chip
                                  label={contractWarn ? `${a.daysToContractExpiry}d` : new Date(a.contractEndDate).toLocaleDateString()}
                                  size="small"
                                  color={contractWarn ? 'warning' : 'default'}
                                  variant={contractWarn ? 'filled' : 'outlined'}
                                />
                              ) : '—'}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt(a.annualMaintenanceCost)}</TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(a); }} title="Edit">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteId(a.id); }} title="Delete">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          {/* Expandable detail panel */}
                          <TableRow key={`${a.id}-detail`}>
                            <TableCell colSpan={15} sx={{ p: 0, border: isExpanded ? undefined : 'none' }}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <AppDetailPanel app={a} />
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Form Dialog ── */}
      <ApplicationFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleFormSubmit}
        initialValues={editing ? appToForm(editing) : null}
        title={editing ? `Edit — ${editing.name}` : 'Register New Application / System'}
        submitLabel={editing ? 'Save Changes' : 'Register'}
      />

      {/* ── Delete Dialog ── */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Archive / Remove Application</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toDelete
              ? `Remove "${toDelete.name}" from the portfolio? This cannot be undone.`
              : 'Remove this application?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
