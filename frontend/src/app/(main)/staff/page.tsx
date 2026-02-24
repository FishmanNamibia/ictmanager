'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Chip, Skeleton, IconButton, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  LinearProgress, Tooltip, Collapse, Tabs, Tab,
} from '@mui/material';
import { api } from '@/lib/api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PeopleIcon from '@mui/icons-material/People';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SchoolIcon from '@mui/icons-material/School';
import BuildIcon from '@mui/icons-material/Build';
import StaffFormDialog, { StaffFormData } from '@/components/StaffFormDialog';

// ── Types ─────────────────────────────────────────────────────────────────
type StaffRecord = {
  id: string; fullName: string; employeeNumber: string | null;
  jobTitle: string | null; grade: string | null; department: string | null;
  unit: string | null; location: string | null; employmentType: string | null;
  startDate: string | null; supervisorName: string | null;
  email: string | null; phone: string | null;
  roleType: string | null; onCallEligible: boolean; shiftHours: string | null;
  operationalPercent: number | null; projectsPercent: number | null;
  adminPercent: number | null; trainingPercent: number | null;
  pdpNotes: string | null; bio: string | null; notes: string | null;
  // computed
  avgSkillScore: number; skillCount: number; systemCount: number;
  totalAllocated: number; workloadStatus: string; certExpiringSoon: boolean;
};

type Skill = {
  id: string; skillName: string; skillCategory: string | null;
  skillLevel: number; lastUsed: string | null; evidence: string | null; priority: string | null;
};

type Certification = {
  id: string; certName: string; provider: string | null;
  certLevel: string | null; attainedDate: string | null;
  expiryDate: string | null; mandatory: boolean;
};

type Assignment = {
  id: string; systemName: string; role: string;
  scope: string | null; coverage: string | null; slaResponsibility: boolean;
};

type Stats = {
  total: number; onCallCount: number; avgCapacity: number;
  overloaded: number; highLoad: number; underUtilised: number;
  certsExpiring30: number; certsExpiring60: number;
  singlePointRisk: { systemName: string }[];
  topSkillGaps: { category: string; avgLevel: number }[];
  byRole: Record<string, number>;
};

// ── Config ────────────────────────────────────────────────────────────────
const WORKLOAD_CONFIG: Record<string, { label: string; color: 'error' | 'warning' | 'success' | 'default' }> = {
  overloaded:      { label: 'Overloaded',      color: 'error' },
  high:            { label: 'High',            color: 'warning' },
  normal:          { label: 'Normal',          color: 'success' },
  under_utilised:  { label: 'Under-utilised',  color: 'default' },
};

const SKILL_LEVELS = ['None', 'Basic', 'Working', 'Proficient', 'Advanced', 'Expert'];
const SKILL_CATEGORIES: Record<string, string> = {
  infrastructure: 'Infrastructure', networking: 'Networking', security: 'Security',
  applications: 'Applications', data: 'Data', devops: 'DevOps',
  service_management: 'Service Mgmt', soft_skills: 'Soft Skills',
};
const SKILL_CAT_OPTIONS = Object.entries(SKILL_CATEGORIES).map(([v, label]) => ({ v, label }));

const ROLE_LABELS: Record<string, string> = {
  support: 'IT Support', dev: 'Developer', network: 'Network', security: 'Security',
  data: 'Data / BI', dba: 'DBA', apps: 'Applications', helpdesk: 'Helpdesk', management: 'Management',
};

// ── Helpers ───────────────────────────────────────────────────────────────
function staffToForm(s: StaffRecord): Partial<StaffFormData> {
  return {
    fullName: s.fullName, employeeNumber: s.employeeNumber ?? '',
    jobTitle: s.jobTitle ?? '', grade: s.grade ?? '',
    department: s.department ?? '', unit: s.unit ?? '',
    location: s.location ?? '', employmentType: s.employmentType ?? 'permanent',
    startDate: s.startDate?.slice(0, 10) ?? '', supervisorName: s.supervisorName ?? '',
    email: s.email ?? '', phone: s.phone ?? '',
    roleType: s.roleType ?? '', onCallEligible: s.onCallEligible, shiftHours: s.shiftHours ?? '',
    operationalPercent: s.operationalPercent != null ? String(s.operationalPercent) : '',
    projectsPercent: s.projectsPercent != null ? String(s.projectsPercent) : '',
    adminPercent: s.adminPercent != null ? String(s.adminPercent) : '',
    trainingPercent: s.trainingPercent != null ? String(s.trainingPercent) : '',
    pdpNotes: s.pdpNotes ?? '', bio: s.bio ?? '', notes: s.notes ?? '',
  };
}

function formToPayload(d: StaffFormData): Record<string, unknown> {
  return {
    fullName: d.fullName.trim(),
    employeeNumber: d.employeeNumber.trim() || undefined,
    jobTitle: d.jobTitle.trim() || undefined,
    grade: d.grade.trim() || undefined,
    department: d.department.trim() || undefined,
    unit: d.unit.trim() || undefined,
    location: d.location.trim() || undefined,
    employmentType: d.employmentType || undefined,
    startDate: d.startDate || undefined,
    supervisorName: d.supervisorName.trim() || undefined,
    email: d.email.trim() || undefined,
    phone: d.phone.trim() || undefined,
    roleType: d.roleType || undefined,
    onCallEligible: d.onCallEligible,
    shiftHours: d.shiftHours.trim() || undefined,
    operationalPercent: d.operationalPercent ? parseInt(d.operationalPercent) : undefined,
    projectsPercent: d.projectsPercent ? parseInt(d.projectsPercent) : undefined,
    adminPercent: d.adminPercent ? parseInt(d.adminPercent) : undefined,
    trainingPercent: d.trainingPercent ? parseInt(d.trainingPercent) : undefined,
    pdpNotes: d.pdpNotes.trim() || undefined,
    bio: d.bio.trim() || undefined,
    notes: d.notes.trim() || undefined,
  };
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: React.ReactNode;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={700} color={color ?? 'text.primary'} lineHeight={1.1} sx={{ mt: 0.5 }}>
              {value}
            </Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
          {icon && <Box sx={{ color: color ?? 'text.secondary', opacity: 0.6, fontSize: 34 }}>{icon}</Box>}
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Inline panel: Skills / Certs / Assignments ─────────────────────────────
function StaffDetailPanel({ staff }: { staff: StaffRecord }) {
  const [tab, setTab] = useState(0);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadedFor, setLoadedFor] = useState('');

  // Quick-add states
  const [skillName, setSkillName] = useState('');
  const [skillCat, setSkillCat] = useState('');
  const [skillLevel, setSkillLevel] = useState('2');
  const [skillEvidence, setSkillEvidence] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);

  const [certName, setCertName] = useState('');
  const [certProvider, setCertProvider] = useState('');
  const [certExpiry, setCertExpiry] = useState('');
  const [certMandatory, setCertMandatory] = useState(false);
  const [addingCert, setAddingCert] = useState(false);

  const [sysName, setSysName] = useState('');
  const [sysRole, setSysRole] = useState('primary');
  const [sysScope, setSysScope] = useState('admin');
  const [sysCoverage, setSysCoverage] = useState('business_hours');
  const [addingAssign, setAddingAssign] = useState(false);

  const load = useCallback(async () => {
    if (loadedFor === staff.id) return;
    const [sk, ce, as] = await Promise.all([
      api<Skill[]>(`/staff/${staff.id}/skills`),
      api<Certification[]>(`/staff/${staff.id}/certifications`),
      api<Assignment[]>(`/staff/${staff.id}/assignments`),
    ]);
    setSkills(sk); setCerts(ce); setAssignments(as);
    setLoadedFor(staff.id);
  }, [staff.id, loadedFor]);

  useEffect(() => { load(); }, [load]);

  const now = new Date();

  return (
    <Box sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab label={`Skills (${skills.length})`} />
        <Tab label={`Certifications (${certs.length})`} />
        <Tab label={`Systems (${assignments.length})`} />
        <Tab label="Profile" />
      </Tabs>

      {/* Skills tab */}
      {tab === 0 && (
        <Box>
          <Box display="flex" gap={1} mb={1} flexWrap="wrap" alignItems="flex-end">
            <TextField size="small" label="Skill name" value={skillName} onChange={(e) => setSkillName(e.target.value)} sx={{ minWidth: 180 }} />
            <TextField select size="small" label="Category" value={skillCat} onChange={(e) => setSkillCat(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value=""><em>None</em></MenuItem>
              {SKILL_CAT_OPTIONS.map((o) => <MenuItem key={o.v} value={o.v}>{o.label}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Level (0–5)" value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} sx={{ minWidth: 120 }}>
              {SKILL_LEVELS.map((l, i) => <MenuItem key={i} value={String(i)}>{i} – {l}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Evidence" value={skillEvidence} onChange={(e) => setSkillEvidence(e.target.value)} sx={{ minWidth: 200 }} />
            <Button size="small" variant="contained" disabled={!skillName || addingSkill}
              onClick={async () => {
                setAddingSkill(true);
                await api(`/staff/${staff.id}/skills`, {
                  method: 'POST',
                  body: JSON.stringify({ skillName, skillCategory: skillCat || undefined, skillLevel: parseInt(skillLevel), evidence: skillEvidence || undefined }),
                });
                const sk = await api<Skill[]>(`/staff/${staff.id}/skills`);
                setSkills(sk); setSkillName(''); setSkillEvidence(''); setSkillCat(''); setSkillLevel('2');
                setAddingSkill(false);
              }}>
              Add Skill
            </Button>
          </Box>
          {skills.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No skills recorded yet.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.100' } }}>
                  <TableCell>Skill</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Proficiency</TableCell>
                  <TableCell>Last Used</TableCell>
                  <TableCell>Evidence</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {skills.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{s.skillName}</TableCell>
                    <TableCell>{SKILL_CATEGORIES[s.skillCategory ?? ''] ?? s.skillCategory ?? '—'}</TableCell>
                    <TableCell>
                      <Chip label={`${s.skillLevel} – ${SKILL_LEVELS[s.skillLevel] ?? '?'}`} size="small"
                        color={s.skillLevel >= 4 ? 'success' : s.skillLevel >= 2 ? 'default' : 'warning'} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 100 }}>
                      <LinearProgress variant="determinate" value={s.skillLevel * 20}
                        color={s.skillLevel >= 4 ? 'success' : s.skillLevel >= 2 ? 'primary' : 'warning'}
                        sx={{ height: 6, borderRadius: 3 }} />
                    </TableCell>
                    <TableCell>{s.lastUsed ? new Date(s.lastUsed).toLocaleDateString() : '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.evidence ?? '—'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={async () => {
                        await api(`/staff/${staff.id}/skills/${s.id}`, { method: 'DELETE' });
                        setSkills((prev) => prev.filter((x) => x.id !== s.id));
                      }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}

      {/* Certifications tab */}
      {tab === 1 && (
        <Box>
          <Box display="flex" gap={1} mb={1} flexWrap="wrap" alignItems="flex-end">
            <TextField size="small" label="Certification name" value={certName} onChange={(e) => setCertName(e.target.value)} sx={{ minWidth: 200 }} />
            <TextField size="small" label="Provider" value={certProvider} onChange={(e) => setCertProvider(e.target.value)} sx={{ minWidth: 150 }} />
            <TextField size="small" label="Expiry date" type="date" value={certExpiry}
              onChange={(e) => setCertExpiry(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField select size="small" label="Mandatory?" value={certMandatory ? 'yes' : 'no'}
              onChange={(e) => setCertMandatory(e.target.value === 'yes')} sx={{ minWidth: 100 }}>
              <MenuItem value="no">No</MenuItem>
              <MenuItem value="yes">Yes</MenuItem>
            </TextField>
            <Button size="small" variant="contained" disabled={!certName || addingCert}
              onClick={async () => {
                setAddingCert(true);
                await api(`/staff/${staff.id}/certifications`, {
                  method: 'POST',
                  body: JSON.stringify({ certName, provider: certProvider || undefined, expiryDate: certExpiry || undefined, mandatory: certMandatory }),
                });
                const ce = await api<Certification[]>(`/staff/${staff.id}/certifications`);
                setCerts(ce); setCertName(''); setCertProvider(''); setCertExpiry(''); setCertMandatory(false);
                setAddingCert(false);
              }}>
              Add Cert
            </Button>
          </Box>
          {certs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No certifications recorded.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.100' } }}>
                  <TableCell>Certification</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Attained</TableCell>
                  <TableCell>Expiry</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Mandatory</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {certs.map((c) => {
                  const exp = c.expiryDate ? new Date(c.expiryDate) : null;
                  const daysLeft = exp ? Math.ceil((exp.getTime() - now.getTime()) / 86_400_000) : null;
                  return (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{c.certName}</TableCell>
                      <TableCell>{c.provider ?? '—'}</TableCell>
                      <TableCell>{c.attainedDate ? new Date(c.attainedDate).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{exp ? exp.toLocaleDateString() : 'No expiry'}</TableCell>
                      <TableCell>
                        {daysLeft == null ? <Chip label="Permanent" size="small" color="default" /> :
                         daysLeft < 0 ? <Chip label="Expired" size="small" color="error" /> :
                         daysLeft <= 30 ? <Chip label={`${daysLeft}d left`} size="small" color="error" variant="filled" /> :
                         daysLeft <= 60 ? <Chip label={`${daysLeft}d left`} size="small" color="warning" /> :
                         <Chip label="Valid" size="small" color="success" />}
                      </TableCell>
                      <TableCell>{c.mandatory ? <Chip label="Required" size="small" color="error" variant="outlined" /> : '—'}</TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={async () => {
                          await api(`/staff/${staff.id}/certifications/${c.id}`, { method: 'DELETE' });
                          setCerts((prev) => prev.filter((x) => x.id !== c.id));
                        }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Box>
      )}

      {/* Assignments tab */}
      {tab === 2 && (
        <Box>
          <Box display="flex" gap={1} mb={1} flexWrap="wrap" alignItems="flex-end">
            <TextField size="small" label="System / Application name" value={sysName} onChange={(e) => setSysName(e.target.value)} sx={{ minWidth: 220 }} />
            <TextField select size="small" label="Role" value={sysRole} onChange={(e) => setSysRole(e.target.value)} sx={{ minWidth: 120 }}>
              {['primary','secondary','backup'].map((v) => <MenuItem key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Scope" value={sysScope} onChange={(e) => setSysScope(e.target.value)} sx={{ minWidth: 120 }}>
              {['admin','functional','developer','dba','security'].map((v) => <MenuItem key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Coverage" value={sysCoverage} onChange={(e) => setSysCoverage(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="business_hours">Business hours</MenuItem>
              <MenuItem value="after_hours">After hours</MenuItem>
              <MenuItem value="both">Both</MenuItem>
            </TextField>
            <Button size="small" variant="contained" disabled={!sysName || addingAssign}
              onClick={async () => {
                setAddingAssign(true);
                await api(`/staff/${staff.id}/assignments`, {
                  method: 'POST',
                  body: JSON.stringify({ systemName: sysName, role: sysRole, scope: sysScope, coverage: sysCoverage }),
                });
                const as = await api<Assignment[]>(`/staff/${staff.id}/assignments`);
                setAssignments(as); setSysName(''); setSysRole('primary'); setSysScope('admin');
                setAddingAssign(false);
              }}>
              Assign
            </Button>
          </Box>
          {assignments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No systems assigned yet.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.100' } }}>
                  <TableCell>System / Application</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Coverage</TableCell>
                  <TableCell>SLA Responsible</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{a.systemName}</TableCell>
                    <TableCell>
                      <Chip label={a.role} size="small"
                        color={a.role === 'primary' ? 'error' : a.role === 'secondary' ? 'warning' : 'default'}
                        variant="outlined" />
                    </TableCell>
                    <TableCell>{a.scope ?? '—'}</TableCell>
                    <TableCell>{a.coverage?.replace('_', ' ') ?? '—'}</TableCell>
                    <TableCell>{a.slaResponsibility ? <Chip label="Yes" size="small" color="error" variant="outlined" /> : '—'}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={async () => {
                        await api(`/staff/${staff.id}/assignments/${a.id}`, { method: 'DELETE' });
                        setAssignments((prev) => prev.filter((x) => x.id !== a.id));
                      }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}

      {/* Profile summary tab */}
      {tab === 3 && (
        <Grid container spacing={2}>
          {[
            ['Employee #', staff.employeeNumber],
            ['Department', staff.department],
            ['Unit', staff.unit],
            ['Location', staff.location],
            ['Employment', staff.employmentType],
            ['Start Date', staff.startDate ? new Date(staff.startDate).toLocaleDateString() : null],
            ['Supervisor', staff.supervisorName],
            ['Email', staff.email],
            ['Phone', staff.phone],
            ['Shift Hours', staff.shiftHours],
          ].map(([label, val]) => val ? (
            <Grid item xs={6} sm={4} key={label as string}>
              <Typography variant="caption" color="text.secondary" display="block">{label as string}</Typography>
              <Typography variant="body2">{val as string}</Typography>
            </Grid>
          ) : null)}
          {staff.pdpNotes && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" display="block">PDP Notes</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{staff.pdpNotes}</Typography>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function StaffPage() {
  const [list, setList] = useState<StaffRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [workloadFilter, setWorkloadFilter] = useState('');
  const [onCallFilter, setOnCallFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (roleFilter)     p.set('roleType', roleFilter);
    if (locationFilter) p.set('location', locationFilter);
    if (workloadFilter) p.set('workloadStatus', workloadFilter);
    if (onCallFilter === 'yes') p.set('onCall', 'true');
    if (search)         p.set('search', search);
    return p.toString();
  }, [roleFilter, locationFilter, workloadFilter, onCallFilter, search]);

  const fetchList = useCallback(() => {
    setLoading(true);
    api<StaffRecord[]>(`/staff?${buildQuery()}`)
      .then(setList).catch((e) => setError(e instanceof Error ? e.message : 'Failed')).finally(() => setLoading(false));
  }, [buildQuery]);

  const fetchStats = useCallback(() => {
    api<Stats>('/staff/stats').then(setStats).catch(() => null);
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleFormSubmit = async (data: StaffFormData) => {
    const payload = formToPayload(data);
    if (editing) await api(`/staff/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('/staff', { method: 'POST', body: JSON.stringify(payload) });
    fetchList(); fetchStats();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await api(`/staff/${deleteId}`, { method: 'DELETE' }); fetchList(); fetchStats(); setDeleteId(null); }
    finally { setDeleting(false); }
  };

  const toDelete = deleteId ? list.find((s) => s.id === deleteId) : null;
  const clearFilters = () => { setRoleFilter(''); setLocationFilter(''); setWorkloadFilter(''); setOnCallFilter(''); setSearch(''); setSearchInput(''); };
  const hasFilters = !!(roleFilter || locationFilter || workloadFilter || onCallFilter || search);

  const uniqueLocations = [...new Set(list.map((s) => s.location).filter(Boolean))];

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      {/* ── Header ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>ICT Staff, Skills &amp; Capacity</Typography>
          <Typography variant="body2" color="text.secondary">
            Team profiles · Skills matrix · Certifications · System ownership · Workload
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}>
          Add Staff Member
        </Button>
      </Box>

      {/* ── Stat Cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Team Size" value={stats?.total ?? '…'}
            sub={`${stats?.onCallCount ?? 0} on-call eligible`} icon={<PeopleIcon fontSize="inherit" />} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Avg Workload" value={stats ? `${stats.avgCapacity}%` : '…'}
            color={(stats?.avgCapacity ?? 0) > 85 ? 'warning.main' : undefined}
            sub="Total allocated avg" icon={<BuildIcon fontSize="inherit" />} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Overloaded" value={stats?.overloaded ?? '…'}
            color={(stats?.overloaded ?? 0) > 0 ? 'error.main' : undefined}
            sub="Allocation > 100%" icon={<WarningAmberIcon fontSize="inherit" />} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Certs Expiring (30d)" value={stats?.certsExpiring30 ?? '…'}
            color={(stats?.certsExpiring30 ?? 0) > 0 ? 'error.main' : undefined}
            sub="Immediate renewal needed" icon={<SchoolIcon fontSize="inherit" />} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Single-Point Risk" value={stats?.singlePointRisk?.length ?? '…'}
            color={(stats?.singlePointRisk?.length ?? 0) > 0 ? 'warning.main' : undefined}
            sub="Systems with 1 primary owner" icon={<PhoneInTalkIcon fontSize="inherit" />} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard label="Certs Expiring (60d)" value={stats?.certsExpiring60 ?? '…'}
            color={(stats?.certsExpiring60 ?? 0) > 0 ? 'warning.main' : undefined}
            sub="Plan renewals" icon={<SchoolIcon fontSize="inherit" />} />
        </Grid>
      </Grid>

      {/* ── Single-point-of-failure alert ── */}
      {(stats?.singlePointRisk?.length ?? 0) > 0 && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: 'warning.light', border: '1px solid', borderColor: 'warning.main' }}>
          <Typography variant="body2" fontWeight={700} color="warning.dark">
            ⚠ Single-person risk: {stats!.singlePointRisk.map((r) => r.systemName).join(', ')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Each listed system has only 1 primary support person — assign a backup.
          </Typography>
        </Box>
      )}

      {/* ── Filters ── */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        <TextField size="small" label="Search name / title / dept" value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput); }}
          onBlur={() => setSearch(searchInput)} sx={{ minWidth: 220 }} />
        <TextField select size="small" label="Role type" value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All roles</MenuItem>
          {Object.entries(ROLE_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Location" value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)} sx={{ minWidth: 130 }}>
          <MenuItem value="">All locations</MenuItem>
          {uniqueLocations.map((l) => <MenuItem key={l!} value={l!}>{l}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Workload" value={workloadFilter}
          onChange={(e) => setWorkloadFilter(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All workloads</MenuItem>
          {Object.entries(WORKLOAD_CONFIG).map(([v, c]) => <MenuItem key={v} value={v}>{c.label}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="On-Call" value={onCallFilter}
          onChange={(e) => setOnCallFilter(e.target.value)} sx={{ minWidth: 120 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="yes">On-call only</MenuItem>
        </TextField>
        {hasFilters && <Button size="small" onClick={clearFilters}>Clear</Button>}
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {list.length} staff member{list.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* ── Table ── */}
      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {loading ? (
            <Box sx={{ p: 2 }}><Skeleton variant="rectangular" height={300} /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'grey.50' } }}>
                    <TableCell width={28} />
                    <TableCell>Name</TableCell>
                    <TableCell>Job Title</TableCell>
                    <TableCell>Role Type</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Employment</TableCell>
                    <TableCell align="center">On-Call</TableCell>
                    <TableCell align="center">Systems</TableCell>
                    <TableCell align="center">Skills (avg)</TableCell>
                    <TableCell>Workload</TableCell>
                    <TableCell align="center">Allocated %</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No staff profiles yet. Click &quot;Add Staff Member&quot; to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    list.map((s) => {
                      const wc = WORKLOAD_CONFIG[s.workloadStatus] ?? WORKLOAD_CONFIG.normal;
                      const isExpanded = expandedId === s.id;
                      return (
                        <React.Fragment key={s.id}>
                          <TableRow hover
                            sx={{ '& td': { fontSize: '0.78rem' },
                              bgcolor: s.workloadStatus === 'overloaded' ? 'error.50' : s.certExpiringSoon ? 'warning.50' : undefined }}>
                            <TableCell>
                              <IconButton size="small" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                              </IconButton>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {s.fullName}
                              {s.email && <Typography variant="caption" color="text.secondary" display="block">{s.email}</Typography>}
                              {s.certExpiringSoon && (
                                <Chip label="Cert expiring" size="small" color="warning" sx={{ mt: 0.25 }} />
                              )}
                            </TableCell>
                            <TableCell>{s.jobTitle ?? '—'}</TableCell>
                            <TableCell>
                              {s.roleType
                                ? <Chip label={ROLE_LABELS[s.roleType] ?? s.roleType} size="small" variant="outlined" />
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {s.department ?? '—'}
                              {s.unit && <Typography variant="caption" color="text.secondary" display="block">{s.unit}</Typography>}
                            </TableCell>
                            <TableCell>{s.location ?? '—'}</TableCell>
                            <TableCell>
                              {s.employmentType
                                ? <Chip label={s.employmentType} size="small" variant="outlined"
                                    color={s.employmentType === 'permanent' ? 'default' : 'info'} />
                                : '—'}
                            </TableCell>
                            <TableCell align="center">
                              {s.onCallEligible
                                ? <Chip label="Yes" size="small" color="success" />
                                : <Typography variant="caption" color="text.disabled">No</Typography>}
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={s.systemCount} size="small"
                                color={s.systemCount > 0 ? 'primary' : 'default'} variant="outlined" />
                            </TableCell>
                            <TableCell align="center">
                              {s.skillCount > 0 ? (
                                <Tooltip title={`Avg skill: ${s.avgSkillScore}/100 over ${s.skillCount} skills`}>
                                  <Box>
                                    <Typography variant="caption" fontWeight={700}>{s.avgSkillScore}/100</Typography>
                                    <LinearProgress variant="determinate" value={s.avgSkillScore}
                                      color={s.avgSkillScore >= 70 ? 'success' : s.avgSkillScore >= 40 ? 'primary' : 'warning'}
                                      sx={{ height: 4, borderRadius: 2, mt: 0.25 }} />
                                  </Box>
                                </Tooltip>
                              ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                            </TableCell>
                            <TableCell>
                              <Chip label={wc.label} size="small" color={wc.color} />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="caption" fontWeight={700}
                                color={s.totalAllocated > 100 ? 'error.main' : s.totalAllocated > 85 ? 'warning.main' : undefined}>
                                {s.totalAllocated > 0 ? `${s.totalAllocated}%` : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditing(s); setFormOpen(true); }} title="Edit">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteId(s.id); }} title="Remove">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          <TableRow key={`${s.id}-detail`}>
                            <TableCell colSpan={13} sx={{ p: 0, border: isExpanded ? undefined : 'none' }}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <StaffDetailPanel staff={s} />
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Form Dialog ── */}
      <StaffFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleFormSubmit}
        initialValues={editing ? staffToForm(editing) : null}
        title={editing ? `Edit — ${editing.fullName}` : 'Add Staff Member'}
        submitLabel={editing ? 'Save Changes' : 'Add Member'}
      />

      {/* ── Delete Dialog ── */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Remove Staff Member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toDelete ? `Remove "${toDelete.fullName}" from the ICT team register? This will also delete their skills, certifications and system assignments.` : 'Remove this staff member?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
