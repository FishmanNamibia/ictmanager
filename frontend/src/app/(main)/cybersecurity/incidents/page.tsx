'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Skeleton,
} from '@mui/material';
import { api } from '@/lib/api';
import AddIcon from '@mui/icons-material/Add';

type Incident = {
  id: string;
  title: string;
  description?: string;
  severity: string;
  status: string;
  reportedBy?: string;
  dateReported?: string;
  affectedSystems?: string[];
  affectedUsersCount?: number;
};

const severityColors: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'success',
};

const statusColors: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  reported: 'info',
  investigating: 'warning',
  contained: 'warning',
  resolved: 'success',
  closed: 'success',
};

export default function IncidentsPage() {
  const [list, setList] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    api<Incident[]>('/cybersecurity/incidents')
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>
          Security incidents log
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/cybersecurity/incidents/new')}>
          Report incident
        </Button>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Log and track security incidents: detection, containment, and resolution status.
      </Typography>
      <Card>
        <CardContent>
          {loading ? (
            <Skeleton variant="rectangular" height={200} />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reported by</TableCell>
                    <TableCell>Affected Systems</TableCell>
                    <TableCell>Users Affected</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No incidents reported. Create a new incident report when a security event is detected.
                      </TableCell>
                    </TableRow>
                  ) : (
                    list.map((incident) => (
                      <TableRow
                        key={incident.id}
                        hover
                        onClick={() => router.push(`/cybersecurity/incidents/${incident.id}`)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/cybersecurity/incidents/${incident.id}`); }}
                        tabIndex={0}
                        role="button"
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{incident.title}</TableCell>
                        <TableCell>
                          <Chip size="small" label={incident.severity} color={severityColors[incident.severity] || 'default'} />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={incident.status} color={statusColors[incident.status] || 'default'} />
                        </TableCell>
                        <TableCell>{incident.reportedBy || '—'}</TableCell>
                        <TableCell>{incident.affectedSystems?.join(', ') || '—'}</TableCell>
                        <TableCell>{incident.affectedUsersCount ?? '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
