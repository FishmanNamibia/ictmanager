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
import { useForm, Controller, useWatch } from 'react-hook-form';

const ASSET_TYPES = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'network', label: 'Network' },
  { value: 'peripheral', label: 'Peripheral' },
];

const ASSET_SUBTYPES = [
  { value: '', label: 'Not specified' },
  { value: 'ups', label: 'UPS' },
  { value: 'server', label: 'Server' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'printer', label: 'Printer' },
  { value: 'switch', label: 'Switch' },
  { value: 'router', label: 'Router' },
  { value: 'other', label: 'Other' },
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
  barcode: string;
  name: string;
  description: string;
  type: string;
  assetSubtype: string;
  status: string;
  condition: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  ipAddress: string;
  purchaseDate: string;
  warrantyEnd: string;
  expectedEndOfLife: string;
  cost: string;
  usefulLifeMonths: string;
  supplier: string;
  maintenanceProvider: string;
  maintenanceFrequencyMonths: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceContractEnd: string;
  poNumber: string;
  batteryInstallDate: string;
  batteryReplacementDue: string;
  loadCapacityKva: string;
  runtimeMinutes: string;
  protectedSystems: string;
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
  lockAssetTag?: boolean;
  title: string;
  submitLabel: string;
};

const emptyForm: AssetFormData = {
  assetTag: '',
  barcode: '',
  name: '',
  description: '',
  type: 'hardware',
  assetSubtype: '',
  status: 'active',
  condition: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  ipAddress: '',
  purchaseDate: '',
  warrantyEnd: '',
  expectedEndOfLife: '',
  cost: '',
  usefulLifeMonths: '',
  supplier: '',
  maintenanceProvider: '',
  maintenanceFrequencyMonths: '',
  lastMaintenanceDate: '',
  nextMaintenanceDate: '',
  maintenanceContractEnd: '',
  poNumber: '',
  batteryInstallDate: '',
  batteryReplacementDue: '',
  loadCapacityKva: '',
  runtimeMinutes: '',
  protectedSystems: '',
  assignedToName: '',
  assignedToDepartment: '',
  location: '',
  notes: '',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Grid item xs={12}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.8}>
        {children}
      </Typography>
      <Divider sx={{ mt: 0.5 }} />
    </Grid>
  );
}

export default function AssetFormDialog({
  open,
  onClose,
  onSubmit,
  initialValues,
  lockAssetTag = false,
  title,
  submitLabel,
}: AssetFormDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormData>({
    defaultValues: { ...emptyForm, ...initialValues },
  });

  const assetSubtype = useWatch({ control, name: 'assetSubtype' });
  const barcode = useWatch({ control, name: 'barcode' });

  useEffect(() => {
    if (open) reset({ ...emptyForm, ...initialValues });
  }, [open, initialValues, reset]);

  useEffect(() => {
    if (!open || !barcode || lockAssetTag) return;
    if (!getValues('assetTag')) {
      setValue('assetTag', barcode, { shouldDirty: true });
    }
  }, [barcode, getValues, lockAssetTag, open, setValue]);

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
            <SectionLabel>Basic Information</SectionLabel>

            <Grid item xs={12} sm={6}>
              <Controller
                name="barcode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Barcode / Scan Code"
                    fullWidth
                    autoFocus={!lockAssetTag}
                    helperText="Scanner-gun input can be captured directly here."
                  />
                )}
              />
            </Grid>

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
                    disabled={lockAssetTag}
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
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => <TextField {...field} label="Description" fullWidth multiline rows={2} />}
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
                name="assetSubtype"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Asset Subtype" fullWidth>
                    {ASSET_SUBTYPES.map((o) => (
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

            <SectionLabel>Device Details</SectionLabel>

            <Grid item xs={12} sm={4}>
              <Controller name="manufacturer" control={control} render={({ field }) => <TextField {...field} label="Manufacturer" fullWidth />} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller name="model" control={control} render={({ field }) => <TextField {...field} label="Model" fullWidth />} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller name="serialNumber" control={control} render={({ field }) => <TextField {...field} label="Serial Number" fullWidth />} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller name="ipAddress" control={control} render={({ field }) => <TextField {...field} label="IP Address" fullWidth />} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller name="location" control={control} render={({ field }) => <TextField {...field} label="Physical Location" fullWidth />} />
            </Grid>

            <SectionLabel>Purchase, Support &amp; Lifecycle</SectionLabel>

            <Grid item xs={12} sm={4}>
              <Controller name="supplier" control={control} render={({ field }) => <TextField {...field} label="Supplier / Vendor" fullWidth />} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller name="poNumber" control={control} render={({ field }) => <TextField {...field} label="PO / Invoice Number" fullWidth />} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="cost"
                control={control}
                render={({ field }) => <TextField {...field} label="Purchase Cost" type="number" fullWidth inputProps={{ step: 0.01, min: 0 }} />}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="usefulLifeMonths"
                control={control}
                render={({ field }) => <TextField {...field} label="Useful Life (Months)" type="number" fullWidth inputProps={{ min: 1 }} />}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller name="purchaseDate" control={control} render={({ field }) => <TextField {...field} label="Purchase Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller name="warrantyEnd" control={control} render={({ field }) => <TextField {...field} label="Warranty Expiry" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller name="expectedEndOfLife" control={control} render={({ field }) => <TextField {...field} label="Expected End of Life" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller name="maintenanceProvider" control={control} render={({ field }) => <TextField {...field} label="Maintenance Provider" fullWidth />} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="maintenanceFrequencyMonths"
                control={control}
                render={({ field }) => <TextField {...field} label="Maintenance Frequency (Months)" type="number" fullWidth inputProps={{ min: 1 }} />}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller name="maintenanceContractEnd" control={control} render={({ field }) => <TextField {...field} label="Maintenance Contract End" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller name="lastMaintenanceDate" control={control} render={({ field }) => <TextField {...field} label="Last Maintenance Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller name="nextMaintenanceDate" control={control} render={({ field }) => <TextField {...field} label="Next Maintenance Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
            </Grid>

            {assetSubtype === 'ups' && (
              <>
                <SectionLabel>UPS Maintenance &amp; Renewal</SectionLabel>

                <Grid item xs={12} sm={4}>
                  <Controller name="batteryInstallDate" control={control} render={({ field }) => <TextField {...field} label="Battery Install Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Controller name="batteryReplacementDue" control={control} render={({ field }) => <TextField {...field} label="Battery Replacement Due" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Controller
                    name="loadCapacityKva"
                    control={control}
                    render={({ field }) => <TextField {...field} label="Load Capacity (kVA)" type="number" fullWidth inputProps={{ step: 0.01, min: 0 }} />}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Controller
                    name="runtimeMinutes"
                    control={control}
                    render={({ field }) => <TextField {...field} label="Runtime (Minutes)" type="number" fullWidth inputProps={{ min: 0 }} />}
                  />
                </Grid>

                <Grid item xs={12} sm={8}>
                  <Controller
                    name="protectedSystems"
                    control={control}
                    render={({ field }) => <TextField {...field} label="Protected Systems" fullWidth placeholder="Core switch, firewall, storage, virtualization host" />}
                  />
                </Grid>
              </>
            )}

            <SectionLabel>Assignment</SectionLabel>

            <Grid item xs={12} sm={4}>
              <Controller name="assignedToName" control={control} render={({ field }) => <TextField {...field} label="Assigned To" fullWidth />} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller name="assignedToDepartment" control={control} render={({ field }) => <TextField {...field} label="Department" fullWidth />} />
            </Grid>

            <SectionLabel>Notes</SectionLabel>

            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => <TextField {...field} label="Notes" fullWidth multiline rows={3} />}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
