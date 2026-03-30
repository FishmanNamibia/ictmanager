'use client';

import { useCallback, useEffect, useState } from 'react';
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
  FormControlLabel,
  MenuItem,
  Skeleton,
  Switch,
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
import EditIcon from '@mui/icons-material/Edit';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { APP_ROLES, AppUserRole } from '@/lib/tenant-settings';

type TenantUser = {
  id: string;
  email: string;
  fullName: string;
  role: AppUserRole;
  active: boolean;
  department: string | null;
  jobTitle: string | null;
  createdAt: string;
  updatedAt: string;
};

const emptyCreate = {
  email: '',
  password: '',
  fullName: '',
  role: 'ict_staff' as AppUserRole,
  department: '',
  jobTitle: '',
};

export default function UserAccountsPage() {
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [createSaving, setCreateSaving] = useState(false);

  const [editRow, setEditRow] = useState<TenantUser | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    role: 'ict_staff' as AppUserRole,
    active: true,
    department: '',
    jobTitle: '',
    password: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await api<TenantUser[]>('/users');
      setRows(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const roleLabel = (id: string) => APP_ROLES.find((r) => r.id === id)?.label ?? id;

  const openCreate = () => {
    setCreateForm(emptyCreate);
    setNotice(null);
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    setCreateSaving(true);
    setError(null);
    try {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify({
          email: createForm.email.trim(),
          password: createForm.password,
          fullName: createForm.fullName.trim(),
          role: createForm.role,
          department: createForm.department.trim() || undefined,
          jobTitle: createForm.jobTitle.trim() || undefined,
        }),
      });
      setNotice('User created. They can sign in with the email and password you set.');
      setCreateOpen(false);
      setCreateForm(emptyCreate);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setCreateSaving(false);
    }
  };

  const openEdit = (u: TenantUser) => {
    setEditRow(u);
    setEditForm({
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      active: u.active,
      department: u.department ?? '',
      jobTitle: u.jobTitle ?? '',
      password: '',
    });
    setNotice(null);
    setError(null);
  };

  const submitEdit = async () => {
    if (!editRow) return;
    setEditSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        active: editForm.active,
        department: editForm.department.trim() || undefined,
        jobTitle: editForm.jobTitle.trim() || undefined,
      };
      if (editForm.password.trim().length > 0) {
        body.password = editForm.password;
      }
      await api(`/users/${editRow.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setNotice('User updated.');
      setEditRow(null);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        User accounts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create sign-in accounts for your organisation and assign roles. Roles control which modules each person can open
        (you can refine module access under Settings). This is separate from <strong>Staff &amp; Skills</strong>, which
        tracks HR and capacity records.
      </Typography>

      {notice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Add user
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5].map((j) => (
                        <TableCell key={j}>
                          <Skeleton width={j === 1 ? 160 : 100} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="text.secondary">No users yet. Add your team members above.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell>{u.fullName}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Chip size="small" label={roleLabel(u.role)} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={u.active ? 'Active' : 'Inactive'}
                          color={u.active ? 'success' : 'default'}
                          variant={u.active ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(u)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onClose={() => !createSaving && setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add user</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Full name"
            fullWidth
            required
            value={createForm.fullName}
            onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Email (sign-in)"
            type="email"
            fullWidth
            required
            value={createForm.email}
            onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Initial password"
            type="password"
            fullWidth
            required
            helperText="At least 8 characters. User can change this later if you add password reset."
            value={createForm.password}
            onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
          />
          <TextField
            margin="dense"
            select
            label="Role"
            fullWidth
            value={createForm.role}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, role: e.target.value as AppUserRole }))
            }
          >
            {APP_ROLES.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Department (optional)"
            fullWidth
            value={createForm.department}
            onChange={(e) => setCreateForm((f) => ({ ...f, department: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Job title (optional)"
            fullWidth
            value={createForm.jobTitle}
            onChange={(e) => setCreateForm((f) => ({ ...f, jobTitle: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={createSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void submitCreate()}
            disabled={
              createSaving ||
              !createForm.email.trim() ||
              !createForm.fullName.trim() ||
              createForm.password.length < 8
            }
          >
            {createSaving ? 'Saving…' : 'Create user'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editRow} onClose={() => !editSaving && setEditRow(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit user</DialogTitle>
        <DialogContent>
          {editRow && currentUser?.id === editRow.id && (
            <Alert severity="info" sx={{ mb: 2 }}>
              You are editing your own account. You cannot remove the last ICT Manager from the organisation.
            </Alert>
          )}
          <TextField
            margin="dense"
            label="Full name"
            fullWidth
            value={editForm.fullName}
            onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={editForm.email}
            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
          />
          <TextField
            margin="dense"
            select
            label="Role"
            fullWidth
            value={editForm.role}
            onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as AppUserRole }))}
          >
            {APP_ROLES.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={editForm.active}
                onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.checked }))}
              />
            }
            label="Active (can sign in)"
            sx={{ display: 'block', mt: 1 }}
          />
          <TextField
            margin="dense"
            label="New password (optional)"
            type="password"
            fullWidth
            helperText="Leave blank to keep current password. Minimum 8 characters if set."
            value={editForm.password}
            onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Department"
            fullWidth
            value={editForm.department}
            onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Job title"
            fullWidth
            value={editForm.jobTitle}
            onChange={(e) => setEditForm((f) => ({ ...f, jobTitle: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRow(null)} disabled={editSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void submitEdit()} disabled={editSaving}>
            {editSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
