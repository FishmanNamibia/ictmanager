'use client';

import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, Divider, Typography,
  Tabs, Tab, Box, FormControlLabel, Switch,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

// ── Option lists ────────────────────────────────────────────────────────
const APP_TYPES    = [{ v:'custom_built',label:'Custom-built'},{ v:'cots',label:'COTS'},{ v:'saas',label:'SaaS'},{ v:'legacy',label:'Legacy'},{ v:'open_source',label:'Open Source'}];
const APP_STATUSES = [{ v:'proposed',label:'Proposed'},{ v:'in_development',label:'In Development'},{ v:'live',label:'Live'},{ v:'deprecated',label:'Deprecated'},{ v:'retired',label:'Retired'}];
const CRITICALITIES= [{ v:'critical',label:'Critical'},{ v:'high',label:'High'},{ v:'medium',label:'Medium'},{ v:'low',label:'Low'}];
const TIERS        = [{ v:'tier1',label:'Tier 1 – Mission Critical'},{ v:'tier2',label:'Tier 2 – Important'},{ v:'tier3',label:'Tier 3 – Non-Critical'}];
const SENSITIVITIES= [{ v:'public',label:'Public'},{ v:'internal',label:'Internal'},{ v:'confidential',label:'Confidential'},{ v:'restricted',label:'Restricted'}];
const HOSTING_TYPES= [{ v:'on_prem',label:'On-Premises'},{ v:'cloud',label:'Cloud'},{ v:'vendor',label:'Vendor-hosted'},{ v:'hybrid',label:'Hybrid'}];
const SUPPORT_MODELS=[{ v:'in_house',label:'In-house'},{ v:'vendor_sla',label:'Vendor SLA'},{ v:'hybrid',label:'Hybrid'}];
const LIFECYCLE    = [{ v:'build',label:'Build'},{ v:'run',label:'Run'},{ v:'optimize',label:'Optimize'},{ v:'retire',label:'Retire'}];
const AUTH_METHODS = [{ v:'local',label:'Local'},{ v:'ad',label:'Active Directory'},{ v:'sso',label:'SSO'},{ v:'mfa',label:'MFA'},{ v:'ad_mfa',label:'AD + MFA'}];
const VULN_STATUS  = [{ v:'clean',label:'Clean – No issues'},{ v:'issues_open',label:'Issues Open'},{ v:'unknown',label:'Unknown'}];
const CATEGORIES   = ['ERP','HR','Finance','Statistics','Case Management','Email','Document Management','GIS','GovTech','Payments','Security','Infrastructure','Other'];

export type AppFormData = {
  name: string; acronym: string; description: string; category: string;
  appType: string; status: string; goLiveDate: string; version: string;
  businessOwner: string; systemOwner: string; ictOwner: string;
  supportTeam: string; vendorName: string; supportModel: string;
  criticality: string; tier: string; dataSensitivity: string;
  availabilityRequirement: string; rto: string; rpo: string;
  hostingType: string; environments: string; dataCenter: string;
  databaseType: string; domainUrl: string; integrations: string;
  dependencies: string;
  authMethod: string; accessControl: string; auditLogging: boolean;
  auditRetentionDays: string; encryptionAtRest: boolean; encryptionInTransit: boolean;
  complianceTags: string; lastSecurityReview: string; vulnerabilityStatus: string;
  lifecycleStage: string; endOfSupportDate: string; plannedUpgradeDate: string; plannedReplacement: string;
  annualMaintenanceCost: string; contractStartDate: string; contractEndDate: string;
  procurementRef: string; vendorSlaLevel: string;
  healthStatus: string; uptimePercent: string; openIncidents: string;
  openSecurityIssues: string; backupSuccessRate: string; lastReviewDate: string;
  notes: string;
};

const empty: AppFormData = {
  name:'',acronym:'',description:'',category:'',appType:'',status:'live',
  goLiveDate:'',version:'',businessOwner:'',systemOwner:'',ictOwner:'',
  supportTeam:'',vendorName:'',supportModel:'',criticality:'medium',tier:'',
  dataSensitivity:'internal',availabilityRequirement:'',rto:'',rpo:'',
  hostingType:'on_prem',environments:'prod',dataCenter:'',databaseType:'',
  domainUrl:'',integrations:'',dependencies:'',
  authMethod:'',accessControl:'rbac',auditLogging:false,auditRetentionDays:'',
  encryptionAtRest:false,encryptionInTransit:false,complianceTags:'',
  lastSecurityReview:'',vulnerabilityStatus:'unknown',
  lifecycleStage:'run',endOfSupportDate:'',plannedUpgradeDate:'',plannedReplacement:'',
  annualMaintenanceCost:'',contractStartDate:'',contractEndDate:'',
  procurementRef:'',vendorSlaLevel:'',
  healthStatus:'unknown',uptimePercent:'',openIncidents:'0',
  openSecurityIssues:'0',backupSuccessRate:'',lastReviewDate:'',notes:'',
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

interface TabPanelProps { children: React.ReactNode; value: number; index: number }
function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

type Props = {
  open: boolean; onClose: () => void;
  onSubmit: (data: AppFormData) => Promise<void>;
  initialValues?: Partial<AppFormData> | null;
  title: string; submitLabel: string;
};

export default function ApplicationFormDialog({ open, onClose, onSubmit, initialValues, title, submitLabel }: Props) {
  const [tab, setTab] = useState(0);
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AppFormData>({
    defaultValues: { ...empty, ...initialValues },
  });

  useEffect(() => { if (open) { setTab(0); reset({ ...empty, ...initialValues }); } }, [open, initialValues, reset]);

  const handleClose = () => { reset({ ...empty, ...initialValues }); onClose(); };
  const doSubmit = async (data: AppFormData) => { await onSubmit(data); handleClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(doSubmit)}>
        <DialogTitle sx={{ pb: 0 }}>{title}</DialogTitle>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }} variant="scrollable">
          <Tab label="Identity" />
          <Tab label="Ownership" />
          <Tab label="Criticality" />
          <Tab label="Hosting" />
          <Tab label="Security" />
          <Tab label="Lifecycle" />
          <Tab label="Financial" />
          <Tab label="Health" />
        </Tabs>

        <DialogContent sx={{ minHeight: 420 }}>

          {/* ── TAB 0: Identity ── */}
          <TabPanel value={tab} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <Controller name="name" control={control} rules={{ required: 'Name is required' }}
                  render={({ field }) => <TextField {...field} label="System / Application Name *" fullWidth
                    error={!!errors.name} helperText={errors.name?.message} />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="acronym" control={control}
                  render={({ field }) => <TextField {...field} label="Acronym" fullWidth placeholder="e.g. HRMS" />} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="description" control={control}
                  render={({ field }) => <TextField {...field} label="Description / Purpose" fullWidth multiline rows={2} />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="category" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Category" fullWidth>
                      <MenuItem value=""><em>Select…</em></MenuItem>
                      {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="appType" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Application Type" fullWidth>
                      <MenuItem value=""><em>Select…</em></MenuItem>
                      {APP_TYPES.map((o) => <MenuItem key={o.v} value={o.v}>{o.label}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="status" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Status" fullWidth>
                      {APP_STATUSES.map((o) => <MenuItem key={o.v} value={o.v}>{o.label}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="version" control={control}
                  render={({ field }) => <TextField {...field} label="Current Version" fullWidth placeholder="e.g. v3.2.1" />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="goLiveDate" control={control}
                  render={({ field }) => <TextField {...field} label="Go-Live Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="domainUrl" control={control}
                  render={({ field }) => <TextField {...field} label="URL / Domain" fullWidth placeholder="https://system.gov.na" />} />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── TAB 1: Ownership ── */}
          <TabPanel value={tab} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller name="businessOwner" control={control}
                  render={({ field }) => <TextField {...field} label="Business Owner (Directorate / Division)" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="systemOwner" control={control}
                  render={({ field }) => <TextField {...field} label="System Owner (Named Person)" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="ictOwner" control={control}
                  render={({ field }) => <TextField {...field} label="ICT Owner / Team Lead" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="supportTeam" control={control}
                  render={({ field }) => <TextField {...field} label="Technical Support Team" fullWidth placeholder="e.g. ICT Infrastructure Team" />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="vendorName" control={control}
                  render={({ field }) => <TextField {...field} label="Vendor / Developer" fullWidth placeholder="e.g. SAP, Oracle, In-house" />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="supportModel" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Support Model" fullWidth>
                      <MenuItem value=""><em>Select…</em></MenuItem>
                      {SUPPORT_MODELS.map((o) => <MenuItem key={o.v} value={o.v}>{o.label}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── TAB 2: Criticality ── */}
          <TabPanel value={tab} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Controller name="criticality" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Criticality" fullWidth>
                      {CRITICALITIES.map((o) => <MenuItem key={o.v} value={o.v}>{o.label}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="tier" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Tier" fullWidth>
                      <MenuItem value=""><em>Select…</em></MenuItem>
                      {TIERS.map((o) => <MenuItem key={o.v} value={o.v}>{o.label}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="dataSensitivity" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Data Sensitivity" fullWidth>
                      {SENSITIVITIES.map((o) => <MenuItem key={o.v} value={o.v}>{o.label}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="availabilityRequirement" control={control}
                  render={({ field }) => <TextField {...field} label="Availability Requirement" fullWidth placeholder="e.g. 99.5%" />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="rto" control={control}
                  render={({ field }) => <TextField {...field} label="RTO (Recovery Time Objective)" fullWidth placeholder="e.g. 4 hours" />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="rpo" control={control}
                  render={({ field }) => <TextField {...field} label="RPO (Recovery Point Objective)" fullWidth placeholder="e.g. 1 hour" />} />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── TAB 3: Hosting ── */}
          <TabPanel value={tab} index={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Controller name="hostingType" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Hosting Type" fullWidth>
                      {HOSTING_TYPES.map((o) => <MenuItem key={o.v} value={o.v}>{o.label}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="environments" control={control}
                  render={({ field }) => <TextField {...field} label="Environments" fullWidth placeholder="dev,test,uat,prod" helperText="Comma-separated" />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="dataCenter" control={control}
                  render={({ field }) => <TextField {...field} label="Data Centre / Location" fullWidth placeholder="e.g. Windhoek DC, AWS af-south-1" />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="databaseType" control={control}
                  render={({ field }) => <TextField {...field} label="Database Type" fullWidth placeholder="e.g. PostgreSQL, MSSQL, Oracle" />} />
              </Grid>
              <Grid item xs={12} sm={8}>
                <Controller name="integrations" control={control}
                  render={({ field }) => <TextField {...field} label="Integrations" fullWidth placeholder="AD/LDAP, Email, SMS, Payment Gateway" helperText="Comma-separated list" />} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="dependencies" control={control}
                  render={({ field }) => <TextField {...field} label="System Dependencies" fullWidth multiline rows={2}
                    placeholder="List systems this application depends on (e.g. Active Directory, Email Relay, Payment API)" />} />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── TAB 4: Security ── */}
          <TabPanel value={tab} index={4}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Controller name="authMethod" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Authentication Method" fullWidth>
                      <MenuItem value=""><em>Select…</em></MenuItem>
                      {AUTH_METHODS.map((o) => <MenuItem key={o.v} value={o.v}>{o.label}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="accessControl" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Access Control Model" fullWidth>
                      <MenuItem value="rbac">RBAC – Role Based</MenuItem>
                      <MenuItem value="abac">ABAC – Attribute Based</MenuItem>
                      <MenuItem value="dac">DAC – Discretionary</MenuItem>
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="vulnerabilityStatus" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Vulnerability Status" fullWidth>
                      {VULN_STATUS.map((o) => <MenuItem key={o.v} value={o.v}>{o.label}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller name="auditLogging" control={control}
                  render={({ field }) => (
                    <FormControlLabel control={<Switch checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                      label="Audit Logging Enabled" />
                  )} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller name="auditRetentionDays" control={control}
                  render={({ field }) => <TextField {...field} label="Log Retention (days)" type="number" fullWidth inputProps={{ min: 0 }} />} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller name="encryptionAtRest" control={control}
                  render={({ field }) => (
                    <FormControlLabel control={<Switch checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                      label="Encryption at Rest" />
                  )} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller name="encryptionInTransit" control={control}
                  render={({ field }) => (
                    <FormControlLabel control={<Switch checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                      label="Encryption in Transit" />
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="complianceTags" control={control}
                  render={({ field }) => <TextField {...field} label="Compliance Tags" fullWidth placeholder="ISO 27001, POPIA, NamDA" helperText="Comma-separated" />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="lastSecurityReview" control={control}
                  render={({ field }) => <TextField {...field} label="Last Security Review Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── TAB 5: Lifecycle ── */}
          <TabPanel value={tab} index={5}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Controller name="lifecycleStage" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Lifecycle Stage" fullWidth>
                      <MenuItem value=""><em>Select…</em></MenuItem>
                      {LIFECYCLE.map((o) => <MenuItem key={o.v} value={o.v}>{o.label}</MenuItem>)}
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="endOfSupportDate" control={control}
                  render={({ field }) => <TextField {...field} label="End-of-Support Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="plannedUpgradeDate" control={control}
                  render={({ field }) => <TextField {...field} label="Planned Upgrade Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="plannedReplacement" control={control}
                  render={({ field }) => <TextField {...field} label="Planned Replacement System" fullWidth placeholder="e.g. New ERP v2 (FY2026)" />} />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── TAB 6: Financial ── */}
          <TabPanel value={tab} index={6}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Controller name="annualMaintenanceCost" control={control}
                  render={({ field }) => <TextField {...field} label="Annual Maintenance Cost (NAD)" type="number" fullWidth inputProps={{ min: 0, step: 0.01 }} />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="contractStartDate" control={control}
                  render={({ field }) => <TextField {...field} label="Contract Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="contractEndDate" control={control}
                  render={({ field }) => <TextField {...field} label="Contract End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="procurementRef" control={control}
                  render={({ field }) => <TextField {...field} label="Procurement Reference" fullWidth placeholder="PO-2024-001" />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="vendorSlaLevel" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Vendor SLA Level" fullWidth>
                      <MenuItem value=""><em>None / N/A</em></MenuItem>
                      <MenuItem value="standard">Standard</MenuItem>
                      <MenuItem value="premium">Premium</MenuItem>
                      <MenuItem value="enterprise">Enterprise</MenuItem>
                    </TextField>
                  )} />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── TAB 7: Health ── */}
          <TabPanel value={tab} index={7}>
            <Grid container spacing={2}>
              <Sect>Health Data Inputs (used to auto-calculate Health Score)</Sect>
              <Grid item xs={12} sm={4}>
                <Controller name="uptimePercent" control={control}
                  render={({ field }) => <TextField {...field} label="Uptime % (last 30 days)" type="number" fullWidth
                    inputProps={{ min: 0, max: 100, step: 0.01 }} placeholder="e.g. 99.7" />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="openIncidents" control={control}
                  render={({ field }) => <TextField {...field} label="Open Incidents" type="number" fullWidth inputProps={{ min: 0 }} />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="openSecurityIssues" control={control}
                  render={({ field }) => <TextField {...field} label="Open Security Issues" type="number" fullWidth inputProps={{ min: 0 }} />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="backupSuccessRate" control={control}
                  render={({ field }) => <TextField {...field} label="Backup Success Rate %" type="number" fullWidth
                    inputProps={{ min: 0, max: 100, step: 0.1 }} placeholder="e.g. 98.5" />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="lastReviewDate" control={control}
                  render={({ field }) => <TextField {...field} label="Last Review Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />} />
              </Grid>
              <Sect>Notes</Sect>
              <Grid item xs={12}>
                <Controller name="notes" control={control}
                  render={({ field }) => <TextField {...field} label="Notes" fullWidth multiline rows={3} placeholder="Any additional context…" />} />
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
