'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, Skeleton,
  IconButton, TextField, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
  LinearProgress, Tooltip,
} from '@mui/material';
import { api } from '@/lib/api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import SecurityIcon from '@mui/icons-material/Security';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import LicenseFormDialog, { LicenseFormData } from '@/components/LicenseFormDialog';

// ── Types ─────────────────────────────────────────────────────────────────

type LicenseStatus = 'active' | 'expiring_critical' | 'expiring_soon' | 'expired' | 'over_allocated' | 'under_utilised' | 'perpetual';

type License = {
  id: string;
  softwareName: string;
  softwareCategory: string | null;
  version: string | null;
  vendor: string | null;
  vendorName: string | null;
  licenseType: string;
  licenseKey: string | null;
  contractRef: string | null;
  procurementRef: string | null;
  purchaseDate: string | null;
  startDate: string | null;
  expiryDate: string | null;
  supportEndDate: string | null;
  totalSeats: number;
  usedSeats: number;
  costPerSeat: number | null;
  cost: number | null;
  currency: string | null;
  businessOwner: string | null;
  ictOwner: string | null;
  criticality: string | null;
  notes: string | null;
  // computed
  seatsAvailable: number;
  totalCost: number | null;
  daysRemaining: number | null;
  renewalQuarter: string | null;
  computedStatus: LicenseStatus;
};

type Stats = {
  total: number;
  active: number;
  expiringSoon: number;
  expiringCritical: number;
  expired: number;
  overAllocated: number;
  underUtilised: number;
  complianceScore: number;
  totalAnnualCost: number;
  totalSeats: number;
  totalUsedSeats: number;
  utilizationRate: number;
  expiringIn30: { softwareName: string; daysRemaining: number | null; vendor?: string | null; vendorName?: string | null }[];
  vendorSummary: { vendor: string; count: number; totalCost: number; expiringSoon: number }[];
};

// ── Helpers ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LicenseStatus, { label: string; color: 'success' | 'warning' | 'error' | 'default' | 'info'; icon: React.ReactNode }> = {
  active:             { label: 'Active',             color: 'success', icon: <CheckCircleIcon fontSize="inherit" /> },
  perpetual:          { label: 'Perpetual',           color: 'info',    icon: <CheckCircleIcon fontSize="inherit" /> },
  expiring_soon:      { label: 'Expiring (90d)',      color: 'warning', icon: <WarningAmberIcon fontSize="inherit" /> },
  expiring_critical:  { label: 'Expiring (30d)',      color: 'error',   icon: <ErrorIcon fontSize="inherit" /> },
  expired:            { label: 'Expired',             color: 'error',   icon: <ErrorIcon fontSize="inherit" /> },
  over_allocated:     { label: 'Over-allocated',      color: 'error',   icon: <ErrorIcon fontSize="inherit" /> },
  under_utilised:     { label: 'Under-utilised',      color: 'default', icon: <WarningAmberIcon fontSize="inherit" /> },
};

const CRITICALITY_COLOR: Record<string, 'error' | 'warning' | 'default'> = {
  high: 'error', medium: 'warning', low: 'default',
};

function fmtCost(amount: number | null, currency?: string | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-NA', { style: 'currency', currency: currency || 'NAD', maximumFractionDigits: 0 }).format(amount);
}

function licenseToForm(l: License): Partial<LicenseFormData> {
  return {
    softwareName: l.softwareName,
    softwareCategory: l.softwareCategory ?? '',
    version: l.version ?? '',
    vendor: l.vendor ?? l.vendorName ?? '',
    licenseType: l.licenseType,
    licenseKey: l.licenseKey ?? '',
    contractRef: l.contractRef ?? '',
    procurementRef: l.procurementRef ?? '',
    purchaseDate: l.purchaseDate ? l.purchaseDate.slice(0, 10) : '',
    startDate: l.startDate ? l.startDate.slice(0, 10) : '',
    expiryDate: l.expiryDate ? l.expiryDate.slice(0, 10) : '',
    supportEndDate: l.supportEndDate ? l.supportEndDate.slice(0, 10) : '',
    totalSeats: String(l.totalSeats),
    usedSeats: String(l.usedSeats),
    costPerSeat: l.costPerSeat != null ? String(l.costPerSeat) : l.cost != null ? String(l.cost) : '',
    currency: l.currency ?? 'NAD',
    businessOwner: l.businessOwner ?? '',
    ictOwner: l.ictOwner ?? '',
    criticality: l.criticality ?? 'medium',
    notes: l.notes ?? '',
  };
}

function formToPayload(d: LicenseFormData): Record<string, unknown> {
  return {
    softwareName: d.softwareName.trim(),
    softwareCategory: d.softwareCategory || undefined,
    version: d.version.trim() || undefined,
    vendor: d.vendor.trim() || undefined,
    vendorName: d.vendor.trim() || undefined,
    licenseType: d.licenseType,
    licenseKey: d.licenseKey.trim() || undefined,
    contractRef: d.contractRef.trim() || undefined,
    procurementRef: d.procurementRef.trim() || undefined,
    purchaseDate: d.purchaseDate || undefined,
    startDate: d.startDate || undefined,
    expiryDate: d.expiryDate || undefined,
    supportEndDate: d.supportEndDate || undefined,
    totalSeats: parseInt(d.totalSeats) || 1,
    usedSeats: parseInt(d.usedSeats) || 0,
    costPerSeat: d.costPerSeat ? parseFloat(d.costPerSeat) : undefined,
    currency: d.currency,
    businessOwner: d.businessOwner.trim() || undefined,
    ictOwner: d.ictOwner.trim() || undefined,
    criticality: d.criticality,
    notes: d.notes.trim() || undefined,
  };
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expiring_critical', label: 'Expiring in 30 days' },
  { value: 'expiring_soon', label: 'Expiring in 90 days' },
  { value: 'expired', label: 'Expired' },
  { value: 'over_allocated', label: 'Over-allocated' },
  { value: 'under_utilised', label: 'Under-utilised' },
  { value: 'perpetual', label: 'Perpetual' },
];

// ── Stat Card ─────────────────────────────────────────────────────────────

const pulseKeyframes = `
  @keyframes urgentPulse {
    0%   { box-shadow: 0 0 0 0 rgba(211,47,47,0.5); }
    50%  { box-shadow: 0 0 0 8px rgba(211,47,47,0); }
    100% { box-shadow: 0 0 0 0 rgba(211,47,47,0); }
  }
  @keyframes urgentBg {
    0%, 100% { background-color: #fff1f0; }
    50%       { background-color: #ffd6d6; }
  }
`;

function StatCard({
  label, value, sub, color, icon, urgent,
}: {
  label: string; value: string | number; sub?: string;
  color?: string; icon?: React.ReactNode; urgent?: boolean;
}) {
  return (
    <>
      {urgent && <style>{pulseKeyframes}</style>}
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          ...(urgent && {
            animation: 'urgentPulse 1.6s ease-in-out infinite, urgentBg 1.6s ease-in-out infinite',
            borderColor: 'error.main',
            borderWidth: 2,
          }),
        }}
      >
        <CardContent sx={{ pb: '12px !important' }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                {label}
              </Typography>
              <Typography variant="h4" fontWeight={700} color={color ?? 'text.primary'} lineHeight={1.1} sx={{ mt: 0.5 }}>
                {value}
              </Typography>
              {sub && <Typography variant="caption" color={urgent ? 'error.main' : 'text.secondary'} fontWeight={urgent ? 700 : 400}>{sub}</Typography>}
            </Box>
            {icon && (
              <Box sx={{
                color: color ?? 'text.secondary', opacity: 0.7, fontSize: 36,
                ...(urgent && { animation: 'urgentPulse 1.6s ease-in-out infinite' }),
              }}>
                {icon}
              </Box>
            )}
          </Box>
          {urgent && (
            <Box sx={{ mt: 1, px: 1, py: 0.4, bgcolor: 'error.main', borderRadius: 1, display: 'inline-block' }}>
              <Typography variant="caption" color="white" fontWeight={700} letterSpacing={1}>
                ⚠ URGENT – RENEW NOW
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function LicensesPage() {
  const [list, setList] = useState<License[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<License | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchList = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    api<License[]>(`/licenses?${params}`)
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  const fetchStats = useCallback(() => {
    setStatsLoading(true);
    api<Stats>('/licenses/stats')
      .then(setStats)
      .catch(() => null)
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleAdd = () => { setEditing(null); setFormOpen(true); };
  const handleEdit = (l: License) => { setEditing(l); setFormOpen(true); };

  const handleFormSubmit = async (data: LicenseFormData) => {
    const payload = formToPayload(data);
    if (editing) {
      await api(`/licenses/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/licenses', { method: 'POST', body: JSON.stringify(payload) });
    }
    fetchList();
    fetchStats();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteSubmitting(true);
    try {
      await api(`/licenses/${deleteId}`, { method: 'DELETE' });
      fetchList();
      fetchStats();
      setDeleteId(null);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const toDelete = deleteId ? list.find((l) => l.id === deleteId) : null;

  const complianceScore = stats?.complianceScore ?? 100;
  const scoreColor = complianceScore >= 80 ? 'success.main' : complianceScore >= 50 ? 'warning.main' : 'error.main';
  const urgentCount = stats?.expiringCritical ?? 0;   // ≤ 30 days (date-based, any status)

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      {/* ── Header ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Software License Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Compliance tracking · Seat allocation · Expiry alerts · Vendor spend
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>Add License</Button>
      </Box>

      {/* ── Summary Cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Total Licenses" value={statsLoading ? '…' : (stats?.total ?? 0)}
            sub={`${stats?.active ?? 0} active`} icon={<SecurityIcon fontSize="inherit" />} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Compliance Score" value={statsLoading ? '…' : `${complianceScore}%`}
            color={scoreColor} sub="Based on expiry & allocation" icon={<CheckCircleIcon fontSize="inherit" />} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            label="Expiring (30d)"
            value={statsLoading ? '…' : urgentCount}
            color={urgentCount > 0 ? 'error.main' : undefined}
            sub={urgentCount > 0 ? `${urgentCount} license${urgentCount > 1 ? 's' : ''} need immediate renewal` : 'No urgent renewals'}
            icon={<WarningAmberIcon fontSize="inherit" />}
            urgent={urgentCount > 0}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            label="Expiring (90d)"
            value={statsLoading ? '…' : (stats?.expiringSoon ?? 0)}
            color={(stats?.expiringSoon ?? 0) > 0 ? 'warning.main' : undefined}
            sub="Plan renewals now"
            icon={<EventIcon fontSize="inherit" />}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Over-Allocated" value={statsLoading ? '…' : (stats?.overAllocated ?? 0)}
            color={(stats?.overAllocated ?? 0) > 0 ? 'error.main' : undefined}
            sub="Seats assigned > purchased" icon={<GroupIcon fontSize="inherit" />} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Annual Cost" value={statsLoading ? '…' : fmtCost(stats?.totalAnnualCost ?? 0)}
            sub={`${stats?.utilizationRate ?? 0}% utilisation`} icon={<AttachMoneyIcon fontSize="inherit" />} />
        </Grid>
      </Grid>

      {/* ── Urgent Renewal Alert ── */}
      {urgentCount > 0 && stats && (
        <Box sx={{
          mb: 2, p: 2, borderRadius: 2,
          border: '2px solid', borderColor: 'error.main',
          bgcolor: '#fff1f0',
          animation: 'urgentBg 1.6s ease-in-out infinite',
          display: 'flex', alignItems: 'flex-start', gap: 2,
        }}>
          <Box sx={{ fontSize: 28, lineHeight: 1 }}>🔴</Box>
          <Box flex={1}>
            <Typography fontWeight={700} color="error.main" variant="subtitle1">
              URGENT: {urgentCount} license{urgentCount > 1 ? 's' : ''} expiring within 30 days
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5, mt: 0.5 }}>
              {(stats.expiringIn30 ?? []).map((l, i) => (
                <li key={i}>
                  <Typography variant="body2" color="error.dark" fontWeight={500}>
                    <strong>{l.softwareName}</strong>
                    {(l.vendor ?? l.vendorName) ? ` (${l.vendor ?? l.vendorName})` : ''}
                    {' — '}
                    {l.daysRemaining === 0 ? 'expires TODAY' : `expires in ${l.daysRemaining} day${l.daysRemaining !== 1 ? 's' : ''}`}
                  </Typography>
                </li>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Compliance Bar ── */}
      {stats && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent sx={{ pb: '12px !important' }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2" fontWeight={600}>Compliance Health</Typography>
              <Typography variant="subtitle2" color={scoreColor} fontWeight={700}>{complianceScore}% compliant</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={complianceScore}
              color={complianceScore >= 80 ? 'success' : complianceScore >= 50 ? 'warning' : 'error'}
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Box display="flex" gap={3} mt={1.5} flexWrap="wrap">
              {[
                { label: 'Active', val: stats.active, color: 'success.main' },
                { label: 'Expired', val: stats.expired, color: 'error.main' },
                { label: 'Expiring (30d)', val: stats.expiringCritical, color: 'error.light' },
                { label: 'Expiring (90d)', val: stats.expiringSoon - stats.expiringCritical, color: 'warning.main' },
                { label: 'Over-allocated', val: stats.overAllocated, color: 'error.main' },
                { label: 'Under-utilised', val: stats.underUtilised, color: 'text.secondary' },
              ].map(({ label, val, color }) => (
                <Box key={label} textAlign="center">
                  <Typography variant="h6" fontWeight={700} color={color}>{val}</Typography>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Filters ── */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        <TextField
          size="small"
          label="Search software / vendor"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput); }}
          onBlur={() => setSearch(searchInput)}
          sx={{ minWidth: 240 }}
        />
        <TextField
          select size="small" label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
        {(statusFilter !== 'all' || search) && (
          <Button size="small" onClick={() => { setStatusFilter('all'); setSearch(''); setSearchInput(''); }}>
            Clear filters
          </Button>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {list.length} license{list.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* ── License Table ── */}
      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {loading ? (
            <Box sx={{ p: 2 }}><Skeleton variant="rectangular" height={300} /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'grey.50' } }}>
                    <TableCell>Software</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Criticality</TableCell>
                    <TableCell align="center">Seats (Used/Total)</TableCell>
                    <TableCell align="center">Available</TableCell>
                    <TableCell>Expiry</TableCell>
                    <TableCell align="center">Days Left</TableCell>
                    <TableCell>Renewal Quarter</TableCell>
                    <TableCell>Cost / Seat</TableCell>
                    <TableCell>Total Cost</TableCell>
                    <TableCell>Business Owner</TableCell>
                    <TableCell>ICT Owner</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={15} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No licenses found. Click &quot;Add License&quot; to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    list.map((l) => {
                      const sc = STATUS_CONFIG[l.computedStatus] ?? STATUS_CONFIG.active;
                      const usedPct = l.totalSeats > 0 ? Math.round((l.usedSeats / l.totalSeats) * 100) : 0;
                      const currency = l.currency ?? 'NAD';
                      return (
                        <TableRow key={l.id} hover sx={{
                          '& td': { fontSize: '0.78rem' },
                          bgcolor: l.computedStatus === 'expired' ? 'error.50' : l.computedStatus === 'expiring_critical' ? 'warning.50' : undefined,
                        }}>
                          <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                            {l.softwareName}
                            {l.version && <Typography variant="caption" color="text.secondary" display="block">{l.version}</Typography>}
                            {l.softwareCategory && <Typography variant="caption" color="text.secondary" display="block">{l.softwareCategory}</Typography>}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{l.vendor ?? l.vendorName ?? '—'}</TableCell>
                          <TableCell>
                            <Chip label={l.licenseType.replace('_', ' ')} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={sc.label}
                              size="small"
                              color={sc.color}
                              icon={sc.icon as React.ReactElement}
                            />
                          </TableCell>
                          <TableCell>
                            {l.criticality
                              ? <Chip label={l.criticality.toUpperCase()} size="small"
                                  color={CRITICALITY_COLOR[l.criticality] ?? 'default'} variant="outlined" />
                              : '—'}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={`${usedPct}% utilised`}>
                              <Box>
                                <Typography variant="caption" fontWeight={700}
                                  color={l.usedSeats > l.totalSeats ? 'error.main' : undefined}>
                                  {l.usedSeats}/{l.totalSeats}
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(100, usedPct)}
                                  color={l.usedSeats > l.totalSeats ? 'error' : usedPct > 85 ? 'warning' : 'primary'}
                                  sx={{ height: 4, borderRadius: 2, mt: 0.25 }}
                                />
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="caption" color={l.seatsAvailable < 0 ? 'error.main' : l.seatsAvailable === 0 ? 'warning.main' : 'success.main'} fontWeight={700}>
                              {l.seatsAvailable}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {l.expiryDate ? new Date(l.expiryDate).toLocaleDateString() : <em style={{ color: '#999' }}>No expiry</em>}
                          </TableCell>
                          <TableCell align="center">
                            {l.daysRemaining == null ? '—' : (
                              <Chip
                                label={l.daysRemaining < 0 ? 'Expired' : `${l.daysRemaining}d`}
                                size="small"
                                color={l.daysRemaining < 0 ? 'error' : l.daysRemaining <= 30 ? 'error' : l.daysRemaining <= 90 ? 'warning' : 'default'}
                                variant={l.daysRemaining <= 30 ? 'filled' : 'outlined'}
                              />
                            )}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{l.renewalQuarter ?? '—'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtCost(l.costPerSeat ?? l.cost, currency)}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{fmtCost(l.totalCost, currency)}</TableCell>
                          <TableCell>{l.businessOwner ?? '—'}</TableCell>
                          <TableCell>{l.ictOwner ?? '—'}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <IconButton size="small" onClick={() => handleEdit(l)} title="Edit">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => setDeleteId(l.id)} title="Delete">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Vendor Summary ── */}
      {stats && stats.vendorSummary.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={1}>Vendor Summary</Typography>
          <Grid container spacing={2}>
            {stats.vendorSummary.slice(0, 6).map((v) => (
              <Grid item xs={12} sm={6} md={4} key={v.vendor}>
                <Card variant="outlined">
                  <CardContent sx={{ pb: '12px !important' }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontWeight={600}>{v.vendor}</Typography>
                      <Chip label={`${v.count} license${v.count !== 1 ? 's' : ''}`} size="small" />
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                      {fmtCost(v.totalCost)}
                    </Typography>
                    {v.expiringSoon > 0 && (
                      <Chip label={`${v.expiringSoon} expiring soon`} size="small" color="warning" sx={{ mt: 0.5 }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* ── Form Dialog ── */}
      <LicenseFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleFormSubmit}
        initialValues={editing ? licenseToForm(editing) : null}
        title={editing ? 'Edit License' : 'Add License'}
        submitLabel={editing ? 'Save' : 'Add License'}
      />

      {/* ── Delete Dialog ── */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete License</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toDelete
              ? `Delete "${toDelete.softwareName}"? This action cannot be undone.`
              : 'Delete this license?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteSubmitting}>
            {deleteSubmitting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
