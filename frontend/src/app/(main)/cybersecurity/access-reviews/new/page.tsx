'use client';

import { useState } from 'react';
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

type AccessReviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue';

type AccessReviewRecord = {
  id: string;
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

const INITIAL_FORM: FormState = {
  title: '',
  description: '',
  scope: '',
  status: 'scheduled',
  dueDate: '',
  lastCompletedDate: '',
  nextDueDate: '',
  reviewer: '',
  usersReviewedCount: '0',
  accessRemovedCount: '0',
  findings: '',
};

function toIsoDate(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

export default function NewAccessReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canManage = user?.role === 'ict_manager';

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    if (!canManage || !form.title.trim() || !form.dueDate) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api<AccessReviewRecord>('/cybersecurity/access-reviews', {
        method: 'POST',
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
      router.push(`/cybersecurity/access-reviews/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create access review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Schedule access review
      </Typography>

      {!canManage && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You do not have permission to create access reviews.
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
                required
                fullWidth
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Scope"
                fullWidth
                value={form.scope}
                onChange={(e) => setForm((prev) => ({ ...prev, scope: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Reviewer"
                fullWidth
                value={form.reviewer}
                onChange={(e) => setForm((prev) => ({ ...prev, reviewer: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Status"
                fullWidth
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as AccessReviewStatus }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Next due date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.nextDueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, nextDueDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Last completed date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.lastCompletedDate}
                onChange={(e) => setForm((prev) => ({ ...prev, lastCompletedDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Users reviewed"
                type="number"
                fullWidth
                value={form.usersReviewedCount}
                onChange={(e) => setForm((prev) => ({ ...prev, usersReviewedCount: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Access removed"
                type="number"
                fullWidth
                value={form.accessRemovedCount}
                onChange={(e) => setForm((prev) => ({ ...prev, accessRemovedCount: e.target.value }))}
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
            <Grid item xs={12}>
              <TextField
                label="Findings"
                fullWidth
                multiline
                minRows={2}
                value={form.findings}
                onChange={(e) => setForm((prev) => ({ ...prev, findings: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Box display="flex" gap={1} justifyContent="flex-end" mt={3}>
            <Button variant="outlined" onClick={() => router.push('/cybersecurity/access-reviews')}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => void onCreate()}
              disabled={!canManage || submitting || !form.title.trim() || !form.dueDate}
            >
              Create access review
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
