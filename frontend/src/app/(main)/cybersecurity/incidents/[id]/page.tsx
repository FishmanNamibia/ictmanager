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

type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type IncidentStatus = 'reported' | 'investigating' | 'contained' | 'resolved' | 'closed';

type IncidentRecord = {
  id: string;
  title: string;
  description?: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedBy?: string | null;
  dateDetected?: string | null;
  dateReported?: string | null;
  dateContained?: string | null;
  dateResolved?: string | null;
  rootCause?: string | null;
  remediation?: string | null;
  affectedSystems?: string[] | null;
  affectedUsersCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type FormState = {
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedBy: string;
  dateDetected: string;
  dateReported: string;
  dateContained: string;
  dateResolved: string;
  affectedSystems: string;
  affectedUsersCount: string;
  rootCause: string;
  remediation: string;
};

function toInputDateTime(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 16);
}

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function mapIncidentToForm(incident: IncidentRecord): FormState {
  return {
    title: incident.title ?? '',
    description: incident.description ?? '',
    severity: incident.severity,
    status: incident.status,
    reportedBy: incident.reportedBy ?? '',
    dateDetected: toInputDateTime(incident.dateDetected),
    dateReported: toInputDateTime(incident.dateReported),
    dateContained: toInputDateTime(incident.dateContained),
    dateResolved: toInputDateTime(incident.dateResolved),
    affectedSystems: (incident.affectedSystems ?? []).join(', '),
    affectedUsersCount: String(incident.affectedUsersCount ?? 0),
    rootCause: incident.rootCause ?? '',
    remediation: incident.remediation ?? '',
  };
}

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const canManage = user?.role === 'ict_manager' || user?.role === 'executive';
  const canDelete = user?.role === 'ict_manager';

  const [incident, setIncident] = useState<IncidentRecord | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api<IncidentRecord>(`/cybersecurity/incidents/${id}`)
      .then((data) => {
        if (!mounted) return;
        setIncident(data);
        setForm(mapIncidentToForm(data));
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load incident');
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
      const updated = await api<IncidentRecord>(`/cybersecurity/incidents/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          severity: form.severity,
          status: form.status,
          reportedBy: form.reportedBy.trim() || undefined,
          dateDetected: toIsoDateTime(form.dateDetected),
          dateReported: toIsoDateTime(form.dateReported),
          dateContained: toIsoDateTime(form.dateContained),
          dateResolved: toIsoDateTime(form.dateResolved),
          affectedSystems: form.affectedSystems
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          affectedUsersCount: Number(form.affectedUsersCount) || 0,
          rootCause: form.rootCause.trim() || undefined,
          remediation: form.remediation.trim() || undefined,
        }),
      });
      setIncident(updated);
      setForm(mapIncidentToForm(updated));
      setNotice('Incident updated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update incident');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!canDelete) return;
    const confirmed = window.confirm('Delete this incident? This action cannot be undone.');
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/cybersecurity/incidents/${id}`, { method: 'DELETE' });
      router.push('/cybersecurity/incidents');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete incident');
      setBusy(false);
    }
  };

  if (loading || !form) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Incident details
        </Typography>
        <Skeleton variant="rectangular" height={320} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Incident details
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
                fullWidth
                required
                value={form.title}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Severity"
                fullWidth
                value={form.severity}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, severity: e.target.value as IncidentSeverity } : prev))}
              >
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="info">Info</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Status"
                fullWidth
                value={form.status}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, status: e.target.value as IncidentStatus } : prev))}
              >
                <MenuItem value="reported">Reported</MenuItem>
                <MenuItem value="investigating">Investigating</MenuItem>
                <MenuItem value="contained">Contained</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Reported by"
                fullWidth
                value={form.reportedBy}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, reportedBy: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Affected users count"
                type="number"
                fullWidth
                value={form.affectedUsersCount}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, affectedUsersCount: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date detected"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.dateDetected}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, dateDetected: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date reported"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.dateReported}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, dateReported: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date contained"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.dateContained}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, dateContained: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date resolved"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.dateResolved}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, dateResolved: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Affected systems (comma separated)"
                fullWidth
                value={form.affectedSystems}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, affectedSystems: e.target.value } : prev))}
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
            <Grid item xs={12} md={6}>
              <TextField
                label="Root cause"
                fullWidth
                multiline
                minRows={2}
                value={form.rootCause}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, rootCause: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Remediation"
                fullWidth
                multiline
                minRows={2}
                value={form.remediation}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, remediation: e.target.value } : prev))}
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="space-between" mt={3} gap={1} flexWrap="wrap">
            <Button variant="outlined" onClick={() => router.push('/cybersecurity/incidents')} disabled={busy}>
              Back to incidents
            </Button>
            <Box display="flex" gap={1}>
              {canDelete && (
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

      {incident?.updatedAt && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Last updated: {new Date(incident.updatedAt).toLocaleString()}
        </Typography>
      )}
    </Box>
  );
}
