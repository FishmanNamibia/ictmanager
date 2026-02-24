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

type Vulnerability = {
  id: string;
  cveId: string;
  title: string;
  description?: string;
  severity: string;
  affectedComponent?: string;
  affectedVersion?: string;
  patchVersion?: string;
  status: string;
  targetRemediationDate?: string;
  remediatedDate?: string;
};

const severityColors: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'success',
};

const statusColors: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  identified: 'error',
  acknowledged: 'warning',
  in_progress: 'warning',
  patched: 'success',
  mitigated: 'success',
  wont_fix: 'info',
};

const isOverdue = (targetDate?: string) => {
  if (!targetDate) return false;
  return new Date(targetDate) < new Date();
};

export default function VulnerabilitiesPage() {
  const [list, setList] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    api<Vulnerability[]>('/cybersecurity/vulnerabilities')
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>
          Vulnerability tracking & patch status
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/cybersecurity/vulnerabilities/new')}>
          Report vulnerability
        </Button>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Track known and disclosed vulnerabilities and monitor patch deployment across systems.
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
                    <TableCell>CVE / Title</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Component</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Patch Version</TableCell>
                    <TableCell>Target Remediation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No vulnerabilities logged. Add known CVEs and patch status for tracking.
                      </TableCell>
                    </TableRow>
                  ) : (
                    list.map((vuln) => (
                      <TableRow
                        key={vuln.id}
                        hover
                        onClick={() => router.push(`/cybersecurity/vulnerabilities/${vuln.id}`)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/cybersecurity/vulnerabilities/${vuln.id}`); }}
                        tabIndex={0}
                        role="button"
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          {vuln.cveId && <strong>{vuln.cveId}</strong>}
                          {vuln.cveId && ' — '}
                          {vuln.title}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={vuln.severity} color={severityColors[vuln.severity] || 'default'} />
                        </TableCell>
                        <TableCell>{vuln.affectedComponent || '—'}</TableCell>
                        <TableCell>
                          <Chip size="small" label={vuln.status} color={statusColors[vuln.status] || 'default'} />
                        </TableCell>
                        <TableCell>{vuln.patchVersion || '—'}</TableCell>
                        <TableCell>
                          {vuln.targetRemediationDate ? (
                            <Chip
                              size="small"
                              label={vuln.targetRemediationDate.split('T')[0]}
                              color={isOverdue(vuln.targetRemediationDate) ? 'error' : 'default'}
                              variant={isOverdue(vuln.targetRemediationDate) ? 'filled' : 'outlined'}
                            />
                          ) : (
                            '—'
                          )}
                        </TableCell>
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
