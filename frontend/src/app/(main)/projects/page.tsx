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
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type ProjectStatus = 'planning' | 'approved' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
type ProjectPhase = 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closure';
type MilestoneStatus = 'planned' | 'in_progress' | 'completed' | 'at_risk' | 'delayed';

type ProjectMilestone = {
  id: string;
  name: string;
  status: MilestoneStatus;
  targetDate: string;
};

type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  currentPhase: ProjectPhase;
  projectManager?: string | null;
  sponsor?: string | null;
  startDate: string;
  plannedEndDate?: string | null;
  budget?: string | null;
  completionPercentage: number;
  milestones?: ProjectMilestone[];
};

type PortfolioStats = {
  totalProjects: number;
  byStatus: Record<string, number>;
  byPhase: Record<string, number>;
  onTrackCount: number;
  atRiskCount: number;
  totalBudget: number;
  spentBudget: number;
  averageCompletion: number;
};

const STATUS_OPTIONS: Array<{ value: 'all' | ProjectStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'planning', label: 'Planning' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PHASE_OPTIONS: ProjectPhase[] = ['initiation', 'planning', 'execution', 'monitoring', 'closure'];

export default function ProjectsPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'ict_manager';

  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');

  const [projectOpen, setProjectOpen] = useState(false);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleteMilestone, setDeleteMilestone] = useState<ProjectMilestone | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [projectErrors, setProjectErrors] = useState<{ name?: string; startDate?: string; completionPercentage?: string }>({});
  const [milestoneErrors, setMilestoneErrors] = useState<{ name?: string; targetDate?: string }>({});

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'planning' as ProjectStatus,
    currentPhase: 'initiation' as ProjectPhase,
    projectManager: '',
    sponsor: '',
    startDate: '',
    plannedEndDate: '',
    budget: '',
    completionPercentage: '0',
  });

  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    status: 'planned' as MilestoneStatus,
    targetDate: '',
  });

  const resetProjectForm = () => {
    setProjectForm({
      name: '',
      description: '',
      status: 'planning',
      currentPhase: 'initiation',
      projectManager: '',
      sponsor: '',
      startDate: '',
      plannedEndDate: '',
      budget: '',
      completionPercentage: '0',
    });
    setProjectErrors({});
    setEditingProjectId(null);
  };

  const validateProject = () => {
    const next: { name?: string; startDate?: string; completionPercentage?: string } = {};
    if (!projectForm.name.trim()) next.name = 'Name is required';
    if (!projectForm.startDate) next.startDate = 'Start date is required';
    const completion = Number(projectForm.completionPercentage);
    if (!Number.isFinite(completion) || completion < 0 || completion > 100) {
      next.completionPercentage = 'Completion must be between 0 and 100';
    }
    setProjectErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateMilestone = () => {
    const next: { name?: string; targetDate?: string } = {};
    if (!milestoneForm.name.trim()) next.name = 'Milestone name is required';
    if (!milestoneForm.targetDate) next.targetDate = 'Target date is required';
    setMilestoneErrors(next);
    return Object.keys(next).length === 0;
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const [projectData, statData] = await Promise.all([
        api<Project[]>(`/ict-projects/projects${params.size ? `?${params.toString()}` : ''}`),
        api<PortfolioStats>('/ict-projects/dashboard-stats'),
      ]);
      setProjects(projectData);
      setStats(statData);
      if (selectedProject) {
        const refreshed = projectData.find((p) => p.id === selectedProject.id) || null;
        setSelectedProject(refreshed);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedProject]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const cards = useMemo(() => ([
    { label: 'Total Projects', value: stats?.totalProjects ?? 0 },
    { label: 'On Track', value: stats?.onTrackCount ?? 0 },
    { label: 'At Risk', value: stats?.atRiskCount ?? 0 },
    { label: 'Average Completion', value: `${stats?.averageCompletion ?? 0}%` },
  ]), [stats]);

  const openEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setProjectForm({
      name: project.name,
      description: project.description ?? '',
      status: project.status,
      currentPhase: project.currentPhase,
      projectManager: project.projectManager ?? '',
      sponsor: project.sponsor ?? '',
      startDate: project.startDate ? project.startDate.slice(0, 10) : '',
      plannedEndDate: project.plannedEndDate ? project.plannedEndDate.slice(0, 10) : '',
      budget: project.budget ?? '',
      completionPercentage: String(project.completionPercentage ?? 0),
    });
    setProjectOpen(true);
  };

  const saveProject = async () => {
    if (!validateProject()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: projectForm.name.trim(),
        description: projectForm.description.trim() || undefined,
        status: projectForm.status,
        currentPhase: projectForm.currentPhase,
        projectManager: projectForm.projectManager.trim() || undefined,
        sponsor: projectForm.sponsor.trim() || undefined,
        startDate: new Date(projectForm.startDate).toISOString(),
        plannedEndDate: projectForm.plannedEndDate ? new Date(projectForm.plannedEndDate).toISOString() : undefined,
        budget: projectForm.budget.trim() || undefined,
        completionPercentage: parseInt(projectForm.completionPercentage, 10) || 0,
      };
      if (editingProjectId) {
        const saved = await api<Project>(`/ict-projects/projects/${editingProjectId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        if (selectedProject?.id === saved.id) setSelectedProject(saved);
        setToast({ open: true, message: 'Project updated', severity: 'success' });
      } else {
        const saved = await api<Project>('/ict-projects/projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setProjects((prev) => [saved, ...prev]);
        setToast({ open: true, message: 'Project created', severity: 'success' });
      }
      setProjectOpen(false);
      resetProjectForm();
      void loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save project');
      setToast({ open: true, message: 'Failed to save project', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const createMilestone = async () => {
    if (!selectedProject || !validateMilestone()) return;
    setSubmitting(true);
    try {
      const saved = await api<ProjectMilestone>(`/ict-projects/projects/${selectedProject.id}/milestones`, {
        method: 'POST',
        body: JSON.stringify({
          name: milestoneForm.name.trim(),
          status: milestoneForm.status,
          targetDate: new Date(milestoneForm.targetDate).toISOString(),
        }),
      });
      setProjects((prev) => prev.map((p) => (
        p.id === selectedProject.id
          ? { ...p, milestones: [...(p.milestones ?? []), saved] }
          : p
      )));
      setSelectedProject((prev) => (
        prev ? { ...prev, milestones: [...(prev.milestones ?? []), saved] } : prev
      ));
      setMilestoneForm({ name: '', status: 'planned', targetDate: '' });
      setMilestoneErrors({});
      setToast({ open: true, message: 'Milestone added', severity: 'success' });
      void loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create milestone');
      setToast({ open: true, message: 'Failed to create milestone', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const removeProject = async () => {
    if (!deleteProject) return;
    setSubmitting(true);
    try {
      await api(`/ict-projects/projects/${deleteProject.id}`, { method: 'DELETE' });
      setProjects((prev) => prev.filter((p) => p.id !== deleteProject.id));
      setToast({ open: true, message: 'Project deleted', severity: 'success' });
      setDeleteProject(null);
      if (selectedProject?.id === deleteProject.id) {
        setSelectedProject(null);
        setMilestoneOpen(false);
      }
      void loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete project');
      setToast({ open: true, message: 'Failed to delete project', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const removeMilestone = async () => {
    if (!selectedProject || !deleteMilestone) return;
    setSubmitting(true);
    try {
      await api(`/ict-projects/projects/${selectedProject.id}/milestones/${deleteMilestone.id}`, { method: 'DELETE' });
      setProjects((prev) => prev.map((p) => (
        p.id === selectedProject.id
          ? { ...p, milestones: (p.milestones ?? []).filter((m) => m.id !== deleteMilestone.id) }
          : p
      )));
      setSelectedProject((prev) => (
        prev ? { ...prev, milestones: (prev.milestones ?? []).filter((m) => m.id !== deleteMilestone.id) } : prev
      ));
      setDeleteMilestone(null);
      setToast({ open: true, message: 'Milestone deleted', severity: 'success' });
      void loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete milestone');
      setToast({ open: true, message: 'Failed to delete milestone', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            ICT Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Portfolio tracking for initiatives, delivery phases, and milestones.
          </Typography>
        </Box>
        {isManager && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetProjectForm();
              setProjectOpen(true);
            }}
          >
            New Project
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {cards.map((c) => (
          <Grid key={c.label} item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                  {c.label}
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {loading ? '...' : c.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mb={2}>
        <TextField
          select
          size="small"
          label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | ProjectStatus)}
          sx={{ minWidth: 220 }}
        >
          {STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Box>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                  <TableCell>Project</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Phase</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Timeline</TableCell>
                  <TableCell>Completion</TableCell>
                  <TableCell>Milestones</TableCell>
                  {isManager && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow><TableCell colSpan={isManager ? 8 : 7} align="center">No projects found.</TableCell></TableRow>
                ) : projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.description || '-'}</Typography>
                    </TableCell>
                    <TableCell>{p.status.replace('_', ' ')}</TableCell>
                    <TableCell>{p.currentPhase}</TableCell>
                    <TableCell>{p.projectManager || '-'}</TableCell>
                    <TableCell>
                      {new Date(p.startDate).toLocaleDateString()}
                      {' -> '}
                      {p.plannedEndDate ? new Date(p.plannedEndDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>{p.completionPercentage}%</TableCell>
                    <TableCell>{p.milestones?.length ?? 0}</TableCell>
                    {isManager && (
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditProject(p)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Milestones">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedProject(p);
                              setMilestoneOpen(true);
                            }}
                          >
                            <FlagIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteProject(p)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={projectOpen} onClose={() => !submitting && setProjectOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingProjectId ? 'Edit Project' : 'Create Project'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Name" fullWidth required value={projectForm.name} onChange={(e) => setProjectForm((s) => ({ ...s, name: e.target.value }))} error={!!projectErrors.name} helperText={projectErrors.name} />
          <TextField margin="dense" label="Description" fullWidth multiline minRows={2} value={projectForm.description} onChange={(e) => setProjectForm((s) => ({ ...s, description: e.target.value }))} />
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <TextField select margin="dense" label="Status" fullWidth value={projectForm.status} onChange={(e) => setProjectForm((s) => ({ ...s, status: e.target.value as ProjectStatus }))}>
                {STATUS_OPTIONS.filter((o) => o.value !== 'all').map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select margin="dense" label="Phase" fullWidth value={projectForm.currentPhase} onChange={(e) => setProjectForm((s) => ({ ...s, currentPhase: e.target.value as ProjectPhase }))}>
                {PHASE_OPTIONS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <TextField margin="dense" label="Project Manager (email)" fullWidth value={projectForm.projectManager} onChange={(e) => setProjectForm((s) => ({ ...s, projectManager: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField margin="dense" label="Sponsor (email)" fullWidth value={projectForm.sponsor} onChange={(e) => setProjectForm((s) => ({ ...s, sponsor: e.target.value }))} />
            </Grid>
          </Grid>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <TextField margin="dense" type="date" label="Start Date" fullWidth required InputLabelProps={{ shrink: true }} value={projectForm.startDate} onChange={(e) => setProjectForm((s) => ({ ...s, startDate: e.target.value }))} error={!!projectErrors.startDate} helperText={projectErrors.startDate} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField margin="dense" type="date" label="Planned End Date" fullWidth InputLabelProps={{ shrink: true }} value={projectForm.plannedEndDate} onChange={(e) => setProjectForm((s) => ({ ...s, plannedEndDate: e.target.value }))} />
            </Grid>
          </Grid>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <TextField margin="dense" label="Budget" fullWidth value={projectForm.budget} onChange={(e) => setProjectForm((s) => ({ ...s, budget: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField margin="dense" type="number" label="Completion %" fullWidth value={projectForm.completionPercentage} onChange={(e) => setProjectForm((s) => ({ ...s, completionPercentage: e.target.value }))} error={!!projectErrors.completionPercentage} helperText={projectErrors.completionPercentage} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setProjectOpen(false); resetProjectForm(); }} disabled={submitting}>Cancel</Button>
          <Button onClick={saveProject} variant="contained" disabled={submitting || !projectForm.name.trim() || !projectForm.startDate}>
            {editingProjectId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={milestoneOpen} onClose={() => !submitting && setMilestoneOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Milestones{selectedProject ? ` - ${selectedProject.name}` : ''}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={1} sx={{ mb: 1 }}>
            <Grid item xs={12} md={5}>
              <TextField margin="dense" label="Milestone Name" fullWidth required value={milestoneForm.name} onChange={(e) => setMilestoneForm((s) => ({ ...s, name: e.target.value }))} error={!!milestoneErrors.name} helperText={milestoneErrors.name} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select margin="dense" label="Status" fullWidth value={milestoneForm.status} onChange={(e) => setMilestoneForm((s) => ({ ...s, status: e.target.value as MilestoneStatus }))}>
                <MenuItem value="planned">Planned</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="at_risk">At Risk</MenuItem>
                <MenuItem value="delayed">Delayed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField margin="dense" type="date" label="Target Date" fullWidth required InputLabelProps={{ shrink: true }} value={milestoneForm.targetDate} onChange={(e) => setMilestoneForm((s) => ({ ...s, targetDate: e.target.value }))} error={!!milestoneErrors.targetDate} helperText={milestoneErrors.targetDate} />
            </Grid>
            <Grid item xs={12} md={2} display="flex" alignItems="center">
              <Button
                fullWidth
                variant="contained"
                onClick={createMilestone}
                disabled={submitting || !selectedProject || !milestoneForm.name.trim() || !milestoneForm.targetDate}
              >
                Add
              </Button>
            </Grid>
          </Grid>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Target Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(selectedProject?.milestones?.length ?? 0) === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center">No milestones yet.</TableCell></TableRow>
                ) : (selectedProject?.milestones ?? []).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.status.replace('_', ' ')}</TableCell>
                    <TableCell>{new Date(m.targetDate).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteMilestone(m)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMilestoneOpen(false)} disabled={submitting}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteProject} onClose={() => !submitting && setDeleteProject(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Delete project "{deleteProject?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteProject(null)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={removeProject} disabled={submitting}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteMilestone} onClose={() => !submitting && setDeleteMilestone(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Milestone</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Delete milestone "{deleteMilestone?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteMilestone(null)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={removeMilestone} disabled={submitting || !selectedProject}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={2800}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToast((t) => ({ ...t, open: false }))} severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
