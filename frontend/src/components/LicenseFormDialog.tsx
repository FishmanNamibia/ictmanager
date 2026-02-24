'use client';

import { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, Divider, Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

export const LICENSE_TYPES = [
  { value: 'subscription', label: 'Subscription' },
  { value: 'per_user', label: 'Per User' },
  { value: 'per_device', label: 'Per Device' },
  { value: 'concurrent', label: 'Concurrent' },
  { value: 'perpetual', label: 'Perpetual' },
  { value: 'site', label: 'Site License' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'oem', label: 'OEM' },
];

export const SOFTWARE_CATEGORIES = [
  { value: 'productivity', label: 'Productivity (Office, Email)' },
  { value: 'os', label: 'Operating System' },
  { value: 'security', label: 'Security & Antivirus' },
  { value: 'erp', label: 'ERP / Finance' },
  { value: 'database', label: 'Database' },
  { value: 'development', label: 'Development Tools' },
  { value: 'communication', label: 'Communication & Collaboration' },
  { value: 'other', label: 'Other' },
];

export const CRITICALITIES = [
  { value: 'high', label: 'High – Mission Critical' },
  { value: 'medium', label: 'Medium – Important' },
  { value: 'low', label: 'Low – Non-Critical' },
];

export const CURRENCIES = [
  { value: 'NAD', label: 'NAD – Namibian Dollar' },
  { value: 'USD', label: 'USD – US Dollar' },
  { value: 'ZAR', label: 'ZAR – South African Rand' },
  { value: 'EUR', label: 'EUR – Euro' },
  { value: 'GBP', label: 'GBP – British Pound' },
];

export type LicenseFormData = {
  softwareName: string;
  softwareCategory: string;
  version: string;
  vendor: string;
  licenseType: string;
  licenseKey: string;
  contractRef: string;
  procurementRef: string;
  purchaseDate: string;
  startDate: string;
  expiryDate: string;
  supportEndDate: string;
  totalSeats: string;
  usedSeats: string;
  costPerSeat: string;
  currency: string;
  businessOwner: string;
  ictOwner: string;
  criticality: string;
  notes: string;
};

const empty: LicenseFormData = {
  softwareName: '',
  softwareCategory: '',
  version: '',
  vendor: '',
  licenseType: 'subscription',
  licenseKey: '',
  contractRef: '',
  procurementRef: '',
  purchaseDate: '',
  startDate: '',
  expiryDate: '',
  supportEndDate: '',
  totalSeats: '1',
  usedSeats: '0',
  costPerSeat: '',
  currency: 'NAD',
  businessOwner: '',
  ictOwner: '',
  criticality: 'medium',
  notes: '',
};

function Section({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
          textTransform="uppercase" letterSpacing={0.8} display="block" sx={{ mt: 0.5 }}>
          {children}
        </Typography>
        <Divider sx={{ mt: 0.5 }} />
      </Grid>
    </>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LicenseFormData) => Promise<void>;
  initialValues?: Partial<LicenseFormData> | null;
  title: string;
  submitLabel: string;
};

export default function LicenseFormDialog({ open, onClose, onSubmit, initialValues, title, submitLabel }: Props) {
  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<LicenseFormData>({
    defaultValues: { ...empty, ...initialValues },
  });

  const watchedSeats = watch('totalSeats');
  const watchedUsed = watch('usedSeats');
  const watchedCostPerSeat = watch('costPerSeat');

  const seatsAvailable = (parseInt(watchedSeats) || 0) - (parseInt(watchedUsed) || 0);
  const totalCost = (() => {
    const seats = parseInt(watchedSeats) || 0;
    const cps = parseFloat(watchedCostPerSeat) || 0;
    if (!seats || !cps) return null;
    return seats * cps;
  })();

  useEffect(() => {
    if (open) reset({ ...empty, ...initialValues });
  }, [open, initialValues, reset]);

  const handleClose = () => { reset({ ...empty, ...initialValues }); onClose(); };
  const doSubmit = async (data: LicenseFormData) => { await onSubmit(data); handleClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(doSubmit)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>

            {/* ── Software Identity ── */}
            <Section>Software Identity</Section>

            <Grid item xs={12} sm={6}>
              <Controller name="softwareName" control={control} rules={{ required: 'Software name is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Software Name *" fullWidth error={!!errors.softwareName}
                    helperText={errors.softwareName?.message} placeholder="e.g. Microsoft 365 E3" />
                )} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller name="softwareCategory" control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Category" fullWidth>
                    <MenuItem value=""><em>Select…</em></MenuItem>
                    {SOFTWARE_CATEGORIES.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                )} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller name="version" control={control}
                render={({ field }) => <TextField {...field} label="Version" fullWidth placeholder="e.g. 2021 / E3 / v12" />} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller name="vendor" control={control}
                render={({ field }) => <TextField {...field} label="Vendor / Publisher" fullWidth placeholder="e.g. Microsoft, Adobe" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="licenseType" control={control}
                render={({ field }) => (
                  <TextField {...field} select label="License Type" fullWidth>
                    {LICENSE_TYPES.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="criticality" control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Criticality" fullWidth>
                    {CRITICALITIES.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                )} />
            </Grid>

            {/* ── License Key & Contracts ── */}
            <Section>License Key &amp; Contract</Section>

            <Grid item xs={12} sm={6}>
              <Controller name="licenseKey" control={control}
                render={({ field }) => <TextField {...field} label="License Key / Serial" fullWidth
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX" inputProps={{ style: { fontFamily: 'monospace' } }} />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller name="contractRef" control={control}
                render={({ field }) => <TextField {...field} label="Contract Reference" fullWidth placeholder="e.g. MSA-2024-001" />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller name="procurementRef" control={control}
                render={({ field }) => <TextField {...field} label="PO / Procurement Ref" fullWidth placeholder="e.g. PO-2024-0055" />} />
            </Grid>

            {/* ── Dates ── */}
            <Section>Dates &amp; Term</Section>

            <Grid item xs={12} sm={3}>
              <Controller name="purchaseDate" control={control}
                render={({ field }) => <TextField {...field} label="Purchase Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller name="startDate" control={control}
                render={({ field }) => <TextField {...field} label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller name="expiryDate" control={control}
                render={({ field }) => <TextField {...field} label="Expiry Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller name="supportEndDate" control={control}
                render={({ field }) => <TextField {...field} label="Support End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
            </Grid>

            {/* ── Seat Allocation ── */}
            <Section>Seat Allocation</Section>

            <Grid item xs={12} sm={4}>
              <Controller name="totalSeats" control={control} rules={{ required: 'Required', min: { value: 1, message: 'Min 1' } }}
                render={({ field }) => (
                  <TextField {...field} label="Seats Purchased *" type="number" fullWidth
                    inputProps={{ min: 1, step: 1 }} error={!!errors.totalSeats} helperText={errors.totalSeats?.message} />
                )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="usedSeats" control={control}
                render={({ field }) => (
                  <TextField {...field} label="Seats Assigned" type="number" fullWidth inputProps={{ min: 0, step: 1 }} />
                )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Seats Available"
                fullWidth
                disabled
                value={isNaN(seatsAvailable) ? '—' : seatsAvailable}
                helperText="Purchased minus Assigned"
                InputProps={{ readOnly: true }}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: seatsAvailable < 0 ? '#d32f2f' : seatsAvailable === 0 ? '#ed6c02' : '#2e7d32',
                    fontWeight: 700,
                  },
                }}
              />
            </Grid>

            {/* ── Financial ── */}
            <Section>Financial</Section>

            <Grid item xs={12} sm={4}>
              <Controller name="costPerSeat" control={control}
                render={({ field }) => (
                  <TextField {...field} label="Cost per Seat" type="number" fullWidth inputProps={{ min: 0, step: 0.01 }}
                    helperText="Total cost = cost × seats (auto)" />
                )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller name="currency" control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Currency" fullWidth>
                    {CURRENCIES.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                )} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Total Cost"
                fullWidth
                disabled
                value={
                  totalCost != null
                    ? new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', maximumFractionDigits: 2 }).format(totalCost)
                    : '—'
                }
                helperText="Cost per seat × seats purchased"
                InputProps={{ readOnly: true }}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: totalCost != null ? '#1565c0' : undefined,
                    fontWeight: totalCost != null ? 700 : undefined,
                  },
                }}
              />
            </Grid>

            {/* ── Ownership ── */}
            <Section>Ownership &amp; Responsibility</Section>

            <Grid item xs={12} sm={6}>
              <Controller name="businessOwner" control={control}
                render={({ field }) => <TextField {...field} label="Business Owner (Directorate / Unit)" fullWidth
                  placeholder="e.g. Office of the CEO" />} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="ictOwner" control={control}
                render={({ field }) => <TextField {...field} label="ICT Owner (Responsible Officer)" fullWidth
                  placeholder="e.g. John Ndapewa" />} />
            </Grid>

            {/* ── Notes ── */}
            <Section>Notes</Section>
            <Grid item xs={12}>
              <Controller name="notes" control={control}
                render={({ field }) => (
                  <TextField {...field} label="Notes" fullWidth multiline rows={3}
                    placeholder="Renewal instructions, special conditions, audit notes…" />
                )} />
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
