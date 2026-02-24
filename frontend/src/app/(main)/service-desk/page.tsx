'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
type RequestType = 'incident' | 'service_request' | 'change_request';

type Ticket = {
  id: string;
  ticketNumber: string;
  title: string;
  description?: string | null;
  requestType: RequestType;
  category?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  reportedBy: string;
  assignedTo?: string | null;
  dueDate?: string | null;
  resolvedDate?: string | null;
  commentCount: number;
  createdAt: string;
};

type ServiceDeskStats = {
  totalTickets: number;
  openTickets: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  averageResolutionTime: number;
  overdueTickets: number;
};

type NewTicketForm = {
  title: string;
  description: string;
  requestType: RequestType;
  category: string;
  priority: TicketPriority;
  reportedBy: string;
  assignedTo: string;
  dueDate: string;
};

const STATUS_OPTIONS: Array<{ value: 'all' | TicketStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_user', label: 'Waiting user' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_COLORS: Record<TicketPriority, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

const STATUS_COLORS: Record<TicketStatus, 'default' | 'warning' | 'success' | 'info'> = {
  open: 'warning',
  in_progress: 'info',
  waiting_user: 'default',
  resolved: 'success',
  closed: 'default',
};

export default function ServiceDeskPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isManager = user?.role === 'ict_manager';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<ServiceDeskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const [form, setForm] = useState<NewTicketForm>({
    title: '',
    description: '',
    requestType: 'service_request',
    category: '',
    priority: 'medium',
    reportedBy: user?.email ?? '',
    assignedTo: '',
    dueDate: '',
  });

  useEffect(() => {
    if (!user?.email) return;
    setForm((prev) => ({ ...prev, reportedBy: prev.reportedBy || user.email }));
  }, [user?.email]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const [ticketData, statData] = await Promise.all([
        api<Ticket[]>(`/service-desk/tickets${params.size ? `?${params.toString()}` : ''}`),
        api<ServiceDeskStats>('/service-desk/dashboard-stats'),
      ]);
      setTickets(ticketData);
      setStats(statData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load service desk data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      requestType: 'service_request',
      category: '',
      priority: 'medium',
      reportedBy: user?.email ?? '',
      assignedTo: '',
      dueDate: '',
    });
  };

  const createTicket = async () => {
    if (!form.title.trim() || !form.reportedBy.trim()) return;
    setSubmitting(true);
    try {
      await api('/service-desk/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          requestType: form.requestType,
          category: form.category.trim() || undefined,
          priority: form.priority,
          reportedBy: form.reportedBy.trim(),
          assignedTo: form.assignedTo.trim() || undefined,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        }),
      });
      setFormOpen(false);
      resetForm();
      fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const markResolved = async (ticket: Ticket) => {
    setResolvingId(ticket.id);
    try {
      await api(`/service-desk/tickets/${ticket.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'resolved',
          resolvedDate: new Date().toISOString(),
        }),
      });
      fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update ticket');
    } finally {
      setResolvingId(null);
    }
  };

  const statCards = useMemo(() => ([
    { label: 'Total Tickets', value: stats?.totalTickets ?? 0 },
    { label: 'Open Tickets', value: stats?.openTickets ?? 0 },
    { label: 'Overdue', value: stats?.overdueTickets ?? 0 },
    { label: 'Avg Resolution (hrs)', value: stats?.averageResolutionTime ?? 0 },
  ]), [stats]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Service Desk
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ticket operations with SLA visibility and resolution tracking.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
          New Ticket
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {statCards.map((card) => (
          <Grid key={card.label} item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                  {card.label}
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {loading ? '…' : card.value}
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
          onChange={(e) => setStatusFilter(e.target.value as 'all' | TicketStatus)}
          sx={{ minWidth: 220 }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
      </Box>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {loading ? (
            <Box p={2}>
              <Skeleton variant="rectangular" height={280} />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                    <TableCell>Ticket</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Requester</TableCell>
                    <TableCell>Assigned</TableCell>
                    <TableCell>Due</TableCell>
                    <TableCell>Comments</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No tickets found for the selected filter.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : tickets.map((t) => (
                    <TableRow
                      key={t.id}
                      hover
                      onClick={() => router.push(`/service-desk/${t.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') router.push(`/service-desk/${t.id}`);
                      }}
                      tabIndex={0}
                      role="button"
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{t.ticketNumber}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{t.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{t.requestType.replace('_', ' ')}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={t.status.replace('_', ' ')} color={STATUS_COLORS[t.status]} />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={t.priority} color={PRIORITY_COLORS[t.priority]} />
                      </TableCell>
                      <TableCell>{t.reportedBy}</TableCell>
                      <TableCell>{t.assignedTo || '—'}</TableCell>
                      <TableCell>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{t.commentCount}</TableCell>
                      <TableCell align="right">
                        {isManager && !['resolved', 'closed'].includes(t.status) ? (
                          <Button
                            size="small"
                            startIcon={<DoneAllIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              void markResolved(t);
                            }}
                            disabled={resolvingId === t.id}
                          >
                            Resolve
                          </Button>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onClose={() => !submitting && setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Ticket</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            margin="dense"
            label="Title"
            fullWidth
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                margin="dense"
                label="Request Type"
                fullWidth
                value={form.requestType}
                onChange={(e) => setForm((p) => ({ ...p, requestType: e.target.value as RequestType }))}
              >
                <MenuItem value="incident">Incident</MenuItem>
                <MenuItem value="service_request">Service Request</MenuItem>
                <MenuItem value="change_request">Change Request</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                margin="dense"
                label="Priority"
                fullWidth
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as TicketPriority }))}
              >
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            label="Category"
            fullWidth
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          />
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Reported By (email)"
                fullWidth
                required
                value={form.reportedBy}
                onChange={(e) => setForm((p) => ({ ...p, reportedBy: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Assign To (email)"
                fullWidth
                value={form.assignedTo}
                onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}
              />
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            type="date"
            label="Due Date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={form.dueDate}
            onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={createTicket} variant="contained" disabled={submitting || !form.title.trim() || !form.reportedBy.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
