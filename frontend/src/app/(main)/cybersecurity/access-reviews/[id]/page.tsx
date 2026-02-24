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

type AccessReviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue';

type AccessReviewRecord = {
  id: string;
  title: string;
  description?: string | null;
  scope?: string | null;
  status: AccessReviewStatus;
  dueDate: string;
  lastCompletedDate?: string | null;
  nextDueDate?: string | null;
  reviewer?: string | null;
  usersReviewedCount?: number;
  accessRemovedCount?: number;
  findings?: string | null;
  updatedAt?: string;
};

type FormState = {
  title: string;
  description: string;
  scope: string;
  status: AccessReviewStatus;
  dueDate: string;
  lastCompletedDate: string;
  nextDueDate: string;
  reviewer: string;
  usersReviewedCount: string;
  accessRemovedCount: string;
  findings: string;
};

function toInputDate(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function toIsoDate(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function mapReviewToForm(review: AccessReviewRecord): FormState {
  return {
    title: review.title ?? '',
    description: review.description ?? '',
    scope: review.scope ?? '',
    status: review.status,
    dueDate: toInputDate(review.dueDate),
    lastCompletedDate: toInputDate(review.lastCompletedDate),
    nextDueDate: toInputDate(review.nextDueDate),
    reviewer: review.reviewer ?? '',
    usersReviewedCount: String(review.usersReviewedCount ?? 0),
    accessRemovedCount: String(review.accessRemovedCount ?? 0),
    findings: review.findings ?? '',
  };
}

export default function AccessReviewDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const canManage = user?.role === 'ict_manager';

  const [review, setReview] = useState<AccessReviewRecord | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api<AccessReviewRecord>(`/cybersecurity/access-reviews/${id}`)
      .then((data) => {
        if (!mounted) return;
        setReview(data);
        setForm(mapReviewToForm(data));
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load access review');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const onSave = async () => {
    if (!form || !canManage || !form.title.trim() || !form.dueDate) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await api<AccessReviewRecord>(`/cybersecurity/access-reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          scope: form.scope.trim() || undefined,
          status: form.status,
          dueDate: toIsoDate(form.dueDate),
          lastCompletedDate: toIsoDate(form.lastCompletedDate),
          nextDueDate: toIsoDate(form.nextDueDate),
          reviewer: form.reviewer.trim() || undefined,
          usersReviewedCount: Number(form.usersReviewedCount) || 0,
          accessRemovedCount: Number(form.accessRemovedCount) || 0,
          findings: form.findings.trim() || undefined,
        }),
      });
      setReview(updated);
      setForm(mapReviewToForm(updated));
      setNotice('Access review updated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update access review');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!canManage) return;
    const confirmed = window.confirm('Delete this access review? This action cannot be undone.');
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/cybersecurity/access-reviews/${id}`, { method: 'DELETE' });
      router.push('/cybersecurity/access-reviews');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete access review');
      setBusy(false);
    }
  };

  if (loading || !form) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Access review details
        </Typography>
        <Skeleton variant="rectangular" height={280} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Access review details
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
                label="Scope"
                fullWidth
                value={form.scope}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, scope: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Reviewer"
                fullWidth
                value={form.reviewer}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, reviewer: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Status"
                fullWidth
                value={form.status}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, status: e.target.value as AccessReviewStatus } : prev))}
              >
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="in_progress">In progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Due date"
                type="date"
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.dueDate}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, dueDate: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Next due date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.nextDueDate}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, nextDueDate: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Last completed date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.lastCompletedDate}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, lastCompletedDate: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Users reviewed"
                type="number"
                fullWidth
                value={form.usersReviewedCount}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, usersReviewedCount: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Access removed"
                type="number"
                fullWidth
                value={form.accessRemovedCount}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, accessRemovedCount: e.target.value } : prev))}
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
                label="Findings"
                fullWidth
                multiline
                minRows={2}
                value={form.findings}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, findings: e.target.value } : prev))}
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="space-between" mt={3} gap={1} flexWrap="wrap">
            <Button variant="outlined" onClick={() => router.push('/cybersecurity/access-reviews')} disabled={busy}>
              Back to access reviews
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
                disabled={!canManage || busy || !form.title.trim() || !form.dueDate}
              >
                Save changes
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {review?.updatedAt && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Last updated: {new Date(review.updatedAt).toLocaleString()}
        </Typography>
      )}
    </Box>
  );
}
