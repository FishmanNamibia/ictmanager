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

type License = {
  id: string;
  softwareName: string;
  licenseType: string;
  totalSeats: number;
  usedSeats: number;
  expiryDate: string | null;
  vendorName: string | null;
};

export default function LicensesPage() {
  const [list, setList] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<License[]>('/licenses')
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Software & license management</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>Add license</Button>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        License compliance, seat usage, and expiry tracking.
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
                    <TableCell>Software</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Seats</TableCell>
                    <TableCell>Expiry</TableCell>
                    <TableCell>Vendor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">No licenses yet.</TableCell></TableRow>
                  ) : (
                    list.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{l.softwareName}</TableCell>
                        <TableCell>{l.licenseType}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={`${l.usedSeats}/${l.totalSeats}`}
                            color={l.usedSeats > l.totalSeats ? 'error' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{l.expiryDate ?? '—'}</TableCell>
                        <TableCell>{l.vendorName ?? '—'}</TableCell>
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
