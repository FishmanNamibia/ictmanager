'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  assetApi,
  AssetAuditRecord,
  AssetDocumentRecord,
  AssetMovementRecord,
  AssetRecord,
  AssetVerificationRecord,
  apiUpload,
  getApiBaseUrl,
} from '@/lib/api';

type Props = {
  asset: AssetRecord | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
  canManage: boolean;
  canApprove: boolean;
};

const MOVEMENT_TYPES = ['stock_in', 'stock_out', 'transfer', 'return', 'adjustment', 'damaged', 'lost', 'disposal', 'maintenance'];
const ASSET_STATUSES = ['active', 'in_use', 'maintenance', 'retired', 'disposed'];
const ASSET_CONDITIONS = ['new', 'good', 'fair', 'poor', 'damaged'];
const DOCUMENT_TYPES = ['invoice', 'delivery_note', 'handover_form', 'disposal_approval', 'warranty', 'audit_report', 'image', 'other'];
const VERIFICATION_TYPES = ['spot_check', 'stock_take', 'handover'];

function fmtDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}

function auditActor(entry: AssetAuditRecord) {
  const name = entry.metadata && typeof entry.metadata.actorName === 'string' ? entry.metadata.actorName : null;
  return name || entry.userId || 'System';
}

export default function AssetControlDialog({ asset, open, onClose, onChanged, canManage, canApprove }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [movements, setMovements] = useState<AssetMovementRecord[]>([]);
  const [verifications, setVerifications] = useState<AssetVerificationRecord[]>([]);
  const [documents, setDocuments] = useState<AssetDocumentRecord[]>([]);
  const [history, setHistory] = useState<AssetAuditRecord[]>([]);
  const [movementForm, setMovementForm] = useState({
    movementType: 'transfer',
    toLocation: '',
    toAssignedToName: '',
    toDepartment: '',
    newStatus: '',
    newCondition: '',
    reason: '',
    notes: '',
    approvalRequired: false,
  });
  const [verificationForm, setVerificationForm] = useState({
    verificationType: 'spot_check',
    actualLocation: '',
    actualAssignedToName: '',
    actualDepartment: '',
    actualStatus: '',
    actualCondition: '',
    notes: '',
  });
  const [documentForm, setDocumentForm] = useState({
    documentType: 'invoice',
    title: '',
    referenceNumber: '',
    notes: '',
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const pendingMovements = useMemo(
    () => movements.filter((movement) => movement.approvalStatus === 'pending'),
    [movements],
  );

  const loadData = async () => {
    if (!asset) return;
    setLoading(true);
    setError(null);
    try {
      const [movementList, verificationList, documentList, historyList] = await Promise.all([
        assetApi.movements(asset.id),
        assetApi.verifications(asset.id),
        assetApi.documents(asset.id),
        assetApi.history(asset.id),
      ]);
      setMovements(movementList);
      setVerifications(verificationList);
      setDocuments(documentList);
      setHistory(historyList);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load asset controls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && asset) void loadData();
  }, [open, asset]);

  const handleMovementSubmit = async () => {
    if (!asset) return;
    await assetApi.createMovement(asset.id, {
      movementType: movementForm.movementType,
      toLocation: movementForm.toLocation || undefined,
      toAssignedToName: movementForm.toAssignedToName || undefined,
      toDepartment: movementForm.toDepartment || undefined,
      newStatus: movementForm.newStatus || undefined,
      newCondition: movementForm.newCondition || undefined,
      reason: movementForm.reason || undefined,
      notes: movementForm.notes || undefined,
      approvalRequired: movementForm.approvalRequired,
    });
    setMovementForm({
      movementType: 'transfer',
      toLocation: '',
      toAssignedToName: '',
      toDepartment: '',
      newStatus: '',
      newCondition: '',
      reason: '',
      notes: '',
      approvalRequired: false,
    });
    onChanged();
    await loadData();
  };

  const handleVerificationSubmit = async () => {
    if (!asset) return;
    await assetApi.createVerification(asset.id, {
      verificationType: verificationForm.verificationType,
      actualLocation: verificationForm.actualLocation || undefined,
      actualAssignedToName: verificationForm.actualAssignedToName || undefined,
      actualDepartment: verificationForm.actualDepartment || undefined,
      actualStatus: verificationForm.actualStatus || undefined,
      actualCondition: verificationForm.actualCondition || undefined,
      notes: verificationForm.notes || undefined,
    });
    setVerificationForm({
      verificationType: 'spot_check',
      actualLocation: '',
      actualAssignedToName: '',
      actualDepartment: '',
      actualStatus: '',
      actualCondition: '',
      notes: '',
    });
    await loadData();
  };

  const handleDocumentSubmit = async () => {
    if (!asset || !documentFile) return;
    const formData = new FormData();
    formData.append('file', documentFile);
    formData.append('documentType', documentForm.documentType);
    formData.append('title', documentForm.title);
    if (documentForm.referenceNumber) formData.append('referenceNumber', documentForm.referenceNumber);
    if (documentForm.notes) formData.append('notes', documentForm.notes);
    await apiUpload(`/assets/${asset.id}/documents`, formData);
    setDocumentForm({ documentType: 'invoice', title: '', referenceNumber: '', notes: '' });
    setDocumentFile(null);
    await loadData();
  };

  const handleDownload = async (doc: AssetDocumentRecord) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('iictms_token') : null;
    const response = await fetch(`${getApiBaseUrl()}/assets/${asset?.id}/documents/${doc.id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Failed to download document');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = doc.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Asset controls: {asset.assetTag} — {asset.name}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><Typography variant="caption" color="text.secondary">Location</Typography><Typography fontWeight={600}>{asset.location || 'Unassigned'}</Typography></Grid>
            <Grid item xs={12} md={3}><Typography variant="caption" color="text.secondary">Assigned To</Typography><Typography fontWeight={600}>{asset.assignedToName || 'Unassigned'}</Typography></Grid>
            <Grid item xs={12} md={3}><Typography variant="caption" color="text.secondary">Department</Typography><Typography fontWeight={600}>{asset.assignedToDepartment || '—'}</Typography></Grid>
            <Grid item xs={12} md={3}><Typography variant="caption" color="text.secondary">Status</Typography><Box><Chip size="small" label={asset.status.replace('_', ' ')} /></Box></Grid>
          </Grid>

          {canManage && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Record movement</Typography>
                <Stack spacing={1.5}>
                  <TextField select size="small" label="Movement Type" value={movementForm.movementType} onChange={(e) => setMovementForm((prev) => ({ ...prev, movementType: e.target.value }))}>
                    {MOVEMENT_TYPES.map((item) => <MenuItem key={item} value={item}>{item.replace('_', ' ')}</MenuItem>)}
                  </TextField>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}><TextField size="small" label="To Location" fullWidth value={movementForm.toLocation} onChange={(e) => setMovementForm((prev) => ({ ...prev, toLocation: e.target.value }))} /></Grid>
                    <Grid item xs={12} sm={6}><TextField size="small" label="To Assignee" fullWidth value={movementForm.toAssignedToName} onChange={(e) => setMovementForm((prev) => ({ ...prev, toAssignedToName: e.target.value }))} /></Grid>
                    <Grid item xs={12} sm={6}><TextField size="small" label="To Department" fullWidth value={movementForm.toDepartment} onChange={(e) => setMovementForm((prev) => ({ ...prev, toDepartment: e.target.value }))} /></Grid>
                    <Grid item xs={12} sm={3}><TextField select size="small" label="New Status" fullWidth value={movementForm.newStatus} onChange={(e) => setMovementForm((prev) => ({ ...prev, newStatus: e.target.value }))}><MenuItem value="">No change</MenuItem>{ASSET_STATUSES.map((item) => <MenuItem key={item} value={item}>{item.replace('_', ' ')}</MenuItem>)}</TextField></Grid>
                    <Grid item xs={12} sm={3}><TextField select size="small" label="Condition" fullWidth value={movementForm.newCondition} onChange={(e) => setMovementForm((prev) => ({ ...prev, newCondition: e.target.value }))}><MenuItem value="">No change</MenuItem>{ASSET_CONDITIONS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
                  </Grid>
                  <TextField size="small" label="Reason" value={movementForm.reason} onChange={(e) => setMovementForm((prev) => ({ ...prev, reason: e.target.value }))} />
                  <TextField size="small" label="Notes" multiline rows={2} value={movementForm.notes} onChange={(e) => setMovementForm((prev) => ({ ...prev, notes: e.target.value }))} />
                  <FormControlLabel control={<Checkbox checked={movementForm.approvalRequired} onChange={(e) => setMovementForm((prev) => ({ ...prev, approvalRequired: e.target.checked }))} />} label="Require manager approval before applying" />
                  <Box><Button variant="contained" onClick={() => void handleMovementSubmit()} disabled={loading}>Save movement</Button></Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Record verification / stock take</Typography>
                <Stack spacing={1.5}>
                  <TextField select size="small" label="Verification Type" value={verificationForm.verificationType} onChange={(e) => setVerificationForm((prev) => ({ ...prev, verificationType: e.target.value }))}>
                    {VERIFICATION_TYPES.map((item) => <MenuItem key={item} value={item}>{item.replace('_', ' ')}</MenuItem>)}
                  </TextField>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}><TextField size="small" label="Actual Location" fullWidth value={verificationForm.actualLocation} onChange={(e) => setVerificationForm((prev) => ({ ...prev, actualLocation: e.target.value }))} /></Grid>
                    <Grid item xs={12} sm={6}><TextField size="small" label="Actual Assignee" fullWidth value={verificationForm.actualAssignedToName} onChange={(e) => setVerificationForm((prev) => ({ ...prev, actualAssignedToName: e.target.value }))} /></Grid>
                    <Grid item xs={12} sm={6}><TextField size="small" label="Actual Department" fullWidth value={verificationForm.actualDepartment} onChange={(e) => setVerificationForm((prev) => ({ ...prev, actualDepartment: e.target.value }))} /></Grid>
                    <Grid item xs={12} sm={3}><TextField select size="small" label="Actual Status" fullWidth value={verificationForm.actualStatus} onChange={(e) => setVerificationForm((prev) => ({ ...prev, actualStatus: e.target.value }))}><MenuItem value="">As registered</MenuItem>{ASSET_STATUSES.map((item) => <MenuItem key={item} value={item}>{item.replace('_', ' ')}</MenuItem>)}</TextField></Grid>
                    <Grid item xs={12} sm={3}><TextField select size="small" label="Actual Condition" fullWidth value={verificationForm.actualCondition} onChange={(e) => setVerificationForm((prev) => ({ ...prev, actualCondition: e.target.value }))}><MenuItem value="">As registered</MenuItem>{ASSET_CONDITIONS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
                  </Grid>
                  <TextField size="small" label="Notes" multiline rows={2} value={verificationForm.notes} onChange={(e) => setVerificationForm((prev) => ({ ...prev, notes: e.target.value }))} />
                  <Box><Button variant="contained" onClick={() => void handleVerificationSubmit()} disabled={loading}>Save verification</Button></Box>
                </Stack>
              </Grid>
            </Grid>
          )}

          {canManage && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Attach document</Typography>
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} md={2}><TextField select size="small" label="Type" fullWidth value={documentForm.documentType} onChange={(e) => setDocumentForm((prev) => ({ ...prev, documentType: e.target.value }))}>{DOCUMENT_TYPES.map((item) => <MenuItem key={item} value={item}>{item.replace('_', ' ')}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={3}><TextField size="small" label="Title" fullWidth value={documentForm.title} onChange={(e) => setDocumentForm((prev) => ({ ...prev, title: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField size="small" label="Reference" fullWidth value={documentForm.referenceNumber} onChange={(e) => setDocumentForm((prev) => ({ ...prev, referenceNumber: e.target.value }))} /></Grid>
                <Grid item xs={12} md={3}><TextField size="small" label="Notes" fullWidth value={documentForm.notes} onChange={(e) => setDocumentForm((prev) => ({ ...prev, notes: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><Button component="label" variant="outlined" fullWidth>{documentFile ? documentFile.name : 'Select file'}<input hidden type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setDocumentFile(e.target.files?.[0] ?? null)} /></Button></Grid>
              </Grid>
              <Box mt={1}><Button variant="contained" onClick={() => void handleDocumentSubmit()} disabled={!documentFile || !documentForm.title}>Upload document</Button></Box>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Pending approvals</Typography>
            {pendingMovements.length === 0 ? (
              <Typography color="text.secondary">No pending movement approvals.</Typography>
            ) : (
              <Stack spacing={1}>
                {pendingMovements.map((movement) => (
                  <Box key={movement.id} display="flex" alignItems="center" justifyContent="space-between" gap={2} p={1.5} border="1px solid" borderColor="divider" borderRadius={1.5}>
                    <Box>
                      <Typography fontWeight={600}>{movement.movementType.replace('_', ' ')} requested by {movement.requestedByName || 'Unknown'}</Typography>
                      <Typography variant="body2" color="text.secondary">{movement.reason || movement.notes || 'No reason provided'}</Typography>
                    </Box>
                    {canApprove ? (
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" color="error" onClick={() => void assetApi.approveMovement(asset.id, movement.id, { approved: false }).then(loadData)}>Reject</Button>
                        <Button size="small" variant="contained" onClick={() => void assetApi.approveMovement(asset.id, movement.id, { approved: true }).then(() => { onChanged(); return loadData(); })}>Approve</Button>
                      </Stack>
                    ) : (
                      <Chip size="small" label="Pending manager action" color="warning" />
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Movement history</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>When</TableCell><TableCell>Type</TableCell><TableCell>Route</TableCell><TableCell>Status</TableCell><TableCell>Approval</TableCell></TableRow></TableHead>
              <TableBody>
                {movements.length === 0 ? <TableRow><TableCell colSpan={5} align="center">No movements recorded.</TableCell></TableRow> : movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{fmtDate(movement.occurredAt)}</TableCell>
                    <TableCell>{movement.movementType.replace('_', ' ')}</TableCell>
                    <TableCell>{`${movement.fromLocation || '—'} -> ${movement.toLocation || '—'}`}</TableCell>
                    <TableCell>{movement.newStatus || movement.fromStatus || '—'}</TableCell>
                    <TableCell><Chip size="small" label={movement.approvalStatus.replace('_', ' ')} color={movement.approvalStatus === 'pending' ? 'warning' : movement.approvalStatus === 'approved' ? 'success' : 'default'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Verification and variances</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>When</TableCell><TableCell>Type</TableCell><TableCell>Variance</TableCell><TableCell>Resolution</TableCell></TableRow></TableHead>
              <TableBody>
                {verifications.length === 0 ? <TableRow><TableCell colSpan={4} align="center">No verifications recorded.</TableCell></TableRow> : verifications.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell>{fmtDate(verification.checkedAt)}</TableCell>
                    <TableCell>{verification.verificationType.replace('_', ' ')}</TableCell>
                    <TableCell>{verification.varianceDetected ? verification.varianceSummary || 'Variance detected' : 'No variance'}</TableCell>
                    <TableCell>
                      {verification.varianceDetected && !verification.resolved && canManage ? (
                        <Button size="small" onClick={() => void assetApi.resolveVerification(asset.id, verification.id, { resolutionNote: 'Variance reviewed and accepted.' }).then(loadData)}>Mark resolved</Button>
                      ) : verification.resolved ? `Resolved ${fmtDate(verification.resolvedAt)}` : 'Open'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Supporting documents</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Type</TableCell><TableCell>Uploaded</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
              <TableBody>
                {documents.length === 0 ? <TableRow><TableCell colSpan={4} align="center">No supporting documents uploaded.</TableCell></TableRow> : documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>{document.title}</TableCell>
                    <TableCell>{document.documentType.replace('_', ' ')}</TableCell>
                    <TableCell>{fmtDate(document.createdAt)}</TableCell>
                    <TableCell align="right"><Button size="small" onClick={() => void handleDownload(document)}>Download</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Audit trail</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>When</TableCell><TableCell>Action</TableCell><TableCell>Actor</TableCell></TableRow></TableHead>
              <TableBody>
                {history.length === 0 ? <TableRow><TableCell colSpan={3} align="center">No audit records found.</TableCell></TableRow> : history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{fmtDate(entry.createdAt)}</TableCell>
                    <TableCell>{entry.action.replaceAll('.', ' ')}</TableCell>
                    <TableCell>{auditActor(entry)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
