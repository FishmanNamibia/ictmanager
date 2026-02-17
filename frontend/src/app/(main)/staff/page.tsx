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
  Skeleton,
} from '@mui/material';
import { api } from '@/lib/api';
import AddIcon from '@mui/icons-material/Add';

type StaffProfile = {
  id: string;
  userId: string;
  jobTitle: string | null;
  department: string | null;
  capacityPercent: number | null;
};

export default function StaffPage() {
  const [list, setList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<StaffProfile[]>('/staff')
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>ICT staff, skills & capacity</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>Add staff profile</Button>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Staff profiles, skills matrix, training and workload allocation.
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
                    <TableCell>Job title</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Capacity %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow><TableCell colSpan={3} align="center">No staff profiles yet. Add one and attach skills.</TableCell></TableRow>
                  ) : (
                    list.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.jobTitle ?? '—'}</TableCell>
                        <TableCell>{s.department ?? '—'}</TableCell>
                        <TableCell>{s.capacityPercent != null ? `${s.capacityPercent}%` : '—'}</TableCell>
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
