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

type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low';
type VulnerabilityStatus = 'identified' | 'acknowledged' | 'in_progress' | 'patched' | 'mitigated' | 'wont_fix';

type VulnerabilityRecord = {
  id: string;
  cveId: string;
  title: string;
  description?: string | null;
  severity: VulnerabilitySeverity;
  status: VulnerabilityStatus;
  affectedComponent?: string | null;
  affectedVersion?: string | null;
  patchVersion?: string | null;
  discoveredDate?: string | null;
  patchAvailableDate?: string | null;
  targetRemediationDate?: string | null;
  remediatedDate?: string | null;
  applicableSystems?: string[] | null;
  mitigation?: string | null;
  references?: string | null;
  updatedAt?: string;
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

function toInputDate(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function toIsoDate(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function mapVulnerabilityToForm(vuln: VulnerabilityRecord): FormState {
  return {
    cveId: vuln.cveId ?? '',
    title: vuln.title ?? '',
    description: vuln.description ?? '',
    severity: vuln.severity,
    status: vuln.status,
    affectedComponent: vuln.affectedComponent ?? '',
    affectedVersion: vuln.affectedVersion ?? '',
    patchVersion: vuln.patchVersion ?? '',
    discoveredDate: toInputDate(vuln.discoveredDate),
    patchAvailableDate: toInputDate(vuln.patchAvailableDate),
    targetRemediationDate: toInputDate(vuln.targetRemediationDate),
    remediatedDate: toInputDate(vuln.remediatedDate),
    applicableSystems: (vuln.applicableSystems ?? []).join(', '),
    mitigation: vuln.mitigation ?? '',
    references: vuln.references ?? '',
  };
}

export default function VulnerabilityDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const canManage = user?.role === 'ict_manager';

  const [vulnerability, setVulnerability] = useState<VulnerabilityRecord | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api<VulnerabilityRecord>(`/cybersecurity/vulnerabilities/${id}`)
      .then((data) => {
        if (!mounted) return;
        setVulnerability(data);
        setForm(mapVulnerabilityToForm(data));
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load vulnerability');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const onSave = async () => {
    if (!form || !canManage || !form.cveId.trim() || !form.title.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await api<VulnerabilityRecord>(`/cybersecurity/vulnerabilities/${id}`, {
        method: 'PUT',
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
      setVulnerability(updated);
      setForm(mapVulnerabilityToForm(updated));
      setNotice('Vulnerability updated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update vulnerability');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!canManage) return;
    const confirmed = window.confirm('Delete this vulnerability? This action cannot be undone.');
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/cybersecurity/vulnerabilities/${id}`, { method: 'DELETE' });
      router.push('/cybersecurity/vulnerabilities');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete vulnerability');
      setBusy(false);
    }
  };

  if (loading || !form) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Vulnerability details
        </Typography>
        <Skeleton variant="rectangular" height={320} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Vulnerability details
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
            <Grid item xs={12} md={5}>
              <TextField
                label="CVE ID"
                required
                fullWidth
                value={form.cveId}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, cveId: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={7}>
              <TextField
                label="Title"
                required
                fullWidth
                value={form.title}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Severity"
                fullWidth
                value={form.severity}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, severity: e.target.value as VulnerabilitySeverity } : prev))}
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
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, status: e.target.value as VulnerabilityStatus } : prev))}
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
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, affectedComponent: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Affected version"
                fullWidth
                value={form.affectedVersion}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, affectedVersion: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Patch version"
                fullWidth
                value={form.patchVersion}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, patchVersion: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Reference link"
                fullWidth
                value={form.references}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, references: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Discovered"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.discoveredDate}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, discoveredDate: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Patch available"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.patchAvailableDate}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, patchAvailableDate: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Target remediation"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.targetRemediationDate}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, targetRemediationDate: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Remediated"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.remediatedDate}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, remediatedDate: e.target.value } : prev))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Applicable systems (comma separated)"
                fullWidth
                value={form.applicableSystems}
                disabled={!canManage || busy}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, applicableSystems: e.target.value } : prev))}
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
            <Button variant="outlined" onClick={() => router.push('/cybersecurity/vulnerabilities')} disabled={busy}>
              Back to vulnerabilities
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
                disabled={!canManage || busy || !form.cveId.trim() || !form.title.trim()}
              >
                Save changes
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {vulnerability?.updatedAt && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Last updated: {new Date(vulnerability.updatedAt).toLocaleString()}
        </Typography>
      )}
    </Box>
  );
}
