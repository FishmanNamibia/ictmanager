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

type Risk = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  likelihood: string;
  impact: string;
  overallRisk: string;
  status: string;
  owner?: string;
  reviewDue?: string;
};

const riskColors: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'success',
};

const statusColors: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  identified: 'info',
  mitigating: 'warning',
  monitored: 'info',
  resolved: 'success',
};

export default function RisksPage() {
  const [list, setList] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    api<Risk[]>('/cybersecurity/risks')
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>
          ICT risk register
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/cybersecurity/risks/new')}>
          Register risk
        </Button>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Identify, assess, and track information security risks and mitigation strategies.
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
                    <TableCell>Category</TableCell>
                    <TableCell>Likelihood</TableCell>
                    <TableCell>Impact</TableCell>
                    <TableCell>Overall Risk</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Owner</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No risks registered. Add risks to build and manage your risk register.
                      </TableCell>
                    </TableRow>
                  ) : (
                    list.map((risk) => (
                      <TableRow
                        key={risk.id}
                        hover
                        onClick={() => router.push(`/cybersecurity/risks/${risk.id}`)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/cybersecurity/risks/${risk.id}`); }}
                        tabIndex={0}
                        role="button"
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{risk.title}</TableCell>
                        <TableCell>{risk.category || '—'}</TableCell>
                        <TableCell>
                          <Chip size="small" label={risk.likelihood} color={riskColors[risk.likelihood] || 'default'} />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={risk.impact} color={riskColors[risk.impact] || 'default'} />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={risk.overallRisk} color={riskColors[risk.overallRisk] || 'default'} variant="filled" />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={risk.status} color={statusColors[risk.status] || 'default'} />
                        </TableCell>
                        <TableCell>{risk.owner || '—'}</TableCell>
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
