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

type AccessReview = {
  id: string;
  title: string;
  description?: string;
  scope?: string;
  status: string;
  dueDate: string;
  lastCompletedDate?: string;
  nextDueDate?: string;
  reviewer?: string;
  usersReviewedCount?: number;
  accessRemovedCount?: number;
};

const statusColors: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  overdue: 'error',
};

const isOverdue = (dueDate: string, status: string) => {
  if (status === 'completed' || status === 'overdue') return false;
  return new Date(dueDate) < new Date();
};

export default function AccessReviewsPage() {
  const [list, setList] = useState<AccessReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    api<AccessReview[]>('/cybersecurity/access-reviews')
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>
          User access reviews
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/cybersecurity/access-reviews/new')}>
          Schedule review
        </Button>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Schedule and track periodic access reviews to ensure least-privilege principle and identify role changes.
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
                    <TableCell>Scope</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Reviewer</TableCell>
                    <TableCell>Users Reviewed / Removed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No access reviews scheduled. Create access reviews to audit user permissions.
                      </TableCell>
                    </TableRow>
                  ) : (
                    list.map((review) => {
                      const overdue = isOverdue(review.dueDate, review.status);
                      const displayStatus = overdue && review.status !== 'completed' ? 'overdue' : review.status;
                      return (
                        <TableRow
                          key={review.id}
                          hover
                          onClick={() => router.push(`/cybersecurity/access-reviews/${review.id}`)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/cybersecurity/access-reviews/${review.id}`); }}
                          tabIndex={0}
                          role="button"
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{review.title}</TableCell>
                          <TableCell>{review.scope || '—'}</TableCell>
                          <TableCell>
                            <Chip size="small" label={displayStatus} color={statusColors[displayStatus] || 'default'} />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={new Date(review.dueDate).toISOString().split('T')[0]}
                              color={overdue && displayStatus !== 'completed' ? 'error' : 'default'}
                              variant={overdue && displayStatus !== 'completed' ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>{review.reviewer || '—'}</TableCell>
                          <TableCell>
                            {review.usersReviewedCount || 0} / {review.accessRemovedCount || 0}
                          </TableCell>
                        </TableRow>
                      );
                    })
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
