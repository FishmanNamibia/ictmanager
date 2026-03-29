'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssetFormDialog, { AssetFormData } from '@/components/AssetFormDialog';
import AssetControlDialog from '@/components/AssetControlDialog';
import { useAuth } from '@/contexts/AuthContext';
import { apiUpload, assetApi, AssetControlOverview, AssetRecord, AssetReportsSummary, getApiBaseUrl } from '@/lib/api';

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : '';
}

function assetToFormData(asset: AssetRecord): Partial<AssetFormData> {
  return {
    assetTag: asset.assetTag,
    barcode: asset.barcode ?? '',
    name: asset.name,
    description: asset.description ?? '',
    type: asset.type,
    assetSubtype: asset.assetSubtype ?? '',
    status: asset.status,
    condition: asset.condition ?? '',
    manufacturer: asset.manufacturer ?? '',
    model: asset.model ?? '',
    serialNumber: asset.serialNumber ?? '',
    ipAddress: asset.ipAddress ?? '',
    purchaseDate: toDateInput(asset.purchaseDate),
    warrantyEnd: toDateInput(asset.warrantyEnd),
    expectedEndOfLife: toDateInput(asset.expectedEndOfLife),
    cost: asset.cost != null ? String(asset.cost) : '',
    usefulLifeMonths: asset.usefulLifeMonths != null ? String(asset.usefulLifeMonths) : '',
    supplier: asset.supplier ?? '',
    maintenanceProvider: asset.maintenanceProvider ?? '',
    maintenanceFrequencyMonths: asset.maintenanceFrequencyMonths != null ? String(asset.maintenanceFrequencyMonths) : '',
    lastMaintenanceDate: toDateInput(asset.lastMaintenanceDate),
    nextMaintenanceDate: toDateInput(asset.nextMaintenanceDate),
    maintenanceContractEnd: toDateInput(asset.maintenanceContractEnd),
    poNumber: asset.poNumber ?? '',
    batteryInstallDate: toDateInput(asset.batteryInstallDate),
    batteryReplacementDue: toDateInput(asset.batteryReplacementDue),
    loadCapacityKva: asset.loadCapacityKva != null ? String(asset.loadCapacityKva) : '',
    runtimeMinutes: asset.runtimeMinutes != null ? String(asset.runtimeMinutes) : '',
    protectedSystems: asset.protectedSystems ?? '',
    assignedToName: asset.assignedToName ?? '',
    assignedToDepartment: asset.assignedToDepartment ?? '',
    location: asset.location ?? '',
    notes: asset.notes ?? '',
  };
}

function formDataToPayload(data: AssetFormData): Record<string, unknown> {
  return {
    assetTag: data.assetTag.trim(),
    barcode: data.barcode.trim() || undefined,
    name: data.name.trim(),
    description: data.description.trim() || undefined,
    type: data.type,
    assetSubtype: data.assetSubtype || undefined,
    status: data.status,
    condition: data.condition || undefined,
    manufacturer: data.manufacturer.trim() || undefined,
    model: data.model.trim() || undefined,
    serialNumber: data.serialNumber.trim() || undefined,
    ipAddress: data.ipAddress.trim() || undefined,
    purchaseDate: data.purchaseDate || undefined,
    warrantyEnd: data.warrantyEnd || undefined,
    expectedEndOfLife: data.expectedEndOfLife || undefined,
    cost: data.cost ? parseFloat(data.cost) : undefined,
    usefulLifeMonths: data.usefulLifeMonths ? parseInt(data.usefulLifeMonths, 10) : undefined,
    supplier: data.supplier.trim() || undefined,
    maintenanceProvider: data.maintenanceProvider.trim() || undefined,
    maintenanceFrequencyMonths: data.maintenanceFrequencyMonths ? parseInt(data.maintenanceFrequencyMonths, 10) : undefined,
    lastMaintenanceDate: data.lastMaintenanceDate || undefined,
    nextMaintenanceDate: data.nextMaintenanceDate || undefined,
    maintenanceContractEnd: data.maintenanceContractEnd || undefined,
    poNumber: data.poNumber.trim() || undefined,
    batteryInstallDate: data.batteryInstallDate || undefined,
    batteryReplacementDue: data.batteryReplacementDue || undefined,
    loadCapacityKva: data.loadCapacityKva ? parseFloat(data.loadCapacityKva) : undefined,
    runtimeMinutes: data.runtimeMinutes ? parseInt(data.runtimeMinutes, 10) : undefined,
    protectedSystems: data.protectedSystems.trim() || undefined,
    assignedToName: data.assignedToName.trim() || undefined,
    assignedToDepartment: data.assignedToDepartment.trim() || undefined,
    location: data.location.trim() || undefined,
    notes: data.notes.trim() || undefined,
  };
}

function dateChip(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  const expired = date < new Date();
  return (
    <Chip
      label={date.toLocaleDateString()}
      size="small"
      color={expired ? 'error' : 'default'}
      variant={expired ? 'filled' : 'outlined'}
    />
  );
}

export default function AssetsPage() {
  const { user } = useAuth();
  const [list, setList] = useState<AssetRecord[]>([]);
  const [overview, setOverview] = useState<AssetControlOverview['summary'] | null>(null);
  const [reports, setReports] = useState<AssetReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetRecord | null>(null);
  const [createDefaults, setCreateDefaults] = useState<Partial<AssetFormData> | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetRecord | null>(null);
  const [controlOpen, setControlOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [alertRunMessage, setAlertRunMessage] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeNotice, setBarcodeNotice] = useState<{ severity: 'success' | 'info' | 'warning'; message: string } | null>(null);

  const fetchList = useCallback(() => {
    setLoading(true);
    assetApi.list()
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const fetchOverview = useCallback(() => {
    assetApi.controlOverview()
      .then((data) => setOverview(data.summary))
      .catch(() => setOverview(null));
  }, []);

  const fetchReports = useCallback(() => {
    assetApi.reports()
      .then(setReports)
      .catch(() => setReports(null));
  }, []);

  useEffect(() => {
    fetchList();
    fetchOverview();
    fetchReports();
  }, [fetchList, fetchOverview, fetchReports]);

  const handleDownloadTemplate = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? getApiBaseUrl() : '';
      const token = typeof window !== 'undefined' ? localStorage.getItem('iictms_token') : null;
      const res = await fetch(`${baseUrl}/assets/import-template`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to download');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assets-import-template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    }
  };

  const handleDownloadReport = async (type: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('iictms_token') : null;
      const res = await fetch(`${getApiBaseUrl()}/assets/reports/export?type=${encodeURIComponent(type)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to download report');
      const disposition = res.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/i);
      const fileName = match?.[1] ?? `${type}.csv`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Report download failed');
    }
  };

  const handleRunAlerts = async () => {
    try {
      const result = await assetApi.runAlerts();
      setAlertRunMessage(`Alerts evaluated. Managers notified: ${result.notifiedManagers ?? 0}. Pending approvals: ${result.pendingApprovals ?? 0}. Open variances: ${result.openVariances ?? 0}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run alerts');
    }
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      setImportResult(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const result = await apiUpload<{ created: number; errors: { row: number; message: string }[] }>('/assets/import-excel', formData);
        setImportResult(result);
        if (result.created > 0) {
          fetchList();
          fetchOverview();
          fetchReports();
        }
      } catch (err) {
        setImportResult({ created: 0, errors: [{ row: 0, message: err instanceof Error ? err.message : 'Import failed' }] });
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const handleFormSubmit = async (data: AssetFormData) => {
    const payload = formDataToPayload(data);
    if (editingAsset) {
      await assetApi.update(editingAsset.id, payload);
    } else {
      await assetApi.create(payload);
    }
    setCreateDefaults(null);
    fetchList();
    fetchOverview();
    fetchReports();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30Days = new Date(today.getTime() + 30 * 86400000);
  const in180Days = new Date(today.getTime() + 180 * 86400000);
  const upsAssets = list.filter((asset) => asset.assetSubtype === 'ups');
  const overdueMaintenance = upsAssets.filter((asset) => asset.nextMaintenanceDate && new Date(asset.nextMaintenanceDate) < today);
  const batteryDue = upsAssets.filter((asset) => asset.batteryReplacementDue && new Date(asset.batteryReplacementDue) <= in30Days);
  const eolDue = upsAssets.filter((asset) => asset.expectedEndOfLife && new Date(asset.expectedEndOfLife) <= in180Days);
  const canManage = ['ict_manager', 'ict_staff'].includes(user?.role ?? '');
  const canApprove = user?.role === 'ict_manager';

  const handleBarcodeIntake = () => {
    const code = barcodeInput.trim();
    if (!code) {
      setBarcodeNotice({ severity: 'warning', message: 'Scan or type a barcode first.' });
      return;
    }

    const normalized = code.toLowerCase();
    const matchedAsset = list.find(
      (asset) =>
        asset.assetTag.trim().toLowerCase() === normalized ||
        asset.barcode?.trim().toLowerCase() === normalized,
    );

    if (matchedAsset) {
      setSelectedAsset(matchedAsset);
      setControlOpen(true);
      setBarcodeNotice({
        severity: 'success',
        message: `Matched ${matchedAsset.assetTag}. Opened the asset control view.`,
      });
      setBarcodeInput('');
      return;
    }

    if (!canManage) {
      setBarcodeNotice({
        severity: 'warning',
        message: `No asset matched "${code}" and your role cannot create a new asset record.`,
      });
      return;
    }

    setEditingAsset(null);
    setCreateDefaults({
      barcode: code,
      assetTag: code,
    });
    setFormOpen(true);
    setBarcodeNotice({
      severity: 'info',
      message: `No existing asset matched "${code}". A new asset form has been opened with the barcode prefilled.`,
    });
    setBarcodeInput('');
  };

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight={700}>Asset & software management</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}>Template</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => void handleDownloadReport('stock-balance')}>Stock Report</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => void handleDownloadReport('audit-trail')}>Audit Export</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => void handleDownloadReport('variances')}>Variance Export</Button>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleImportClick} disabled={importing || !canManage}>
            {importing ? 'Importing...' : 'Import from Excel'}
          </Button>
          <Button variant="outlined" onClick={() => void handleRunAlerts()} disabled={!canApprove}>Run Alerts</Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingAsset(null);
              setCreateDefaults(null);
              setFormOpen(true);
            }}
            disabled={!canManage}
          >
            Add asset
          </Button>
        </Box>
      </Box>

      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Track assets, warranty, lifecycle, and UPS maintenance in one register. UPS records now support battery replacement planning,
        preventive maintenance dates, runtime, load capacity, and protected systems.
      </Typography>

      {barcodeNotice && <Alert severity={barcodeNotice.severity} sx={{ mb: 2 }}>{barcodeNotice.message}</Alert>}
      {alertRunMessage && <Alert severity="info" sx={{ mb: 2 }}>{alertRunMessage}</Alert>}

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
            Barcode Intake
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Scan a barcode to open an existing asset instantly, or start a new asset record with the scanned code prefilled.
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <TextField
              label="Barcode / Scan Code"
              value={barcodeInput}
              onChange={(event) => setBarcodeInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleBarcodeIntake();
                }
              }}
              size="small"
              sx={{ minWidth: 280, flex: '1 1 320px' }}
              placeholder="Scan with a barcode gun or type manually"
            />
            <Button variant="contained" onClick={handleBarcodeIntake}>
              Process Scan
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setBarcodeInput('');
                setBarcodeNotice(null);
              }}
            >
              Clear
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(4, 1fr)' }} gap={2} sx={{ mb: 2 }}>
        <Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">UPS Assets</Typography><Typography variant="h5" fontWeight={700}>{upsAssets.length}</Typography></CardContent></Card>
        <Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">Maintenance Overdue</Typography><Typography variant="h5" fontWeight={700} color={overdueMaintenance.length ? 'warning.main' : 'text.primary'}>{overdueMaintenance.length}</Typography></CardContent></Card>
        <Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">Battery Due in 30 Days</Typography><Typography variant="h5" fontWeight={700} color={batteryDue.length ? 'error.main' : 'text.primary'}>{batteryDue.length}</Typography></CardContent></Card>
        <Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">EOL Due in 6 Months</Typography><Typography variant="h5" fontWeight={700} color={eolDue.length ? 'error.main' : 'text.primary'}>{eolDue.length}</Typography></CardContent></Card>
      </Box>

      {overview && (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(5, 1fr)' }} gap={2} sx={{ mb: 2 }}>
          <Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">Movements in 30 Days</Typography><Typography variant="h5" fontWeight={700}>{overview.movementsLast30Days}</Typography></CardContent></Card>
          <Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">Pending Approvals</Typography><Typography variant="h5" fontWeight={700} color={overview.pendingApprovals ? 'warning.main' : 'text.primary'}>{overview.pendingApprovals}</Typography></CardContent></Card>
          <Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">Open Variances</Typography><Typography variant="h5" fontWeight={700} color={overview.openVariances ? 'error.main' : 'text.primary'}>{overview.openVariances}</Typography></CardContent></Card>
          <Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">Assets With Documents</Typography><Typography variant="h5" fontWeight={700}>{overview.documentedAssets}</Typography></CardContent></Card>
          <Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">Verified in 90 Days</Typography><Typography variant="h5" fontWeight={700}>{overview.assetsVerifiedLast90Days}</Typography></CardContent></Card>
        </Box>
      )}

      {reports && (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '1.2fr 1fr' }} gap={2} sx={{ mb: 2 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Department inventory</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Department</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>In Use</TableCell>
                    <TableCell>Maintenance</TableCell>
                    <TableCell>Disposed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.departmentInventory.slice(0, 6).map((row) => (
                    <TableRow key={row.department}>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.total}</TableCell>
                      <TableCell>{row.inUse}</TableCell>
                      <TableCell>{row.maintenance}</TableCell>
                      <TableCell>{row.disposed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Asset ageing</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Age Bucket</TableCell>
                    <TableCell>Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.assetAgeing.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell>{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Box>
      )}

      {importResult && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2">
              Import result: <strong>{importResult.created} asset(s) created</strong>
              {importResult.errors.length > 0 && ` · ${importResult.errors.length} row(s) with errors`}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Skeleton variant="rectangular" height={220} />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tag / Barcode</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Subtype</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>UPS Lifecycle</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Warranty</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">No assets yet. Click "Add asset" to create one.</TableCell>
                    </TableRow>
                  ) : (
                    list.map((asset) => (
                      <TableRow key={asset.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{asset.assetTag}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Barcode: {asset.barcode ?? 'Not set'}
                          </Typography>
                        </TableCell>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell><Chip label={asset.type} size="small" variant="outlined" /></TableCell>
                        <TableCell>{asset.assetSubtype ? <Chip label={asset.assetSubtype.toUpperCase()} size="small" color={asset.assetSubtype === 'ups' ? 'secondary' : 'default'} /> : '—'}</TableCell>
                        <TableCell><Chip label={asset.status.replace('_', ' ')} size="small" color={asset.status === 'maintenance' ? 'warning' : asset.status === 'in_use' ? 'info' : asset.status === 'active' ? 'success' : 'default'} /></TableCell>
                        <TableCell>
                          {asset.assetSubtype === 'ups' ? (
                            <Box>
                              <Typography variant="body2" fontWeight={600}>Battery: {asset.batteryReplacementDue ? new Date(asset.batteryReplacementDue).toLocaleDateString() : 'Not set'}</Typography>
                              <Typography variant="caption" color="text.secondary" display="block">Maintenance: {asset.nextMaintenanceDate ? new Date(asset.nextMaintenanceDate).toLocaleDateString() : 'Not set'}</Typography>
                              <Typography variant="caption" color="text.secondary" display="block">Runtime: {asset.runtimeMinutes ?? '—'} min | Capacity: {asset.loadCapacityKva ?? '—'} kVA</Typography>
                            </Box>
                          ) : '—'}
                        </TableCell>
                        <TableCell>{asset.location ?? '—'}</TableCell>
                        <TableCell>{asset.assignedToName ?? '—'}</TableCell>
                        <TableCell>{dateChip(asset.warrantyEnd)}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => { setSelectedAsset(asset); setControlOpen(true); }}><VisibilityIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => { setEditingAsset(asset); setFormOpen(true); }} disabled={!canManage}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteId(asset.id)} disabled={!canApprove}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <AssetFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingAsset(null);
          setCreateDefaults(null);
        }}
        onSubmit={handleFormSubmit}
        initialValues={editingAsset ? assetToFormData(editingAsset) : createDefaults}
        lockAssetTag={!!editingAsset}
        title={editingAsset ? 'Edit asset' : 'Add asset'}
        submitLabel={editingAsset ? 'Save' : 'Create'}
      />

      <AssetControlDialog
        asset={selectedAsset}
        open={controlOpen}
        onClose={() => { setControlOpen(false); setSelectedAsset(null); }}
        onChanged={() => { fetchList(); fetchOverview(); fetchReports(); }}
        canManage={canManage}
        canApprove={canApprove}
      />

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete asset</DialogTitle>
        <DialogContent>
          <DialogContentText>This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteSubmitting}
            onClick={async () => {
              if (!deleteId) return;
              setDeleteSubmitting(true);
              try {
                await assetApi.remove(deleteId);
                fetchList();
                fetchOverview();
                fetchReports();
                setDeleteId(null);
              } finally {
                setDeleteSubmitting(false);
              }
            }}
          >
            {deleteSubmitting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
