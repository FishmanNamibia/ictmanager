'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
type RiskStatus = 'identified' | 'mitigating' | 'monitored' | 'resolved';

type RiskRecord = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  likelihood: RiskLevel;
  impact: RiskLevel;
  overallRisk: RiskLevel;
  status: RiskStatus;
  mitigation?: string | null;
  owner?: string | null;
  reviewDue?: string | null;
  updatedAt?: string;
};

type FormState = {
  title: string;
  description: string;
  category: string;
  likelihood: RiskLevel;
  impact: RiskLevel;
  overallRisk: RiskLevel;
  status: RiskStatus;
  mitigation: string;
  owner: string;
  reviewDue: string;
};

function toInputDate(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function toIsoDate(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function mapRiskToForm(risk: RiskRecord): FormState {
  return {
    title: risk.title ?? '',
    description: risk.description ?? '',
    category: risk.category ?? '',
    likelihood: risk.likelihood,
    impact: risk.impact,
    overallRisk: risk.overallRisk,
    status: risk.status,
    mitigation: risk.mitigation ?? '',
    owner: risk.owner ?? '',
    reviewDue: toInputDate(risk.reviewDue),
  };
}

export default function RiskDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const canManage = user?.role === 'ict_manager';

  const [risk, setRisk] = useState<RiskRecord | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api<RiskRecord>(`/cybersecurity/risks/${id}`)
      .then((data) => {
        if (!mounted) return;
        setRisk(data);
        setForm(mapRiskToForm(data));
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load risk');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const onSave = async () => {
    if (!form || !canManage || !form.title.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await api<RiskRecord>(`/cybersecurity/risks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          category: form.category.trim() || undefined,
          likelihood: form.likelihood,
          impact: form.impact,
          overallRisk: form.overallRisk,
          status: form.status,
          mitigation: form.mitigation.trim() || undefined,
          owner: form.owner.trim() || undefined,
          reviewDue: toIsoDate(form.reviewDue),
        }),
      });
      setRisk(updated);
      setForm(mapRiskToForm(updated));
      setNotice('Risk updated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update risk');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!canManage) return;
    const confirmed = window.confirm('Delete this risk? This action cannot be undone.');
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/cybersecurity/risks/${id}`, { method: 'DELETE' });
      router.push('/cybersecurity/risks');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete risk');
      setBusy(false);
    }
  };

  if (loading || !form) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Risk details
        </Typography>
        <Skeleton variant="rectangular" height={280} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Risk details
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                required
                fullWidth
                value={form.title}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Category"
                fullWidth
                value={form.category}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, category: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Owner"
                fullWidth
                value={form.owner}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, owner: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Likelihood"
                fullWidth
                value={form.likelihood}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, likelihood: e.target.value as RiskLevel } : prev))}
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
                label="Impact"
                fullWidth
                value={form.impact}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, impact: e.target.value as RiskLevel } : prev))}
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
                label="Overall risk"
                fullWidth
                value={form.overallRisk}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, overallRisk: e.target.value as RiskLevel } : prev))}
              >
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Status"
                fullWidth
                value={form.status}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, status: e.target.value as RiskStatus } : prev))}
              >
                <MenuItem value="identified">Identified</MenuItem>
                <MenuItem value="mitigating">Mitigating</MenuItem>
                <MenuItem value="monitored">Monitored</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Review due"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.reviewDue}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, reviewDue: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={3}
                value={form.description}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Mitigation"
                fullWidth
                multiline
                minRows={2}
                value={form.mitigation}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, mitigation: e.target.value } : prev))}
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="space-between" mt={3} gap={1} flexWrap="wrap">
            <Button variant="outlined" onClick={() => router.push('/cybersecurity/risks')} disabled={busy}>
              Back to risks
            </Button>
            <Box display="flex" gap={1}>
              {canManage && (
                <Button color="error" variant="outlined" onClick={() => void onDelete()} disabled={busy}>
                  Delete
                </Button>
              )}
              <Button
                variant="contained"
                onClick={() => void onSave()}
                disabled={!canManage || busy || !form.title.trim()}
              >
                Save changes
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {risk?.updatedAt && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Last updated: {new Date(risk.updatedAt).toLocaleString()}
        </Typography>
      )}
    </Box>
  );
}
