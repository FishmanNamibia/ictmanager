'use client';

import { useEffect, useState } from 'react';
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

type Application = {
  id: string;
  name: string;
  description: string | null;
  businessOwner: string | null;
  ictOwner: string | null;
  hostingType: string;
  criticality: string;
  healthStatus: string;
};

export default function ApplicationsPage() {
  const [list, setList] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Application[]>('/applications')
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <Typography color="error">{error}</Typography>;

  const criticalityColor = (c: string) =>
    c === 'critical' ? 'error' : c === 'high' ? 'warning' : 'default';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Application & systems portfolio</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>Add application</Button>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        System catalog, business/ICT ownership, hosting, criticality and health.
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
                    <TableCell>Name</TableCell>
                    <TableCell>Criticality</TableCell>
                    <TableCell>Hosting</TableCell>
                    <TableCell>Health</TableCell>
                    <TableCell>Business owner</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">No applications yet.</TableCell></TableRow>
                  ) : (
                    list.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.name}</TableCell>
                        <TableCell><Chip label={a.criticality} size="small" color={criticalityColor(a.criticality) as 'error' | 'warning' | 'default'} /></TableCell>
                        <TableCell>{a.hostingType}</TableCell>
                        <TableCell><Chip label={a.healthStatus} size="small" /></TableCell>
                        <TableCell>{a.businessOwner ?? '—'}</TableCell>
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
