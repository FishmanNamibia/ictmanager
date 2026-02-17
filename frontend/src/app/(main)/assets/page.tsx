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

type Asset = {
  id: string;
  assetTag: string;
  name: string;
  type: string;
  status: string;
  manufacturer: string | null;
  model: string | null;
  assignedToDepartment: string | null;
};

export default function AssetsPage() {
  const [list, setList] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Asset[]>('/assets')
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Asset & software management</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>Add asset</Button>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Hardware inventory, warranty & lifecycle, assignment and cost tracking.
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
                    <TableCell>Tag</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Department</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">No assets yet. Add one to get started.</TableCell></TableRow>
                  ) : (
                    list.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.assetTag}</TableCell>
                        <TableCell>{a.name}</TableCell>
                        <TableCell><Chip label={a.type} size="small" /></TableCell>
                        <TableCell><Chip label={a.status} size="small" color={a.status === 'active' ? 'success' : 'default'} /></TableCell>
                        <TableCell>{a.assignedToDepartment ?? '—'}</TableCell>
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
