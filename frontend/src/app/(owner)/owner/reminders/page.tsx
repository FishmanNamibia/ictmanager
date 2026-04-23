'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Typography,
} from '@mui/material';
import {
  NotificationsActive as BellIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
} from '@mui/icons-material';

export default function UserRemindersPage() {
  const [filter, setFilter] = useState('all');

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>User Reminders</Typography>
          <Typography color="text.secondary">
            Send and manage reminders for subscription renewals and overdue payments.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="contained" startIcon={<SendIcon />} sx={{ bgcolor: '#6C63FF', '&:hover': { bgcolor: '#5a52e0' } }}>
            Send Bulk Reminder
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Sent', value: 0, icon: <EmailIcon />, color: '#1976d2' },
          { label: 'Pending', value: 0, icon: <ScheduleIcon />, color: '#ed6c02' },
          { label: 'Upcoming Renewals', value: 0, icon: <BellIcon />, color: '#0288d1' },
          { label: 'Overdue', value: 0, icon: <BellIcon />, color: '#d32f2f' },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card variant="outlined">
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
                <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter */}
      <Box mb={2}>
        <TextField
          select size="small" value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">All Reminders</MenuItem>
          <MenuItem value="sent">Sent</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="failed">Failed</MenuItem>
        </TextField>
      </Box>

      {/* Reminders Table */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ px: 2, pt: 2, pb: 1 }}>
            Reminder History
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Company</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Sent To</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Date Sent</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary', fontStyle: 'italic' }}>
                    No reminders sent yet
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Scheduled Reminders */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} mb={1}>Scheduled Reminders</Typography>
          <Typography variant="body2" color="text.secondary" fontStyle="italic" textAlign="center" py={3}>
            No scheduled reminders. Configure automatic reminders in settings.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
