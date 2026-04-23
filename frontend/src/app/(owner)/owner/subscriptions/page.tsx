'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  NotificationsActive as ReminderIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { api } from '@/lib/api';

type TenantSummary = {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  plan: string;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  maxUsers: number | null;
  billingEmail: string | null;
  contactName: string | null;
  notes: string | null;
  userCount: number;
  createdAt: string;
};

type OwnerStats = {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  byPlan: Record<string, number>;
};

const PLANS = ['trial', 'basic', 'professional', 'enterprise'];

const STATUS_CHIP: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  trial: { label: 'Trial', color: 'info' },
  active: { label: 'Active', color: 'success' },
  suspended: { label: 'Suspended', color: 'warning' },
  cancelled: { label: 'Cancelled', color: 'error' },
};

const PLAN_COLOR: Record<string, string> = {
  trial: '#757575',
  basic: '#1976d2',
  professional: '#7b1fa2',
  enterprise: '#c9a227',
};

type NewTenantForm = {
  name: string;
  billingEmail: string;
  contactName: string;
  plan: string;
  maxUsers: string;
  notes: string;
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
};

const EMPTY_FORM: NewTenantForm = {
  name: '', billingEmail: '', contactName: '', plan: 'trial',
  maxUsers: '', notes: '', adminEmail: '', adminPassword: '', adminFullName: '',
};

export default function SubscriptionManagementPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'companies' | 'plans'>('companies');
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<NewTenantForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, s] = await Promise.all([
        api<TenantSummary[]>('/owner/tenants'),
        api<OwnerStats>('/owner/stats'),
      ]);
      setTenants(t);
      setStats(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = tenants.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'active') return t.subscriptionStatus === 'active';
    if (filter === 'trial') return t.subscriptionStatus === 'trial';
    if (filter === 'suspended') return t.subscriptionStatus === 'suspended';
    if (filter === 'cancelled') return t.subscriptionStatus === 'cancelled';
    return true;
  });

  const handleCreate = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      await api('/owner/tenants', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          maxUsers: form.maxUsers ? parseInt(form.maxUsers, 10) : undefined,
        }),
      });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h5" fontWeight={700}>Subscription Management</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ bgcolor: '#6C63FF', '&:hover': { bgcolor: '#5a52e0' } }}
          >
            Assign Subscription
          </Button>
          <Button variant="outlined" startIcon={<ScheduleIcon />} size="small">
            Send Upcoming Reminders
          </Button>
          <Button variant="outlined" startIcon={<ReminderIcon />} size="small">
            Send Overdue Reminders
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box display="flex" gap={1} mb={3}>
        <Chip
          label="Companies & Subscriptions"
          onClick={() => setTab('companies')}
          color={tab === 'companies' ? 'primary' : 'default'}
          variant={tab === 'companies' ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600 }}
        />
        <Chip
          label="Subscription Plans"
          onClick={() => setTab('plans')}
          color={tab === 'plans' ? 'primary' : 'default'}
          variant={tab === 'plans' ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {tab === 'companies' && (
        <>
          {/* Stats */}
          {stats && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { label: 'Total Companies', value: stats.totalTenants, color: '#1976d2' },
                { label: 'With Subscriptions', value: stats.activeTenants + stats.trialTenants, color: '#2e7d32' },
                { label: 'Active Subscriptions', value: stats.activeTenants, color: '#2e7d32' },
                { label: 'Trial Subscriptions', value: stats.trialTenants, color: '#0288d1' },
              ].map((s) => (
                <Grid item xs={6} sm={3} key={s.label}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: '12px !important' }}>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                      <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Filter */}
          <Box mb={2}>
            <TextField
              select size="small" value={filter}
              onChange={(e) => setFilter(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">All Companies</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="trial">Trial</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          </Box>

          {/* Companies Table */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ px: 2, pt: 2, pb: 1 }}>
                All Companies & Subscriptions
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Company</strong></TableCell>
                        <TableCell><strong>Plan</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Users</strong></TableCell>
                        <TableCell><strong>Contact</strong></TableCell>
                        <TableCell><strong>Expires</strong></TableCell>
                        <TableCell align="right"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary', fontStyle: 'italic' }}>
                            No companies found
                          </TableCell>
                        </TableRow>
                      ) : filtered.map((t) => {
                        const sc = STATUS_CHIP[t.subscriptionStatus] ?? { label: t.subscriptionStatus, color: 'default' };
                        return (
                          <TableRow key={t.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{t.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{t.slug}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={t.plan}
                                size="small"
                                sx={{ bgcolor: PLAN_COLOR[t.plan] ?? '#757575', color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip label={sc.label} size="small" color={sc.color} />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <PeopleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  {t.userCount}{t.maxUsers ? ` / ${t.maxUsers}` : ''}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{t.contactName ?? '—'}</Typography>
                              <Typography variant="caption" color="text.secondary">{t.billingEmail ?? ''}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{fmtDate(t.subscriptionExpiresAt)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => router.push(`/owner/tenants/${t.id}`)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Payment Reminders */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>Recent Payment Reminders</Typography>
              <Typography variant="body2" color="text.secondary" fontStyle="italic" textAlign="center" py={2}>
                No reminders sent yet
              </Typography>
            </CardContent>
          </Card>
        </>
      )}

      {tab === 'plans' && (
        <Grid container spacing={2}>
          {[
            { name: 'Trial', price: 'Free', duration: '14 days', features: ['Up to 5 users', 'Basic modules', 'Email support'], color: '#757575' },
            { name: 'Basic', price: 'N$500/mo', duration: 'Monthly', features: ['Up to 20 users', 'Core modules', 'Email & chat support'], color: '#1976d2' },
            { name: 'Professional', price: 'N$1,200/mo', duration: 'Monthly', features: ['Up to 100 users', 'All modules', 'Priority support', 'Custom branding'], color: '#7b1fa2' },
            { name: 'Enterprise', price: 'Custom', duration: 'Annual', features: ['Unlimited users', 'All modules + API', 'Dedicated account manager', 'SLA guarantee', 'Custom integrations'], color: '#c9a227' },
          ].map((plan) => (
            <Grid item xs={12} sm={6} md={3} key={plan.name}>
              <Card variant="outlined" sx={{ height: '100%', borderTop: `3px solid ${plan.color}` }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700}>{plan.name}</Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ color: plan.color, my: 1 }}>{plan.price}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>{plan.duration}</Typography>
                  {plan.features.map((f) => (
                    <Typography key={f} variant="body2" sx={{ py: 0.3 }}>• {f}</Typography>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Tenant Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Subscription — New Company</DialogTitle>
        <DialogContent dividers>
          {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Company Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Company Name *" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Plan *" fullWidth value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                {PLANS.map((p) => <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Billing Email *" type="email" fullWidth value={form.billingEmail} onChange={(e) => setForm({ ...form, billingEmail: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Name" fullWidth value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Max Users" type="number" fullWidth value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: e.target.value })} helperText="Leave blank for unlimited" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" fullWidth multiline minRows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mt: 1 }}>First Admin User</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Admin Full Name *" fullWidth value={form.adminFullName} onChange={(e) => setForm({ ...form, adminFullName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Admin Email *" type="email" fullWidth value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Admin Password *" type="password" fullWidth value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} helperText="Must be at least 8 characters" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void handleCreate()}
            disabled={saving || !form.name || !form.billingEmail || !form.adminEmail || !form.adminPassword || !form.adminFullName}
            sx={{ bgcolor: '#6C63FF', '&:hover': { bgcolor: '#5a52e0' } }}
          >
            {saving ? 'Creating…' : 'Create Company'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
