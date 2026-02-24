'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted' | 'pii';
type DataAssetType = 'database' | 'file_system' | 'api' | 'data_warehouse' | 'cloud_storage';
type ProcessingPurpose = 'business_operations' | 'analytics' | 'compliance' | 'marketing' | 'research' | 'other';

type DataAsset = {
  id: string;
  name: string;
  assetType: DataAssetType;
  classification: DataClassification;
  owner?: string | null;
  steward?: string | null;
  recordCount: number;
  location?: string | null;
};

type DataProcessingRecord = {
  id: string;
  title: string;
  purpose: ProcessingPurpose;
  consentStatus: string;
  processor?: string | null;
  retentionUntil?: string | null;
  dpia: boolean;
};

type DataQualityMetric = {
  id: string;
  dataAssetName: string;
  dimension: string;
  score: number;
  reviewer?: string | null;
  nextReviewDate?: string | null;
};

type GovernanceStats = {
  totalAssets: number;
  assetsByClassification: Record<string, number>;
  processingRecords: number;
  pendingDPIA: number;
  qualityMetrics: number;
  lowQualityAssets: number;
};

type DeleteTarget = {
  kind: 'asset' | 'record' | 'metric';
  id: string;
  label: string;
};

const CLASSIFICATION_OPTIONS: DataClassification[] = ['public', 'internal', 'confidential', 'restricted', 'pii'];
const ASSET_TYPE_OPTIONS: DataAssetType[] = ['database', 'file_system', 'api', 'data_warehouse', 'cloud_storage'];
const PURPOSE_OPTIONS: ProcessingPurpose[] = ['business_operations', 'analytics', 'compliance', 'marketing', 'research', 'other'];

export default function DataGovernancePage() {
  const { user } = useAuth();
  const isManager = user?.role === 'ict_manager';

  const [assets, setAssets] = useState<DataAsset[]>([]);
  const [records, setRecords] = useState<DataProcessingRecord[]>([]);
  const [metrics, setMetrics] = useState<DataQualityMetric[]>([]);
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assetOpen, setAssetOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [metricOpen, setMetricOpen] = useState(false);
  const [assetEditingId, setAssetEditingId] = useState<string | null>(null);
  const [recordEditingId, setRecordEditingId] = useState<string | null>(null);
  const [metricEditingId, setMetricEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [assetErrors, setAssetErrors] = useState<{ name?: string; recordCount?: string }>({});
  const [recordErrors, setRecordErrors] = useState<{ title?: string }>({});
  const [metricErrors, setMetricErrors] = useState<{ dataAssetName?: string; score?: string }>({});

  const [assetForm, setAssetForm] = useState({
    name: '',
    assetType: 'database' as DataAssetType,
    classification: 'internal' as DataClassification,
    owner: '',
    steward: '',
    location: '',
    recordCount: '0',
  });

  const [recordForm, setRecordForm] = useState({
    title: '',
    purpose: 'business_operations' as ProcessingPurpose,
    processor: '',
    retentionUntil: '',
    dpia: false,
  });

  const [metricForm, setMetricForm] = useState({
    dataAssetName: '',
    dimension: 'accuracy',
    score: '100',
    reviewer: '',
    nextReviewDate: '',
  });

  const resetAssetForm = () => {
    setAssetForm({
      name: '',
      assetType: 'database',
      classification: 'internal',
      owner: '',
      steward: '',
      location: '',
      recordCount: '0',
    });
    setAssetErrors({});
    setAssetEditingId(null);
  };

  const resetRecordForm = () => {
    setRecordForm({
      title: '',
      purpose: 'business_operations',
      processor: '',
      retentionUntil: '',
      dpia: false,
    });
    setRecordErrors({});
    setRecordEditingId(null);
  };

  const resetMetricForm = () => {
    setMetricForm({
      dataAssetName: '',
      dimension: 'accuracy',
      score: '100',
      reviewer: '',
      nextReviewDate: '',
    });
    setMetricErrors({});
    setMetricEditingId(null);
  };

  const validateAsset = () => {
    const next: { name?: string; recordCount?: string } = {};
    if (!assetForm.name.trim()) next.name = 'Name is required';
    const count = Number(assetForm.recordCount);
    if (!Number.isFinite(count) || count < 0) next.recordCount = 'Record count must be 0 or more';
    setAssetErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateRecord = () => {
    const next: { title?: string } = {};
    if (!recordForm.title.trim()) next.title = 'Title is required';
    setRecordErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateMetric = () => {
    const next: { dataAssetName?: string; score?: string } = {};
    if (!metricForm.dataAssetName.trim()) next.dataAssetName = 'Data asset name is required';
    const score = Number(metricForm.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) next.score = 'Score must be between 0 and 100';
    setMetricErrors(next);
    return Object.keys(next).length === 0;
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetData, recordData, metricData, statData] = await Promise.all([
        api<DataAsset[]>('/data-governance/assets'),
        api<DataProcessingRecord[]>('/data-governance/processing-records'),
        api<DataQualityMetric[]>('/data-governance/quality-metrics'),
        api<GovernanceStats>('/data-governance/dashboard-stats'),
      ]);
      setAssets(assetData);
      setRecords(recordData);
      setMetrics(metricData);
      setStats(statData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data governance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const cards = useMemo(() => ([
    { label: 'Data Assets', value: stats?.totalAssets ?? 0 },
    { label: 'Processing Records', value: stats?.processingRecords ?? 0 },
    { label: 'Quality Metrics', value: stats?.qualityMetrics ?? 0 },
    { label: 'Pending DPIA', value: stats?.pendingDPIA ?? 0 },
    { label: 'Low Quality Assets', value: stats?.lowQualityAssets ?? 0 },
  ]), [stats]);

  const openEditAsset = (asset: DataAsset) => {
    setAssetEditingId(asset.id);
    setAssetForm({
      name: asset.name,
      assetType: asset.assetType,
      classification: asset.classification,
      owner: asset.owner ?? '',
      steward: asset.steward ?? '',
      location: asset.location ?? '',
      recordCount: String(asset.recordCount ?? 0),
    });
    setAssetOpen(true);
  };

  const openEditRecord = (record: DataProcessingRecord) => {
    setRecordEditingId(record.id);
    setRecordForm({
      title: record.title,
      purpose: record.purpose,
      processor: record.processor ?? '',
      retentionUntil: record.retentionUntil ? record.retentionUntil.slice(0, 10) : '',
      dpia: record.dpia,
    });
    setRecordOpen(true);
  };

  const openEditMetric = (metric: DataQualityMetric) => {
    setMetricEditingId(metric.id);
    setMetricForm({
      dataAssetName: metric.dataAssetName,
      dimension: metric.dimension,
      score: String(metric.score ?? 0),
      reviewer: metric.reviewer ?? '',
      nextReviewDate: metric.nextReviewDate ? metric.nextReviewDate.slice(0, 10) : '',
    });
    setMetricOpen(true);
  };

  const saveAsset = async () => {
    if (!validateAsset()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: assetForm.name.trim(),
        assetType: assetForm.assetType,
        classification: assetForm.classification,
        owner: assetForm.owner.trim() || undefined,
        steward: assetForm.steward.trim() || undefined,
        location: assetForm.location.trim() || undefined,
        recordCount: parseInt(assetForm.recordCount, 10) || 0,
      };
      if (assetEditingId) {
        const saved = await api<DataAsset>(`/data-governance/assets/${assetEditingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setAssets((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
        setToast({ open: true, message: 'Data asset updated', severity: 'success' });
      } else {
        const saved = await api<DataAsset>('/data-governance/assets', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setAssets((prev) => [saved, ...prev]);
        setToast({ open: true, message: 'Data asset created', severity: 'success' });
      }
      setAssetOpen(false);
      resetAssetForm();
      void loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save data asset');
      setToast({ open: true, message: 'Failed to save data asset', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const saveRecord = async () => {
    if (!validateRecord()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: recordForm.title.trim(),
        purpose: recordForm.purpose,
        processor: recordForm.processor.trim() || undefined,
        retentionUntil: recordForm.retentionUntil ? new Date(recordForm.retentionUntil).toISOString() : undefined,
        dpia: recordForm.dpia,
      };
      if (recordEditingId) {
        const saved = await api<DataProcessingRecord>(`/data-governance/processing-records/${recordEditingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setRecords((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
        setToast({ open: true, message: 'Processing record updated', severity: 'success' });
      } else {
        const saved = await api<DataProcessingRecord>('/data-governance/processing-records', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setRecords((prev) => [saved, ...prev]);
        setToast({ open: true, message: 'Processing record created', severity: 'success' });
      }
      setRecordOpen(false);
      resetRecordForm();
      void loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save processing record');
      setToast({ open: true, message: 'Failed to save processing record', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const saveMetric = async () => {
    if (!validateMetric()) return;
    setSubmitting(true);
    try {
      const payload = {
        dataAssetName: metricForm.dataAssetName.trim(),
        dimension: metricForm.dimension.trim(),
        score: Number(metricForm.score) || 0,
        reviewer: metricForm.reviewer.trim() || undefined,
        nextReviewDate: metricForm.nextReviewDate ? new Date(metricForm.nextReviewDate).toISOString() : undefined,
      };
      if (metricEditingId) {
        const saved = await api<DataQualityMetric>(`/data-governance/quality-metrics/${metricEditingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setMetrics((prev) => prev.map((m) => (m.id === saved.id ? saved : m)));
        setToast({ open: true, message: 'Quality metric updated', severity: 'success' });
      } else {
        const saved = await api<DataQualityMetric>('/data-governance/quality-metrics', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMetrics((prev) => [saved, ...prev]);
        setToast({ open: true, message: 'Quality metric created', severity: 'success' });
      }
      setMetricOpen(false);
      resetMetricForm();
      void loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save quality metric');
      setToast({ open: true, message: 'Failed to save quality metric', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      if (deleteTarget.kind === 'asset') {
        await api(`/data-governance/assets/${deleteTarget.id}`, { method: 'DELETE' });
        setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        setToast({ open: true, message: 'Data asset deleted', severity: 'success' });
      } else if (deleteTarget.kind === 'record') {
        await api(`/data-governance/processing-records/${deleteTarget.id}`, { method: 'DELETE' });
        setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        setToast({ open: true, message: 'Processing record deleted', severity: 'success' });
      } else {
        await api(`/data-governance/quality-metrics/${deleteTarget.id}`, { method: 'DELETE' });
        setMetrics((prev) => prev.filter((m) => m.id !== deleteTarget.id));
        setToast({ open: true, message: 'Quality metric deleted', severity: 'success' });
      }
      setDeleteTarget(null);
      void loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete item');
      setToast({ open: true, message: 'Failed to delete item', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Data Governance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Data assets, processing records, and quality controls.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {cards.map((c) => (
          <Grid key={c.label} item xs={6} md={4} lg={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                  {c.label}
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {loading ? '...' : c.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">Data Assets</Typography>
                {isManager && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      resetAssetForm();
                      setAssetOpen(true);
                    }}
                  >
                    Add Asset
                  </Button>
                )}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Classification</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell>Steward</TableCell>
                      <TableCell>Records</TableCell>
                      {isManager && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assets.length === 0 ? (
                      <TableRow><TableCell colSpan={isManager ? 7 : 6} align="center">No data assets yet.</TableCell></TableRow>
                    ) : assets.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.name}</TableCell>
                        <TableCell>{a.assetType.replace('_', ' ')}</TableCell>
                        <TableCell>{a.classification}</TableCell>
                        <TableCell>{a.owner || '-'}</TableCell>
                        <TableCell>{a.steward || '-'}</TableCell>
                        <TableCell>{a.recordCount}</TableCell>
                        {isManager && (
                          <TableCell align="right">
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEditAsset(a)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteTarget({ kind: 'asset', id: a.id, label: a.name })}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">Processing Records</Typography>
                {isManager && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      resetRecordForm();
                      setRecordOpen(true);
                    }}
                  >
                    Add
                  </Button>
                )}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                      <TableCell>Title</TableCell>
                      <TableCell>Purpose</TableCell>
                      <TableCell>DPIA</TableCell>
                      <TableCell>Retention</TableCell>
                      {isManager && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow><TableCell colSpan={isManager ? 5 : 4} align="center">No processing records yet.</TableCell></TableRow>
                    ) : records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.title}</TableCell>
                        <TableCell>{r.purpose.replace('_', ' ')}</TableCell>
                        <TableCell>{r.dpia ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{r.retentionUntil ? new Date(r.retentionUntil).toLocaleDateString() : '-'}</TableCell>
                        {isManager && (
                          <TableCell align="right">
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEditRecord(r)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteTarget({ kind: 'record', id: r.id, label: r.title })}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">Quality Metrics</Typography>
                {isManager && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      resetMetricForm();
                      setMetricOpen(true);
                    }}
                  >
                    Add
                  </Button>
                )}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                      <TableCell>Asset</TableCell>
                      <TableCell>Dimension</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Next Review</TableCell>
                      {isManager && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.length === 0 ? (
                      <TableRow><TableCell colSpan={isManager ? 5 : 4} align="center">No quality metrics yet.</TableCell></TableRow>
                    ) : metrics.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.dataAssetName}</TableCell>
                        <TableCell>{m.dimension}</TableCell>
                        <TableCell>{m.score}</TableCell>
                        <TableCell>{m.nextReviewDate ? new Date(m.nextReviewDate).toLocaleDateString() : '-'}</TableCell>
                        {isManager && (
                          <TableCell align="right">
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEditMetric(m)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteTarget({ kind: 'metric', id: m.id, label: m.dataAssetName })}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={assetOpen} onClose={() => !submitting && setAssetOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{assetEditingId ? 'Edit Data Asset' : 'Add Data Asset'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Name" fullWidth required value={assetForm.name} onChange={(e) => setAssetForm((p) => ({ ...p, name: e.target.value }))} error={!!assetErrors.name} helperText={assetErrors.name} />
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <TextField select margin="dense" label="Asset Type" fullWidth value={assetForm.assetType} onChange={(e) => setAssetForm((p) => ({ ...p, assetType: e.target.value as DataAssetType }))}>
                {ASSET_TYPE_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o.replace('_', ' ')}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select margin="dense" label="Classification" fullWidth value={assetForm.classification} onChange={(e) => setAssetForm((p) => ({ ...p, classification: e.target.value as DataClassification }))}>
                {CLASSIFICATION_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
          <TextField margin="dense" label="Owner (email)" fullWidth value={assetForm.owner} onChange={(e) => setAssetForm((p) => ({ ...p, owner: e.target.value }))} />
          <TextField margin="dense" label="Steward (email)" fullWidth value={assetForm.steward} onChange={(e) => setAssetForm((p) => ({ ...p, steward: e.target.value }))} />
          <TextField margin="dense" label="Location" fullWidth value={assetForm.location} onChange={(e) => setAssetForm((p) => ({ ...p, location: e.target.value }))} />
          <TextField margin="dense" label="Record Count" type="number" fullWidth value={assetForm.recordCount} onChange={(e) => setAssetForm((p) => ({ ...p, recordCount: e.target.value }))} error={!!assetErrors.recordCount} helperText={assetErrors.recordCount} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAssetOpen(false); resetAssetForm(); }} disabled={submitting}>Cancel</Button>
          <Button onClick={saveAsset} variant="contained" disabled={submitting || !assetForm.name.trim()}>
            {assetEditingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={recordOpen} onClose={() => !submitting && setRecordOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{recordEditingId ? 'Edit Processing Record' : 'Add Processing Record'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Title" fullWidth required value={recordForm.title} onChange={(e) => setRecordForm((p) => ({ ...p, title: e.target.value }))} error={!!recordErrors.title} helperText={recordErrors.title} />
          <TextField select margin="dense" label="Purpose" fullWidth value={recordForm.purpose} onChange={(e) => setRecordForm((p) => ({ ...p, purpose: e.target.value as ProcessingPurpose }))}>
            {PURPOSE_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o.replace('_', ' ')}</MenuItem>)}
          </TextField>
          <TextField margin="dense" label="Processor" fullWidth value={recordForm.processor} onChange={(e) => setRecordForm((p) => ({ ...p, processor: e.target.value }))} />
          <TextField margin="dense" type="date" label="Retention Until" fullWidth InputLabelProps={{ shrink: true }} value={recordForm.retentionUntil} onChange={(e) => setRecordForm((p) => ({ ...p, retentionUntil: e.target.value }))} />
          <TextField select margin="dense" label="DPIA Completed" fullWidth value={recordForm.dpia ? 'yes' : 'no'} onChange={(e) => setRecordForm((p) => ({ ...p, dpia: e.target.value === 'yes' }))}>
            <MenuItem value="yes">Yes</MenuItem>
            <MenuItem value="no">No</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRecordOpen(false); resetRecordForm(); }} disabled={submitting}>Cancel</Button>
          <Button onClick={saveRecord} variant="contained" disabled={submitting || !recordForm.title.trim()}>
            {recordEditingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={metricOpen} onClose={() => !submitting && setMetricOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{metricEditingId ? 'Edit Quality Metric' : 'Add Quality Metric'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Data Asset Name" fullWidth required value={metricForm.dataAssetName} onChange={(e) => setMetricForm((p) => ({ ...p, dataAssetName: e.target.value }))} error={!!metricErrors.dataAssetName} helperText={metricErrors.dataAssetName} />
          <TextField margin="dense" label="Dimension" fullWidth value={metricForm.dimension} onChange={(e) => setMetricForm((p) => ({ ...p, dimension: e.target.value }))} />
          <TextField margin="dense" type="number" label="Score (0-100)" fullWidth value={metricForm.score} onChange={(e) => setMetricForm((p) => ({ ...p, score: e.target.value }))} error={!!metricErrors.score} helperText={metricErrors.score} />
          <TextField margin="dense" label="Reviewer" fullWidth value={metricForm.reviewer} onChange={(e) => setMetricForm((p) => ({ ...p, reviewer: e.target.value }))} />
          <TextField margin="dense" type="date" label="Next Review Date" fullWidth InputLabelProps={{ shrink: true }} value={metricForm.nextReviewDate} onChange={(e) => setMetricForm((p) => ({ ...p, nextReviewDate: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setMetricOpen(false); resetMetricForm(); }} disabled={submitting}>Cancel</Button>
          <Button onClick={saveMetric} variant="contained" disabled={submitting || !metricForm.dataAssetName.trim()}>
            {metricEditingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => !submitting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Delete {deleteTarget?.kind} "{deleteTarget?.label}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={submitting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={submitting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={2800}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToast((t) => ({ ...t, open: false }))} severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
