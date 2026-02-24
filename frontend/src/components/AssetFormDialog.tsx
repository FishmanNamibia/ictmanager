'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Divider,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

const ASSET_TYPES = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'network', label: 'Network' },
  { value: 'peripheral', label: 'Peripheral' },
];

const ASSET_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'in_use', label: 'In Use' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
  { value: 'disposed', label: 'Disposed' },
];

const ASSET_CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'damaged', label: 'Damaged' },
];

export type AssetFormData = {
  assetTag: string;
  name: string;
  type: string;
  status: string;
  condition: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  ipAddress: string;
  purchaseDate: string;
  warrantyEnd: string;
  cost: string;
  supplier: string;
  poNumber: string;
  assignedToName: string;
  assignedToDepartment: string;
  location: string;
  notes: string;
};

type AssetFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AssetFormData) => Promise<void>;
  initialValues?: Partial<AssetFormData> | null;
  title: string;
  submitLabel: string;
};

const emptyForm: AssetFormData = {
  assetTag: '',
  name: '',
  type: 'hardware',
  status: 'active',
  condition: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  ipAddress: '',
  purchaseDate: '',
  warrantyEnd: '',
  cost: '',
  supplier: '',
  poNumber: '',
  assignedToName: '',
  assignedToDepartment: '',
  location: '',
  notes: '',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.8}>
          {children}
        </Typography>
        <Divider sx={{ mt: 0.5 }} />
      </Grid>
    </>
  );
}

export default function AssetFormDialog({
  open,
  onClose,
  onSubmit,
  initialValues,
  title,
  submitLabel,
}: AssetFormDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormData>({
    defaultValues: { ...emptyForm, ...initialValues },
  });

  useEffect(() => {
    if (open) reset({ ...emptyForm, ...initialValues });
  }, [open, initialValues, reset]);

  const handleClose = () => {
    reset({ ...emptyForm, ...initialValues });
    onClose();
  };

  const doSubmit = async (data: AssetFormData) => {
    await onSubmit(data);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(doSubmit)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>

            {/* ── Basic Information ── */}
            <SectionLabel>Basic Information</SectionLabel>

            <Grid item xs={12} sm={6}>
              <Controller
                name="assetTag"
                control={control}
                rules={{ required: 'Asset tag is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Asset Tag *"
                    fullWidth
                    error={!!errors.assetTag}
                    helperText={errors.assetTag?.message}
                    disabled={!!initialValues?.assetTag}
                    placeholder="e.g. NSA/LAP/001"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Asset Name *"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    placeholder="e.g. Dell Latitude 5520"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Type" fullWidth>
                    {ASSET_TYPES.map((o) => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Status" fullWidth>
                    {ASSET_STATUSES.map((o) => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="condition"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Condition" fullWidth>
                    <MenuItem value=""><em>Not specified</em></MenuItem>
                    {ASSET_CONDITIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* ── Hardware / Device Details ── */}
            <SectionLabel>Device Details</SectionLabel>

            <Grid item xs={12} sm={4}>
              <Controller
                name="manufacturer"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Manufacturer" fullWidth placeholder="e.g. Dell, HP, Cisco" />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="model"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Model" fullWidth placeholder="e.g. Latitude 5520" />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="serialNumber"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Serial Number" fullWidth placeholder="Device serial number" />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="ipAddress"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="IP Address" fullWidth placeholder="e.g. 192.168.1.100" />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Physical Location" fullWidth placeholder="e.g. Head Office – Room 3B" />
                )}
              />
            </Grid>

            {/* ── Purchase & Financial ── */}
            <SectionLabel>Purchase &amp; Financial</SectionLabel>

            <Grid item xs={12} sm={4}>
              <Controller
                name="supplier"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Supplier / Vendor" fullWidth placeholder="e.g. Namibia Computer Warehouse" />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="poNumber"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="PO / Invoice Number" fullWidth placeholder="e.g. PO-2024-00123" />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="cost"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Purchase Cost (NAD)"
                    type="number"
                    fullWidth
                    inputProps={{ step: 0.01, min: 0 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="purchaseDate"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Purchase Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="warrantyEnd"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Warranty Expiry Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
                )}
              />
            </Grid>

            {/* ── Assignment ── */}
            <SectionLabel>Assignment</SectionLabel>

            <Grid item xs={12} sm={4}>
              <Controller
                name="assignedToName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Assigned To (Person)" fullWidth placeholder="e.g. John Ndapewa" />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="assignedToDepartment"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Department" fullWidth placeholder="e.g. ICT, Finance" />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              {/* spacer — keep grid balanced */}
            </Grid>

            {/* ── Notes ── */}
            <SectionLabel>Notes</SectionLabel>

            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Any additional information about this asset…"
                  />
                )}
              />
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
