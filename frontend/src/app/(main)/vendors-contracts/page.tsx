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
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type Vendor = {
  id: string;
  name: string;
  serviceCategory?: string | null;
  vendorType?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  supportContact?: string | null;
  website?: string | null;
  performanceScore: number;
  status: string;
  lastReviewDate?: string | null;
  nextReviewDate?: string | null;
  notes?: string | null;
};

type Contract = {
  id: string;
  vendorId: string;
  vendor?: { id: string; name: string } | null;
  contractNumber?: string | null;
  title: string;
  contractType?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  renewalNoticeDays: number;
  autoRenew: boolean;
  annualValue?: number | null;
  currency: string;
  slaTarget?: string | null;
  slaMetPercent?: number | null;
  penaltyClause?: string | null;
  owner?: string | null;
  documentUrl?: string | null;
  notes?: string | null;
};

type Stats = {
  totalVendors: number;
  activeVendors: number;
  activeContracts: number;
  expiringIn90Days: number;
  expiredContracts: number;
  averageSlaMetPercent: number;
  annualContractValue: number;
  lowPerformanceVendors: number;
};

type VendorForm = {
  name: string;
  serviceCategory: string;
  vendorType: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  supportContact: string;
  website: string;
  performanceScore: string;
  status: string;
  nextReviewDate: string;
  notes: string;
};

type ContractForm = {
  vendorId: string;
  contractNumber: string;
  title: string;
  contractType: string;
  status: string;
  startDate: string;
  endDate: string;
  renewalNoticeDays: string;
  autoRenew: string;
  annualValue: string;
  currency: string;
  slaTarget: string;
  slaMetPercent: string;
  owner: string;
  documentUrl: string;
  notes: string;
};

const EMPTY_VENDOR_FORM: VendorForm = {
  name: '',
  serviceCategory: '',
  vendorType: '',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  supportContact: '',
  website: '',
  performanceScore: '100',
  status: 'active',
  nextReviewDate: '',
  notes: '',
};

const EMPTY_CONTRACT_FORM: ContractForm = {
  vendorId: '',
  contractNumber: '',
  title: '',
  contractType: '',
  status: 'active',
  startDate: '',
  endDate: '',
  renewalNoticeDays: '90',
  autoRenew: 'false',
  annualValue: '',
  currency: 'NAD',
  slaTarget: '',
  slaMetPercent: '',
  owner: '',
  documentUrl: '',
  notes: '',
};

function toIsoDate(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function toInputDate(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function VendorsContractsPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'ict_manager';

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [vendorEditingId, setVendorEditingId] = useState<string | null>(null);
  const [contractEditingId, setContractEditingId] = useState<string | null>(null);
  const [vendorForm, setVendorForm] = useState<VendorForm>(EMPTY_VENDOR_FORM);
  const [contractForm, setContractForm] = useState<ContractForm>(EMPTY_CONTRACT_FORM);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vendorData, contractData, statData] = await Promise.all([
        api<Vendor[]>('/vendors-contracts/vendors'),
        api<Contract[]>('/vendors-contracts/contracts'),
        api<Stats>('/vendors-contracts/dashboard-stats'),
      ]);
      setVendors(vendorData);
      setContracts(contractData);
      setStats(statData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load vendors and contracts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const cards = useMemo(() => ([
    { label: 'Vendors', value: stats?.totalVendors ?? 0 },
    { label: 'Active Contracts', value: stats?.activeContracts ?? 0 },
    { label: 'Expiring in 90d', value: stats?.expiringIn90Days ?? 0 },
    { label: 'Expired Contracts', value: stats?.expiredContracts ?? 0 },
    { label: 'Avg SLA %', value: stats?.averageSlaMetPercent ?? 0 },
    { label: 'Annual Value', value: stats?.annualContractValue ?? 0 },
  ]), [stats]);

  const openVendorCreate = () => {
    setVendorEditingId(null);
    setVendorForm(EMPTY_VENDOR_FORM);
    setVendorDialogOpen(true);
  };

  const openVendorEdit = (vendor: Vendor) => {
    setVendorEditingId(vendor.id);
    setVendorForm({
      name: vendor.name ?? '',
      serviceCategory: vendor.serviceCategory ?? '',
      vendorType: vendor.vendorType ?? '',
      contactPerson: vendor.contactPerson ?? '',
      contactEmail: vendor.contactEmail ?? '',
      contactPhone: vendor.contactPhone ?? '',
      supportContact: vendor.supportContact ?? '',
      website: vendor.website ?? '',
      performanceScore: String(vendor.performanceScore ?? 100),
      status: vendor.status ?? 'active',
      nextReviewDate: toInputDate(vendor.nextReviewDate),
      notes: vendor.notes ?? '',
    });
    setVendorDialogOpen(true);
  };

  const openContractCreate = () => {
    setContractEditingId(null);
    setContractForm((prev) => ({ ...EMPTY_CONTRACT_FORM, vendorId: prev.vendorId || vendors[0]?.id || '' }));
    setContractDialogOpen(true);
  };

  const openContractEdit = (contract: Contract) => {
    setContractEditingId(contract.id);
    setContractForm({
      vendorId: contract.vendorId ?? '',
      contractNumber: contract.contractNumber ?? '',
      title: contract.title ?? '',
      contractType: contract.contractType ?? '',
      status: contract.status ?? 'active',
      startDate: toInputDate(contract.startDate),
      endDate: toInputDate(contract.endDate),
      renewalNoticeDays: String(contract.renewalNoticeDays ?? 90),
      autoRenew: contract.autoRenew ? 'true' : 'false',
      annualValue: contract.annualValue == null ? '' : String(contract.annualValue),
      currency: contract.currency ?? 'NAD',
      slaTarget: contract.slaTarget ?? '',
      slaMetPercent: contract.slaMetPercent == null ? '' : String(contract.slaMetPercent),
      owner: contract.owner ?? '',
      documentUrl: contract.documentUrl ?? '',
      notes: contract.notes ?? '',
    });
    setContractDialogOpen(true);
  };

  const saveVendor = async () => {
    if (!vendorForm.name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: vendorForm.name.trim(),
        serviceCategory: vendorForm.serviceCategory.trim() || undefined,
        vendorType: vendorForm.vendorType.trim() || undefined,
        contactPerson: vendorForm.contactPerson.trim() || undefined,
        contactEmail: vendorForm.contactEmail.trim() || undefined,
        contactPhone: vendorForm.contactPhone.trim() || undefined,
        supportContact: vendorForm.supportContact.trim() || undefined,
        website: vendorForm.website.trim() || undefined,
        performanceScore: Number(vendorForm.performanceScore) || 100,
        status: vendorForm.status,
        nextReviewDate: toIsoDate(vendorForm.nextReviewDate),
        notes: vendorForm.notes.trim() || undefined,
      };
      if (vendorEditingId) {
        await api(`/vendors-contracts/vendors/${vendorEditingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/vendors-contracts/vendors', { method: 'POST', body: JSON.stringify(payload) });
      }
      setVendorDialogOpen(false);
      setVendorEditingId(null);
      setVendorForm(EMPTY_VENDOR_FORM);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const saveContract = async () => {
    if (!contractForm.vendorId || !contractForm.title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        vendorId: contractForm.vendorId,
        contractNumber: contractForm.contractNumber.trim() || undefined,
        title: contractForm.title.trim(),
        contractType: contractForm.contractType.trim() || undefined,
        status: contractForm.status,
        startDate: toIsoDate(contractForm.startDate),
        endDate: toIsoDate(contractForm.endDate),
        renewalNoticeDays: Number(contractForm.renewalNoticeDays) || 90,
        autoRenew: contractForm.autoRenew === 'true',
        annualValue: contractForm.annualValue === '' ? undefined : Number(contractForm.annualValue),
        currency: contractForm.currency.trim() || 'NAD',
        slaTarget: contractForm.slaTarget.trim() || undefined,
        slaMetPercent: contractForm.slaMetPercent === '' ? undefined : Number(contractForm.slaMetPercent),
        owner: contractForm.owner.trim() || undefined,
        documentUrl: contractForm.documentUrl.trim() || undefined,
        notes: contractForm.notes.trim() || undefined,
      };
      if (contractEditingId) {
        await api(`/vendors-contracts/contracts/${contractEditingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/vendors-contracts/contracts', { method: 'POST', body: JSON.stringify(payload) });
      }
      setContractDialogOpen(false);
      setContractEditingId(null);
      setContractForm(EMPTY_CONTRACT_FORM);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save contract');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteVendor = async (id: string) => {
    if (!window.confirm('Delete this vendor? Related contracts will also be removed.')) return;
    setSubmitting(true);
    setError(null);
    try {
      await api(`/vendors-contracts/vendors/${id}`, { method: 'DELETE' });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteContract = async (id: string) => {
    if (!window.confirm('Delete this contract?')) return;
    setSubmitting(true);
    setError(null);
    try {
      await api(`/vendors-contracts/contracts/${id}`, { method: 'DELETE' });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete contract');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Vendors & Contracts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vendor portfolio, contract lifecycle, SLA performance, and renewal control.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {cards.map((card) => (
          <Grid item xs={6} md={4} lg={2} key={card.label}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                  {card.label}
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {loading ? '...' : card.value}
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
                <Typography variant="h6">Vendors</Typography>
                {isManager && (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={openVendorCreate}>
                    Add vendor
                  </Button>
                )}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Performance</TableCell>
                      <TableCell>Contact</TableCell>
                      {isManager && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vendors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isManager ? 6 : 5} align="center">
                          No vendors yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell>{vendor.name}</TableCell>
                          <TableCell>{vendor.serviceCategory || '-'}</TableCell>
                          <TableCell>
                            <Chip size="small" label={vendor.status} color={vendor.status === 'active' ? 'success' : 'default'} />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={`${vendor.performanceScore ?? 0}`}
                              color={(vendor.performanceScore ?? 0) < 60 ? 'error' : (vendor.performanceScore ?? 0) < 80 ? 'warning' : 'success'}
                            />
                          </TableCell>
                          <TableCell>{vendor.contactEmail || vendor.contactPerson || '-'}</TableCell>
                          {isManager && (
                            <TableCell align="right">
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => openVendorEdit(vendor)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => void deleteVendor(vendor.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">Contracts</Typography>
                {isManager && (
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={openContractCreate}>
                    Add contract
                  </Button>
                )}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                      <TableCell>Contract</TableCell>
                      <TableCell>Vendor</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>SLA %</TableCell>
                      <TableCell>Annual Value</TableCell>
                      {isManager && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contracts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isManager ? 7 : 6} align="center">
                          No contracts yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      contracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{contract.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{contract.contractNumber || '-'}</Typography>
                          </TableCell>
                          <TableCell>{contract.vendor?.name || vendors.find((v) => v.id === contract.vendorId)?.name || '-'}</TableCell>
                          <TableCell>{contract.status}</TableCell>
                          <TableCell>{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{contract.slaMetPercent ?? '-'}</TableCell>
                          <TableCell>{contract.annualValue == null ? '-' : `${contract.currency} ${contract.annualValue}`}</TableCell>
                          {isManager && (
                            <TableCell align="right">
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => openContractEdit(contract)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => void deleteContract(contract.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={vendorDialogOpen} onClose={() => !submitting && setVendorDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{vendorEditingId ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField label="Name" required fullWidth value={vendorForm.name} onChange={(e) => setVendorForm((prev) => ({ ...prev, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Service category" fullWidth value={vendorForm.serviceCategory} onChange={(e) => setVendorForm((prev) => ({ ...prev, serviceCategory: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Vendor type" fullWidth value={vendorForm.vendorType} onChange={(e) => setVendorForm((prev) => ({ ...prev, vendorType: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Contact person" fullWidth value={vendorForm.contactPerson} onChange={(e) => setVendorForm((prev) => ({ ...prev, contactPerson: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Contact email" fullWidth value={vendorForm.contactEmail} onChange={(e) => setVendorForm((prev) => ({ ...prev, contactEmail: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Contact phone" fullWidth value={vendorForm.contactPhone} onChange={(e) => setVendorForm((prev) => ({ ...prev, contactPhone: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Support contact" fullWidth value={vendorForm.supportContact} onChange={(e) => setVendorForm((prev) => ({ ...prev, supportContact: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Website" fullWidth value={vendorForm.website} onChange={(e) => setVendorForm((prev) => ({ ...prev, website: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField label="Performance" type="number" fullWidth value={vendorForm.performanceScore} onChange={(e) => setVendorForm((prev) => ({ ...prev, performanceScore: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select label="Status" fullWidth value={vendorForm.status} onChange={(e) => setVendorForm((prev) => ({ ...prev, status: e.target.value }))}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField type="date" label="Next review" fullWidth InputLabelProps={{ shrink: true }} value={vendorForm.nextReviewDate} onChange={(e) => setVendorForm((prev) => ({ ...prev, nextReviewDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" fullWidth multiline minRows={2} value={vendorForm.notes} onChange={(e) => setVendorForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVendorDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={() => void saveVendor()} variant="contained" disabled={submitting || !vendorForm.name.trim()}>
            {vendorEditingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={contractDialogOpen} onClose={() => !submitting && setContractDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{contractEditingId ? 'Edit Contract' : 'Add Contract'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField select label="Vendor" required fullWidth value={contractForm.vendorId} onChange={(e) => setContractForm((prev) => ({ ...prev, vendorId: e.target.value }))}>
                {vendors.map((vendor) => (
                  <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Title" required fullWidth value={contractForm.title} onChange={(e) => setContractForm((prev) => ({ ...prev, title: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Contract no." fullWidth value={contractForm.contractNumber} onChange={(e) => setContractForm((prev) => ({ ...prev, contractNumber: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Type" fullWidth value={contractForm.contractType} onChange={(e) => setContractForm((prev) => ({ ...prev, contractType: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select label="Status" fullWidth value={contractForm.status} onChange={(e) => setContractForm((prev) => ({ ...prev, status: e.target.value }))}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="expiring">Expiring</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="terminated">Terminated</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Owner" fullWidth value={contractForm.owner} onChange={(e) => setContractForm((prev) => ({ ...prev, owner: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField type="date" label="Start date" fullWidth InputLabelProps={{ shrink: true }} value={contractForm.startDate} onChange={(e) => setContractForm((prev) => ({ ...prev, startDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField type="date" label="End date" fullWidth InputLabelProps={{ shrink: true }} value={contractForm.endDate} onChange={(e) => setContractForm((prev) => ({ ...prev, endDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField type="number" label="Renewal days" fullWidth value={contractForm.renewalNoticeDays} onChange={(e) => setContractForm((prev) => ({ ...prev, renewalNoticeDays: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select label="Auto renew" fullWidth value={contractForm.autoRenew} onChange={(e) => setContractForm((prev) => ({ ...prev, autoRenew: e.target.value }))}>
                <MenuItem value="false">No</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField label="Currency" fullWidth value={contractForm.currency} onChange={(e) => setContractForm((prev) => ({ ...prev, currency: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField type="number" label="Annual value" fullWidth value={contractForm.annualValue} onChange={(e) => setContractForm((prev) => ({ ...prev, annualValue: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField type="number" label="SLA met %" fullWidth value={contractForm.slaMetPercent} onChange={(e) => setContractForm((prev) => ({ ...prev, slaMetPercent: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="SLA target" fullWidth value={contractForm.slaTarget} onChange={(e) => setContractForm((prev) => ({ ...prev, slaTarget: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Document URL" fullWidth value={contractForm.documentUrl} onChange={(e) => setContractForm((prev) => ({ ...prev, documentUrl: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" fullWidth multiline minRows={2} value={contractForm.notes} onChange={(e) => setContractForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContractDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={() => void saveContract()} variant="contained" disabled={submitting || !contractForm.vendorId || !contractForm.title.trim()}>
            {contractEditingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

