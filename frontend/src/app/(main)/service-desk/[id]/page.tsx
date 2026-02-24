'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
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
  resolution?: string | null;
  commentCount: number;
  createdAt: string;
  updatedAt?: string;
};

type TicketComment = {
  id: string;
  ticketId: string;
  commentBy: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
};

type TicketForm = {
  title: string;
  description: string;
  requestType: RequestType;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  reportedBy: string;
  assignedTo: string;
  dueDate: string;
  resolvedDate: string;
  resolution: string;
};

function toInputDate(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function toIsoDate(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function mapTicketToForm(ticket: Ticket): TicketForm {
  return {
    title: ticket.title ?? '',
    description: ticket.description ?? '',
    requestType: ticket.requestType,
    category: ticket.category ?? '',
    status: ticket.status,
    priority: ticket.priority,
    reportedBy: ticket.reportedBy ?? '',
    assignedTo: ticket.assignedTo ?? '',
    dueDate: toInputDate(ticket.dueDate),
    resolvedDate: toInputDate(ticket.resolvedDate),
    resolution: ticket.resolution ?? '',
  };
}

const STATUS_COLORS: Record<TicketStatus, 'default' | 'warning' | 'success' | 'info'> = {
  open: 'warning',
  in_progress: 'info',
  waiting_user: 'default',
  resolved: 'success',
  closed: 'default',
};

const PRIORITY_COLORS: Record<TicketPriority, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

export default function ServiceDeskTicketDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const canManage = user?.role === 'ict_manager';
  const canComment = user?.role === 'ict_manager' || user?.role === 'ict_staff';

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [form, setForm] = useState<TicketForm | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const ticketSummary = useMemo(() => {
    if (!ticket) return '';
    return `${ticket.ticketNumber} - ${ticket.title}`;
  }, [ticket]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketData, commentData] = await Promise.all([
        api<Ticket>(`/service-desk/tickets/${id}`),
        api<TicketComment[]>(`/service-desk/tickets/${id}/comments`),
      ]);
      setTicket(ticketData);
      setForm(mapTicketToForm(ticketData));
      setComments(commentData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    if (!form || !canManage || !form.title.trim() || !form.reportedBy.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await api<Ticket>(`/service-desk/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          requestType: form.requestType,
          category: form.category.trim() || undefined,
          status: form.status,
          priority: form.priority,
          reportedBy: form.reportedBy.trim(),
          assignedTo: form.assignedTo.trim() || undefined,
          dueDate: toIsoDate(form.dueDate),
          resolvedDate: toIsoDate(form.resolvedDate),
          resolution: form.resolution.trim() || undefined,
        }),
      });
      setTicket(updated);
      setForm(mapTicketToForm(updated));
      setNotice('Ticket updated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update ticket');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!canManage) return;
    const confirmed = window.confirm('Delete this ticket? This action cannot be undone.');
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/service-desk/tickets/${id}`, { method: 'DELETE' });
      router.push('/service-desk');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete ticket');
      setBusy(false);
    }
  };

  const onAddComment = async () => {
    if (!canComment || !commentContent.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api<TicketComment>(`/service-desk/tickets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          commentBy: user?.email ?? 'unknown@local',
          content: commentContent.trim(),
          isInternal: commentInternal,
        }),
      });
      setCommentContent('');
      setCommentInternal(false);
      await load();
      setNotice('Comment added.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add comment');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !form || !ticket) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Service ticket
        </Typography>
        <Skeleton variant="rectangular" height={320} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        Service ticket
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {ticketSummary}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Ticket number"
                    fullWidth
                    value={ticket.ticketNumber}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    label="Status"
                    fullWidth
                    value={form.status}
                    disabled={!canManage || busy}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, status: e.target.value as TicketStatus } : prev))}
                  >
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="in_progress">In progress</MenuItem>
                    <MenuItem value="waiting_user">Waiting user</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    label="Priority"
                    fullWidth
                    value={form.priority}
                    disabled={!canManage || busy}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, priority: e.target.value as TicketPriority } : prev))}
                  >
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Title"
                    fullWidth
                    required
                    value={form.title}
                    disabled={!canManage || busy}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    label="Request type"
                    fullWidth
                    value={form.requestType}
                    disabled={!canManage || busy}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, requestType: e.target.value as RequestType } : prev))}
                  >
                    <MenuItem value="incident">Incident</MenuItem>
                    <MenuItem value="service_request">Service request</MenuItem>
                    <MenuItem value="change_request">Change request</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Category"
                    fullWidth
                    value={form.category}
                    disabled={!canManage || busy}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, category: e.target.value } : prev))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Reported by"
                    fullWidth
                    required
                    value={form.reportedBy}
                    disabled={!canManage || busy}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, reportedBy: e.target.value } : prev))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Assigned to"
                    fullWidth
                    value={form.assignedTo}
                    disabled={!canManage || busy}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, assignedTo: e.target.value } : prev))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Due date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={form.dueDate}
                    disabled={!canManage || busy}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, dueDate: e.target.value } : prev))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Resolved date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={form.resolvedDate}
                    disabled={!canManage || busy}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, resolvedDate: e.target.value } : prev))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    minRows={3}
                    value={form.description}
                    disabled={!canManage || busy}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Resolution"
                    fullWidth
                    multiline
                    minRows={2}
                    value={form.resolution}
                    disabled={!canManage || busy}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, resolution: e.target.value } : prev))}
                  />
                </Grid>
              </Grid>

              <Box display="flex" justifyContent="space-between" mt={3} gap={1} flexWrap="wrap">
                <Button variant="outlined" onClick={() => router.push('/service-desk')} disabled={busy}>
                  Back to tickets
                </Button>
                <Box display="flex" gap={1}>
                  {canManage && (
                    <Button color="error" variant="outlined" onClick={() => void onDelete()} disabled={busy}>
                      Delete
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    onClick={() => void onSave()}
                    disabled={!canManage || busy || !form.title.trim() || !form.reportedBy.trim()}
                  >
                    Save changes
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Current status
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip size="small" label={ticket.status.replace('_', ' ')} color={STATUS_COLORS[ticket.status]} />
                <Chip size="small" label={ticket.priority} color={PRIORITY_COLORS[ticket.priority]} />
                <Chip size="small" label={ticket.requestType.replace('_', ' ')} variant="outlined" />
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                Created: {new Date(ticket.createdAt).toLocaleString()}
              </Typography>
              {ticket.updatedAt && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Updated: {new Date(ticket.updatedAt).toLocaleString()}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" display="block">
                Comments: {comments.length}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" mb={1}>
                Comments
              </Typography>

              {comments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" mb={2}>
                  No comments yet.
                </Typography>
              ) : (
                <Box display="flex" flexDirection="column" gap={1} mb={2}>
                  {comments.map((comment) => (
                    <Box
                      key={comment.id}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}
                    >
                      <Typography variant="caption" color="text.secondary" display="block">
                        {comment.commentBy} | {new Date(comment.createdAt).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {comment.content}
                      </Typography>
                      {comment.isInternal && (
                        <Chip size="small" label="Internal note" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              <TextField
                label="Add comment"
                fullWidth
                multiline
                minRows={3}
                value={commentContent}
                disabled={!canComment || busy}
                onChange={(e) => setCommentContent(e.target.value)}
              />
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={commentInternal}
                    onChange={(e) => setCommentInternal(e.target.checked)}
                    disabled={!canComment || busy || !canManage}
                  />
                )}
                label="Internal note"
              />
              <Button
                variant="contained"
                fullWidth
                onClick={() => void onAddComment()}
                disabled={!canComment || busy || !commentContent.trim()}
              >
                Post comment
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
