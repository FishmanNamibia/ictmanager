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
};

type FormState = {
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedBy: string;
  dateDetected: string;
  dateReported: string;
  affectedSystems: string;
  affectedUsersCount: string;
  rootCause: string;
  remediation: string;
};

const INITIAL_FORM: FormState = {
  title: '',
  description: '',
  severity: 'medium',
  status: 'reported',
  reportedBy: '',
  dateDetected: '',
  dateReported: '',
  affectedSystems: '',
  affectedUsersCount: '0',
  rootCause: '',
  remediation: '',
};

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

export default function NewIncidentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canManage = user?.role === 'ict_manager' || user?.role === 'executive';

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    setForm((prev) => ({ ...prev, reportedBy: prev.reportedBy || user.email }));
  }, [user?.email]);

  const onCreate = async () => {
    if (!form.title.trim() || !canManage) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api<IncidentRecord>('/cybersecurity/incidents', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          severity: form.severity,
          status: form.status,
          reportedBy: form.reportedBy.trim() || undefined,
          dateDetected: toIsoDateTime(form.dateDetected),
          dateReported: toIsoDateTime(form.dateReported),
          affectedSystems: form.affectedSystems
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          affectedUsersCount: Number(form.affectedUsersCount) || 0,
          rootCause: form.rootCause.trim() || undefined,
          remediation: form.remediation.trim() || undefined,
        }),
      });
      router.push(`/cybersecurity/incidents/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Report security incident
      </Typography>

      {!canManage && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You do not have permission to create incidents.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Severity"
                fullWidth
                value={form.severity}
                onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value as IncidentSeverity }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as IncidentStatus }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, reportedBy: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Affected users count"
                type="number"
                fullWidth
                value={form.affectedUsersCount}
                onChange={(e) => setForm((prev) => ({ ...prev, affectedUsersCount: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date detected"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.dateDetected}
                onChange={(e) => setForm((prev) => ({ ...prev, dateDetected: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date reported"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.dateReported}
                onChange={(e) => setForm((prev) => ({ ...prev, dateReported: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Affected systems (comma separated)"
                fullWidth
                value={form.affectedSystems}
                onChange={(e) => setForm((prev) => ({ ...prev, affectedSystems: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Root cause"
                fullWidth
                multiline
                minRows={2}
                value={form.rootCause}
                onChange={(e) => setForm((prev) => ({ ...prev, rootCause: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Remediation"
                fullWidth
                multiline
                minRows={2}
                value={form.remediation}
                onChange={(e) => setForm((prev) => ({ ...prev, remediation: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Box display="flex" gap={1} justifyContent="flex-end" mt={3}>
            <Button variant="outlined" onClick={() => router.push('/cybersecurity/incidents')}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => void onCreate()}
              disabled={!canManage || submitting || !form.title.trim()}
            >
              Create incident
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
