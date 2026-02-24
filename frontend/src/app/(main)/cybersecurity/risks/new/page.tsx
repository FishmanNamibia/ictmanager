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

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
type RiskStatus = 'identified' | 'mitigating' | 'monitored' | 'resolved';

type RiskRecord = {
  id: string;
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

const INITIAL_FORM: FormState = {
  title: '',
  description: '',
  category: '',
  likelihood: 'medium',
  impact: 'medium',
  overallRisk: 'medium',
  status: 'identified',
  mitigation: '',
  owner: '',
  reviewDue: '',
};

function toIsoDate(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

export default function NewRiskPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canManage = user?.role === 'ict_manager';

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    if (!canManage || !form.title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api<RiskRecord>('/cybersecurity/risks', {
        method: 'POST',
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
      router.push(`/cybersecurity/risks/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create risk');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Register ICT risk
      </Typography>

      {!canManage && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You do not have permission to create risks.
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
                label="Category"
                fullWidth
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Owner"
                fullWidth
                value={form.owner}
                onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Likelihood"
                fullWidth
                value={form.likelihood}
                onChange={(e) => setForm((prev) => ({ ...prev, likelihood: e.target.value as RiskLevel }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, impact: e.target.value as RiskLevel }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, overallRisk: e.target.value as RiskLevel }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as RiskStatus }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, reviewDue: e.target.value }))}
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
                label="Mitigation"
                fullWidth
                multiline
                minRows={2}
                value={form.mitigation}
                onChange={(e) => setForm((prev) => ({ ...prev, mitigation: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Box display="flex" gap={1} justifyContent="flex-end" mt={3}>
            <Button variant="outlined" onClick={() => router.push('/cybersecurity/risks')}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => void onCreate()}
              disabled={!canManage || submitting || !form.title.trim()}
            >
              Create risk
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
