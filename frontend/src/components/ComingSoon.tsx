'use client';

import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

type Props = {
  title: string;
  description: string;
  planned?: string[];
};

export default function ComingSoon({ title, description, planned = [] }: Props) {
  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <ConstructionIcon color="action" />
        <Typography variant="h5" fontWeight={700}>
          {title}
        </Typography>
        <Chip label="Coming soon" size="small" color="warning" variant="outlined" />
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Planned for this module
          </Typography>
          {planned.length > 0 ? (
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {planned.map((item, i) => (
                <li key={i}>
                  <Typography variant="body2">{item}</Typography>
                </li>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Full functionality will be added in a future release. See docs/GAPS_AND_ROADMAP.md for the roadmap.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
