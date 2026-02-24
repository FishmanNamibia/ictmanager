'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Skeleton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { api, apiUpload } from '@/lib/api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import AssetFormDialog, { AssetFormData } from '@/components/AssetFormDialog';

type Asset = {
  id: string;
  assetTag: string;
  name: string;
  type: string;
  status: string;
  condition: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  ipAddress: string | null;
  purchaseDate: string | null;
  warrantyEnd: string | null;
  cost: number | null;
  supplier: string | null;
  poNumber: string | null;
  assignedToName: string | null;
  assignedToDepartment: string | null;
  location: string | null;
  notes: string | null;
};

function assetToFormData(a: Asset): Partial<AssetFormData> {
  return {
    assetTag: a.assetTag,
    name: a.name,
    type: a.type,
    status: a.status,
    condition: a.condition ?? '',
    manufacturer: a.manufacturer ?? '',
    model: a.model ?? '',
    serialNumber: a.serialNumber ?? '',
    ipAddress: a.ipAddress ?? '',
    purchaseDate: a.purchaseDate ? a.purchaseDate.slice(0, 10) : '',
    warrantyEnd: a.warrantyEnd ? a.warrantyEnd.slice(0, 10) : '',
    cost: a.cost != null ? String(a.cost) : '',
    supplier: a.supplier ?? '',
    poNumber: a.poNumber ?? '',
    assignedToName: a.assignedToName ?? '',
    assignedToDepartment: a.assignedToDepartment ?? '',
    location: a.location ?? '',
    notes: a.notes ?? '',
  };
}

function formDataToPayload(data: AssetFormData): Record<string, unknown> {
  return {
    assetTag: data.assetTag.trim(),
    name: data.name.trim(),
    type: data.type,
    status: data.status,
    condition: data.condition || undefined,
    manufacturer: data.manufacturer.trim() || undefined,
    model: data.model.trim() || undefined,
    serialNumber: data.serialNumber.trim() || undefined,
    ipAddress: data.ipAddress.trim() || undefined,
    purchaseDate: data.purchaseDate || undefined,
    warrantyEnd: data.warrantyEnd || undefined,
    cost: data.cost ? parseFloat(data.cost) : undefined,
    supplier: data.supplier.trim() || undefined,
    poNumber: data.poNumber.trim() || undefined,
    assignedToName: data.assignedToName.trim() || undefined,
    assignedToDepartment: data.assignedToDepartment.trim() || undefined,
    location: data.location.trim() || undefined,
    notes: data.notes.trim() || undefined,
  };
}

export default function AssetsPage() {
  const [list, setList] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchList = useCallback(() => {
    setLoading(true);
    api<Asset[]>('/assets')
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleAdd = () => {
    setEditingAsset(null);
    setFormOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: AssetFormData) => {
    const payload = formDataToPayload(data);
    if (editingAsset) {
      await api(`/assets/${editingAsset.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/assets', { method: 'POST', body: JSON.stringify(payload) });
    }
    fetchList();
  };

  const handleDeleteClick = (id: string) => setDeleteId(id);
  const handleDeleteClose = () => { setDeleteId(null); };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteSubmitting(true);
    try {
      await api(`/assets/${deleteId}`, { method: 'DELETE' });
      fetchList();
      handleDeleteClose();
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const assetToDelete = deleteId ? list.find((a) => a.id === deleteId) : null;

  const handleDownloadTemplate = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').trim().replace(/\/$/, '') : '';
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
        if (result.created > 0) fetchList();
      } catch (err) {
        setImportResult({ created: 0, errors: [{ row: 0, message: err instanceof Error ? err.message : 'Import failed' }] });
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight={700}>
          Asset & software management
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}>
            Template
          </Button>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleImportClick} disabled={importing}>
            {importing ? 'Importing…' : 'Import from Excel'}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Add asset
          </Button>
        </Box>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Hardware inventory, warranty & lifecycle, assignment and cost tracking. Import from <strong>Excel (.xlsx, .xls) or CSV</strong> — compatible with Snipe-IT, Lansweeper, and other asset exports. Use a header row; columns such as <strong>Asset Tag</strong>, <strong>Name</strong>, Serial, Model Name, Category, Status Label, Location, Purchase Date, Purchase Cost, Assigned To, Notes are mapped automatically. If your export is &quot;Save as Web Page&quot; (.xls with no data), open it in Excel and <strong>Save As .xlsx or CSV</strong> first.
      </Typography>

      {importResult && (
        <Card variant="outlined" sx={{ mb: 2, bgcolor: importResult.errors.length > 0 ? 'action.hover' : 'success.50' }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Import result: <strong>{importResult.created} asset(s) created</strong>
              {importResult.errors.length > 0 && ` · ${importResult.errors.length} row(s) with errors`}
            </Typography>
            {importResult.errors.length > 0 && (
              <Box component="ul" sx={{ m: 0, pl: 2.5, mt: 1 }}>
                {importResult.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>
                    <Typography variant="body2">Row {e.row}: {e.message}</Typography>
                  </li>
                ))}
                {importResult.errors.length > 10 && (
                  <Typography variant="body2" color="text.secondary">… and {importResult.errors.length - 10} more</Typography>
                )}
              </Box>
            )}
            <Button size="small" sx={{ mt: 1 }} onClick={() => setImportResult(null)}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Skeleton variant="rectangular" height={200} />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tag</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Serial No.</TableCell>
                    <TableCell>Warranty Expiry</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center">
                        No assets yet. Click &quot;Add asset&quot; to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    list.map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{a.assetTag}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{a.name}</TableCell>
                        <TableCell>
                          <Chip label={a.type} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={a.status.replace('_', ' ')}
                            size="small"
                            color={
                              a.status === 'active' ? 'success'
                                : a.status === 'in_use' ? 'info'
                                : a.status === 'maintenance' ? 'warning'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {a.condition
                            ? <Chip label={a.condition} size="small" variant="outlined"
                                color={a.condition === 'new' || a.condition === 'good' ? 'success' : a.condition === 'damaged' || a.condition === 'poor' ? 'error' : 'default'} />
                            : '—'}
                        </TableCell>
                        <TableCell>{a.assignedToName ?? '—'}</TableCell>
                        <TableCell>{a.assignedToDepartment ?? '—'}</TableCell>
                        <TableCell>{a.location ?? '—'}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{a.serialNumber ?? '—'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {a.warrantyEnd
                            ? (() => {
                                const d = new Date(a.warrantyEnd);
                                const isExpired = d < new Date();
                                return (
                                  <Chip
                                    label={d.toLocaleDateString()}
                                    size="small"
                                    color={isExpired ? 'error' : 'default'}
                                    variant={isExpired ? 'filled' : 'outlined'}
                                  />
                                );
                              })()
                            : '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <IconButton size="small" onClick={() => handleEdit(a)} title="Edit">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteClick(a.id)} title="Delete" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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
        onClose={() => { setFormOpen(false); setEditingAsset(null); }}
        onSubmit={handleFormSubmit}
        initialValues={editingAsset ? assetToFormData(editingAsset) : null}
        title={editingAsset ? 'Edit asset' : 'Add asset'}
        submitLabel={editingAsset ? 'Save' : 'Create'}
      />

      <Dialog open={!!deleteId} onClose={handleDeleteClose}>
        <DialogTitle>Delete asset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {assetToDelete
              ? `Delete "${assetToDelete.name}" (${assetToDelete.assetTag})? This cannot be undone.`
              : 'Delete this asset?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteSubmitting}>
            {deleteSubmitting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
