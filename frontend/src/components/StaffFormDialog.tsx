'use client';

import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, Divider, Typography,
  Tabs, Tab, Box, FormControlLabel, Switch,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

// ── Options ──────────────────────────────────────────────────────────────
const EMPLOYMENT_TYPES = [
  { v: 'permanent', label: 'Permanent' }, { v: 'contract', label: 'Contract' },
  { v: 'intern', label: 'Intern' }, { v: 'consultant', label: 'Consultant' },
];
const ROLE_TYPES = [
  { v: 'support', label: 'IT Support' }, { v: 'dev', label: 'Developer' },
  { v: 'network', label: 'Network Engineer' }, { v: 'security', label: 'Security' },
  { v: 'data', label: 'Data / BI' }, { v: 'dba', label: 'DBA' },
  { v: 'apps', label: 'Applications' }, { v: 'helpdesk', label: 'Helpdesk' },
  { v: 'management', label: 'Management' },
];

export type StaffFormData = {
  fullName: string; employeeNumber: string; jobTitle: string; grade: string;
  department: string; unit: string; location: string; employmentType: string;
  startDate: string; supervisorName: string; email: string; phone: string;
  roleType: string; onCallEligible: boolean; shiftHours: string;
  operationalPercent: string; projectsPercent: string;
  adminPercent: string; trainingPercent: string;
  pdpNotes: string; bio: string; notes: string;
};

const empty: StaffFormData = {
  fullName: '', employeeNumber: '', jobTitle: '', grade: '',
  department: '', unit: '', location: '', employmentType: 'permanent',
  startDate: '', supervisorName: '', email: '', phone: '',
  roleType: '', onCallEligible: false, shiftHours: '',
  operationalPercent: '', projectsPercent: '', adminPercent: '', trainingPercent: '',
  pdpNotes: '', bio: '', notes: '',
};

function Sect({ children }: { children: React.ReactNode }) {
  return (
    <Grid item xs={12}>
      <Typography variant="caption" fontWeight={700} color="text.secondary"
        textTransform="uppercase" letterSpacing={0.8} display="block" sx={{ mt: 1 }}>
        {children}
      </Typography>
      <Divider sx={{ mt: 0.5 }} />
    </Grid>
  );
}

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

type Props = {
  open: boolean; onClose: () => void;
  onSubmit: (data: StaffFormData) => Promise<void>;
  initialValues?: Partial<StaffFormData> | null;
  title: string; submitLabel: string;
};

export default function StaffFormDialog({ open, onClose, onSubmit, initialValues, title, submitLabel }: Props) {
  const [tab, setTab] = useState(0);
  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<StaffFormData>({
    defaultValues: { ...empty, ...initialValues },
  });

  const op = parseInt(watch('operationalPercent')) || 0;
  const pr = parseInt(watch('projectsPercent')) || 0;
  const ad = parseInt(watch('adminPercent')) || 0;
  const tr = parseInt(watch('trainingPercent')) || 0;
  const total = op + pr + ad + tr;

  useEffect(() => { if (open) { setTab(0); reset({ ...empty, ...initialValues }); } }, [open, initialValues, reset]);

  const handleClose = () => { reset({ ...empty, ...initialValues }); onClose(); };
  const doSubmit = async (data: StaffFormData) => { await onSubmit(data); handleClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(doSubmit)}>
        <DialogTitle sx={{ pb: 0 }}>{title}</DialogTitle>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }} variant="scrollable">
          <Tab label="Identity" />
          <Tab label="Operational Role" />
          <Tab label="Workload" />
          <Tab label="Development & Notes" />
        </Tabs>

        <DialogContent sx={{ minHeight: 380 }}>

          {/* ── TAB 0: Identity ── */}
          <TabPanel value={tab} index={0}>
            <Grid container spacing={2}>
              <Sect>Personal Information</Sect>
              <Grid item xs={12} sm={8}>
                <Controller name="fullName" control={control} rules={{ required: 'Full name is required' }}
                  render={({ field }) => <TextField {...field} label="Full Name *" fullWidth
                    error={!!errors.fullName} helperText={errors.fullName?.message} />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="employeeNumber" control={control}
                  render={({ field }) => <TextField {...field} label="Employee Number" fullWidth placeholder="e.g. EMP-0042" />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="jobTitle" control={control}
                  render={({ field }) => <TextField {...field} label="Job Title" fullWidth placeholder="e.g. Systems Engineer" />} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller name="grade" control={control}
                  render={({ field }) => <TextField {...field} label="Grade / Level" fullWidth placeholder="e.g. P3, S4" />} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller name="employmentType" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Employment Type" fullWidth>
                      {EMPLOYMENT_TYPES.map((o) => <MenuItem key={o.v} value={o.v}>{o.label}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="department" control={control}
                  render={({ field }) => <TextField {...field} label="Department" fullWidth placeholder="e.g. ICT" />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="unit" control={control}
                  render={({ field }) => <TextField {...field} label="Unit / Team" fullWidth placeholder="e.g. Infrastructure" />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="location" control={control}
                  render={({ field }) => <TextField {...field} label="Location" fullWidth placeholder="e.g. HQ, Oshakati" />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="startDate" control={control}
                  render={({ field }) => <TextField {...field} label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="supervisorName" control={control}
                  render={({ field }) => <TextField {...field} label="Supervisor / Reports To" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={4} />
              <Grid item xs={12} sm={6}>
                <Controller name="email" control={control}
                  render={({ field }) => <TextField {...field} label="Email Address" type="email" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="phone" control={control}
                  render={({ field }) => <TextField {...field} label="Phone / Mobile" fullWidth placeholder="+264 81 …" />} />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── TAB 1: Operational Role ── */}
          <TabPanel value={tab} index={1}>
            <Grid container spacing={2}>
              <Sect>Role Classification</Sect>
              <Grid item xs={12} sm={6}>
                <Controller name="roleType" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="ICT Role Type" fullWidth>
                      <MenuItem value=""><em>Select…</em></MenuItem>
                      {ROLE_TYPES.map((o) => <MenuItem key={o.v} value={o.v}>{o.label}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller name="onCallEligible" control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                      label="On-Call Eligible"
                      sx={{ mt: 1 }}
                    />
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="shiftHours" control={control}
                  render={({ field }) => <TextField {...field} label="Shift / Working Hours" fullWidth placeholder="e.g. Mon–Fri 08:00–17:00" />} />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── TAB 2: Workload ── */}
          <TabPanel value={tab} index={2}>
            <Grid container spacing={2}>
              <Sect>Workload Allocation (should ideally add up to 100%)</Sect>
              <Grid item xs={12} sm={3}>
                <Controller name="operationalPercent" control={control}
                  render={({ field }) => <TextField {...field} label="Operational Support %" type="number"
                    fullWidth inputProps={{ min: 0, max: 100 }} helperText="Day-to-day ops" />} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller name="projectsPercent" control={control}
                  render={({ field }) => <TextField {...field} label="Projects %" type="number"
                    fullWidth inputProps={{ min: 0, max: 100 }} helperText="Active projects" />} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller name="adminPercent" control={control}
                  render={({ field }) => <TextField {...field} label="Admin / Meetings %" type="number"
                    fullWidth inputProps={{ min: 0, max: 100 }} helperText="Overhead" />} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller name="trainingPercent" control={control}
                  render={({ field }) => <TextField {...field} label="Training / Leave %" type="number"
                    fullWidth inputProps={{ min: 0, max: 100 }} helperText="Dev / leave" />} />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{
                  p: 1.5, borderRadius: 1, display: 'inline-flex', alignItems: 'center', gap: 2,
                  bgcolor: total > 100 ? 'error.light' : total > 85 ? 'warning.light' : 'success.light',
                }}>
                  <Typography fontWeight={700} color={total > 100 ? 'error.dark' : total > 85 ? 'warning.dark' : 'success.dark'}>
                    Total Allocated: {total}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {total > 100 ? '⚠ Overloaded' : total > 85 ? '⚠ High load' : total > 50 ? '✓ Normal' : '↓ Under-utilised'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── TAB 3: Development & Notes ── */}
          <TabPanel value={tab} index={3}>
            <Grid container spacing={2}>
              <Sect>Personal Development Plan (PDP)</Sect>
              <Grid item xs={12}>
                <Controller name="pdpNotes" control={control}
                  render={({ field }) => <TextField {...field} label="PDP Notes" fullWidth multiline rows={3}
                    placeholder="Training goals, skills to develop, certification targets…" />} />
              </Grid>
              <Sect>Professional Summary / Bio</Sect>
              <Grid item xs={12}>
                <Controller name="bio" control={control}
                  render={({ field }) => <TextField {...field} label="Bio / Summary" fullWidth multiline rows={3}
                    placeholder="Brief professional background…" />} />
              </Grid>
              <Sect>Additional Notes</Sect>
              <Grid item xs={12}>
                <Controller name="notes" control={control}
                  render={({ field }) => <TextField {...field} label="Notes" fullWidth multiline rows={2}
                    placeholder="Contract notes, special arrangements…" />} />
              </Grid>
            </Grid>
          </TabPanel>
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
