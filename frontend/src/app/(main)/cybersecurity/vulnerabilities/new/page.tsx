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

type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low';
type VulnerabilityStatus = 'identified' | 'acknowledged' | 'in_progress' | 'patched' | 'mitigated' | 'wont_fix';

type VulnerabilityRecord = {
  id: string;
};

type FormState = {
  cveId: string;
  title: string;
  description: string;
  severity: VulnerabilitySeverity;
  status: VulnerabilityStatus;
  affectedComponent: string;
  affectedVersion: string;
  patchVersion: string;
  discoveredDate: string;
  patchAvailableDate: string;
  targetRemediationDate: string;
  remediatedDate: string;
  applicableSystems: string;
  mitigation: string;
  references: string;
};

const INITIAL_FORM: FormState = {
  cveId: '',
  title: '',
  description: '',
  severity: 'medium',
  status: 'identified',
  affectedComponent: '',
  affectedVersion: '',
  patchVersion: '',
  discoveredDate: '',
  patchAvailableDate: '',
  targetRemediationDate: '',
  remediatedDate: '',
  applicableSystems: '',
  mitigation: '',
  references: '',
};

function toIsoDate(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

export default function NewVulnerabilityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canManage = user?.role === 'ict_manager';

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    if (!canManage || !form.cveId.trim() || !form.title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api<VulnerabilityRecord>('/cybersecurity/vulnerabilities', {
        method: 'POST',
        body: JSON.stringify({
          cveId: form.cveId.trim(),
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          severity: form.severity,
          status: form.status,
          affectedComponent: form.affectedComponent.trim() || undefined,
          affectedVersion: form.affectedVersion.trim() || undefined,
          patchVersion: form.patchVersion.trim() || undefined,
          discoveredDate: toIsoDate(form.discoveredDate),
          patchAvailableDate: toIsoDate(form.patchAvailableDate),
          targetRemediationDate: toIsoDate(form.targetRemediationDate),
          remediatedDate: toIsoDate(form.remediatedDate),
          applicableSystems: form.applicableSystems
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          mitigation: form.mitigation.trim() || undefined,
          references: form.references.trim() || undefined,
        }),
      });
      router.push(`/cybersecurity/vulnerabilities/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create vulnerability');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Report vulnerability
      </Typography>

      {!canManage && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You do not have permission to create vulnerabilities.
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
            <Grid item xs={12} md={5}>
              <TextField
                label="CVE ID"
                required
                fullWidth
                value={form.cveId}
                onChange={(e) => setForm((prev) => ({ ...prev, cveId: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={7}>
              <TextField
                label="Title"
                required
                fullWidth
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Severity"
                fullWidth
                value={form.severity}
                onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value as VulnerabilitySeverity }))}
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
                label="Status"
                fullWidth
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as VulnerabilityStatus }))}
              >
                <MenuItem value="identified">Identified</MenuItem>
                <MenuItem value="acknowledged">Acknowledged</MenuItem>
                <MenuItem value="in_progress">In progress</MenuItem>
                <MenuItem value="patched">Patched</MenuItem>
                <MenuItem value="mitigated">Mitigated</MenuItem>
                <MenuItem value="wont_fix">Won't fix</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Affected component"
                fullWidth
                value={form.affectedComponent}
                onChange={(e) => setForm((prev) => ({ ...prev, affectedComponent: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Affected version"
                fullWidth
                value={form.affectedVersion}
                onChange={(e) => setForm((prev) => ({ ...prev, affectedVersion: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Patch version"
                fullWidth
                value={form.patchVersion}
                onChange={(e) => setForm((prev) => ({ ...prev, patchVersion: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Reference link"
                fullWidth
                value={form.references}
                onChange={(e) => setForm((prev) => ({ ...prev, references: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                label="Discovered"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.discoveredDate}
                onChange={(e) => setForm((prev) => ({ ...prev, discoveredDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Patch available"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.patchAvailableDate}
                onChange={(e) => setForm((prev) => ({ ...prev, patchAvailableDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Target remediation"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.targetRemediationDate}
                onChange={(e) => setForm((prev) => ({ ...prev, targetRemediationDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Remediated"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.remediatedDate}
                onChange={(e) => setForm((prev) => ({ ...prev, remediatedDate: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Applicable systems (comma separated)"
                fullWidth
                value={form.applicableSystems}
                onChange={(e) => setForm((prev) => ({ ...prev, applicableSystems: e.target.value }))}
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
            <Button variant="outlined" onClick={() => router.push('/cybersecurity/vulnerabilities')}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => void onCreate()}
              disabled={!canManage || submitting || !form.cveId.trim() || !form.title.trim()}
            >
              Create vulnerability
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
