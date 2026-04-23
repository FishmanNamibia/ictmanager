'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  People as PeopleIcon,
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
  updatedAt: string;
};

const PLANS = ['trial', 'basic', 'professional', 'enterprise'];
const STATUSES = ['trial', 'active', 'suspended', 'cancelled'];

const STATUS_COLOR: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  trial: 'info', active: 'success', suspended: 'warning', cancelled: 'error',
};

const PLAN_COLOR: Record<string, string> = {
  trial: '#757575', basic: '#1976d2', professional: '#7b1fa2', enterprise: '#c9a227',
};

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    plan: 'trial',
    subscriptionStatus: 'trial',
    subscriptionExpiresAt: '',
    maxUsers: '',
    billingEmail: '',
    contactName: '',
    notes: '',
    active: true,
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api<TenantSummary>(`/owner/tenants/${id}`)
      .then((t) => {
        setTenant(t);
        setForm({
          name: t.name,
          plan: t.plan,
          subscriptionStatus: t.subscriptionStatus,
          subscriptionExpiresAt: t.subscriptionExpiresAt ? t.subscriptionExpiresAt.slice(0, 10) : '',
          maxUsers: t.maxUsers != null ? String(t.maxUsers) : '',
          billingEmail: t.billingEmail ?? '',
          contactName: t.contactName ?? '',
          notes: t.notes ?? '',
          active: t.active,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaveError(null);
    setNotice(null);
    setSaving(true);
    try {
      const updated = await api<TenantSummary>(`/owner/tenants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name.trim(),
          plan: form.plan,
          subscriptionStatus: form.subscriptionStatus,
          subscriptionExpiresAt: form.subscriptionExpiresAt || null,
          maxUsers: form.maxUsers ? parseInt(form.maxUsers, 10) : null,
          billingEmail: form.billingEmail.trim(),
          contactName: form.contactName.trim() || null,
          notes: form.notes.trim() || null,
          active: form.active,
        }),
      });
      setTenant(updated);
      setNotice('Tenant updated successfully.');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !tenant) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error ?? 'Tenant not found'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => router.push('/owner')} sx={{ mt: 2 }}>
          Back to tenants
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => router.push('/owner/subscriptions')}
        sx={{ mb: 2 }}
      >
        Back to Subscriptions
      </Button>

      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>{tenant.name}</Typography>
            <Box display="flex" gap={1} mt={0.5} flexWrap="wrap" alignItems="center">
              <Chip label={tenant.slug} size="small" variant="outlined" />
              <Chip
                label={tenant.plan}
                size="small"
                sx={{ bgcolor: PLAN_COLOR[tenant.plan] ?? '#757575', color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}
              />
              <Chip
                label={tenant.subscriptionStatus}
                size="small"
                color={STATUS_COLOR[tenant.subscriptionStatus] ?? 'default'}
              />
              {!tenant.active && <Chip label="Inactive" size="small" color="default" />}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Created {fmtDate(tenant.createdAt)} · Updated {fmtDate(tenant.updatedAt)}
            </Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <Box sx={{ px: 2, py: 1, bgcolor: '#fff', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={600}>
                {tenant.userCount}{tenant.maxUsers ? ` / ${tenant.maxUsers}` : ''} users
              </Typography>
            </Box>
          </Box>
        </Box>

        {notice && <Alert severity="success" sx={{ mb: 2 }} icon={<CheckIcon />} onClose={() => setNotice(null)}>{notice}</Alert>}
        {saveError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>{saveError}</Alert>}

        <Grid container spacing={2}>
          {/* Subscription */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Subscription</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select label="Plan" fullWidth size="small"
                      value={form.plan}
                      onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    >
                      {PLANS.map((p) => (
                        <MenuItem key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select label="Status" fullWidth size="small"
                      value={form.subscriptionStatus}
                      onChange={(e) => setForm({ ...form, subscriptionStatus: e.target.value })}
                    >
                      {STATUSES.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Expires On" type="date" fullWidth size="small"
                      value={form.subscriptionExpiresAt}
                      onChange={(e) => setForm({ ...form, subscriptionExpiresAt: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      helperText="Leave blank for no expiry"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Max Users" type="number" fullWidth size="small"
                      value={form.maxUsers}
                      onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
                      helperText="Leave blank for unlimited"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      select label="Account Active" fullWidth size="small"
                      value={form.active ? 'true' : 'false'}
                      onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}
                    >
                      <MenuItem value="true">Active</MenuItem>
                      <MenuItem value="false">Disabled</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Organisation details */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Organisation Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Organisation Name" fullWidth size="small"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Billing Email" type="email" fullWidth size="small"
                      value={form.billingEmail}
                      onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Contact Name" fullWidth size="small"
                      value={form.contactName}
                      onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Notes" fullWidth size="small" multiline minRows={3}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
          <Button variant="outlined" onClick={() => router.push('/owner/subscriptions')}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void handleSave()}
            disabled={saving}
            sx={{ bgcolor: '#0d2137', '&:hover': { bgcolor: '#1a3a5c' } }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
