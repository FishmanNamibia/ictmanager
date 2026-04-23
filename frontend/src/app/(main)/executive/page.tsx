'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Stack,
  LinearProgress,
} from '@mui/material';
import Download from '@mui/icons-material/Download';
import Refresh from '@mui/icons-material/Refresh';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Security from '@mui/icons-material/Security';
import Computer from '@mui/icons-material/Computer';
import Assessment from '@mui/icons-material/Assessment';
import Warning from '@mui/icons-material/Warning';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Info from '@mui/icons-material/Info';
import Timeline from '@mui/icons-material/Timeline';
import PieChart from '@mui/icons-material/PieChart';
import BarChart from '@mui/icons-material/BarChart';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import Shield from '@mui/icons-material/Shield';
import Storage from '@mui/icons-material/Storage';
import Business from '@mui/icons-material/Business';
import People from '@mui/icons-material/People';
import Assignment from '@mui/icons-material/Assignment';
import CloudDownload from '@mui/icons-material/CloudDownload';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart,
} from 'recharts';

const getChartColors = (theme: any) => [
  theme.palette.primary.main,
  theme.palette.success.main,
  theme.palette.warning.main,
  theme.palette.error.main,
  '#7b1fa2',
  '#00796b',
  '#c62828',
  '#0288d1',
];

interface ExecutiveData {
  headline: {
    posture: 'stable' | 'watch' | 'critical';
    ictPerformanceScore: number;
    summary: string;
  };
  executiveSummary: {
    overallInstitutionalIctPosture: string;
    keyAchievementsThisPeriod: string[];
    topRisksAndWatchItems: string[];
    majorDecisionsRequiredFromManagement: string[];
    urgentManagementActions: string[];
  };
  sections: Array<{
    title: string;
    summary: string;
    keyMetrics: Array<{
      label: string;
      value: string | number;
      status: 'good' | 'warning' | 'critical';
    }>;
    keyRisks: string[];
    recommendations: string[];
    boardAttentionLevel: 'low' | 'medium' | 'high' | 'critical';
    dataConfidence: {
      level: 'high' | 'moderate' | 'low';
      narrative: string;
    };
  }>;
  topRisks: string[];
  watchItems: string[];
  decisionsRequired: string[];
  recommendations: string[];
  managementActionRegister: Array<{
    issue: string;
    explanation: string;
    businessImpact: string;
    recommendedAction: string;
    owner: string;
    dueDate: string;
    priority: string;
    status: string;
    escalationRequired: boolean;
  }>;
  generatedAt: string;
}

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  return '/api';
};

export default function ExecutiveDashboard() {
  const theme = useTheme();
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('iictms_token');
      const response = await fetch(`${getApiBaseUrl()}/dashboards/executive/report`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Failed to fetch executive data');
      }

      const result = await response.json();
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      setError((err as Error).message || 'Failed to load executive data');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (typeof window === 'undefined') return;
    setDownloadingPdf(true);
    try {
      const token = localStorage.getItem('iictms_token');
      const response = await fetch(`${getApiBaseUrl()}/dashboards/executive/report.pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        let detail = 'Failed to generate PDF report';
        try {
          const errJson = await response.json();
          detail = errJson.detail || errJson.message || detail;
        } catch {}
        throw new Error(detail);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `executive-board-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message || 'Failed to generate PDF report');
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'stable':
      case 'low':
        return theme.palette.success.main;
      case 'warning':
      case 'watch':
      case 'medium':
        return theme.palette.warning.main;
      case 'critical':
      case 'high':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
      case 'stable':
      case 'low':
        return <CheckCircle color="success" />;
      case 'warning':
      case 'watch':
      case 'medium':
        return <Warning color="warning" />;
      case 'critical':
      case 'high':
        return <ErrorIcon color="error" />;
      default:
        return <Info color="info" />;
    }
  };

  const getPostureData = () => {
    if (!data) return [];
    
    return [
      {
        name: 'ICT Performance',
        value: data.headline.ictPerformanceScore,
        max: 100,
        status: data.headline.ictPerformanceScore >= 75 ? 'good' : data.headline.ictPerformanceScore >= 50 ? 'warning' : 'critical',
      },
      {
        name: 'Risk Management',
        value: Math.max(0, 100 - (data.topRisks.length * 15)),
        max: 100,
        status: data.topRisks.length === 0 ? 'good' : data.topRisks.length <= 3 ? 'warning' : 'critical',
      },
      {
        name: 'Data Confidence',
        value: Math.max(0, 100 - (data.sections.filter(s => s.dataConfidence.level === 'low').length * 25)),
        max: 100,
        status: data.sections.filter(s => s.dataConfidence.level === 'low').length === 0 ? 'good' : 'warning',
      },
      {
        name: 'Action Items',
        value: Math.max(0, 100 - (data.managementActionRegister.length * 10)),
        max: 100,
        status: data.managementActionRegister.length <= 5 ? 'good' : data.managementActionRegister.length <= 10 ? 'warning' : 'critical',
      },
    ];
  };

  const getRiskDistributionData = () => {
    if (!data) return [];
    
    return [
      { name: 'Critical', value: data.sections.filter(s => s.boardAttentionLevel === 'critical').length, color: theme.palette.error.main },
      { name: 'High', value: data.sections.filter(s => s.boardAttentionLevel === 'high').length, color: theme.palette.warning.main },
      { name: 'Medium', value: data.sections.filter(s => s.boardAttentionLevel === 'medium').length, color: theme.palette.info.main },
      { name: 'Low', value: data.sections.filter(s => s.boardAttentionLevel === 'low').length, color: theme.palette.success.main },
    ].filter(item => item.value > 0);
  };

  const getSectionMetricsData = () => {
    if (!data) return [];
    
    return data.sections.map(section => ({
      name: section.title.substring(0, 20),
      critical: section.keyMetrics.filter(m => m.status === 'critical').length,
      warning: section.keyMetrics.filter(m => m.status === 'warning').length,
      good: section.keyMetrics.filter(m => m.status === 'good').length,
    }));
  };

  const getActionPriorityData = () => {
    if (!data) return [];
    
    return [
      { name: 'Critical', value: data.managementActionRegister.filter(a => a.priority === 'critical').length },
      { name: 'High', value: data.managementActionRegister.filter(a => a.priority === 'high').length },
      { name: 'Medium', value: data.managementActionRegister.filter(a => a.priority === 'medium').length },
      { name: 'Low', value: data.managementActionRegister.filter(a => a.priority === 'low').length },
    ].filter(item => item.value > 0);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchData} startIcon={<Refresh />}>
          Retry
        </Button>
      </Container>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Executive Dashboard
          </Typography>
          <Box display="flex" gap={2}>
            <Tooltip title="Refresh Data">
              <IconButton color="inherit" onClick={fetchData}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              color="secondary"
              onClick={downloadPdf}
              disabled={downloadingPdf}
              startIcon={downloadingPdf ? <CircularProgress size={20} color="inherit" /> : <Download />}
            >
              {downloadingPdf ? 'Generating...' : 'Download PDF'}
            </Button>
          </Box>
        </Box>
        <Typography variant="subtitle1" mb={2}>
          Comprehensive ICT performance and risk overview for executive leadership
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            icon={getStatusIcon(data.headline.posture)}
            label={`Overall Status: ${data.headline.posture.toUpperCase()}`}
            sx={{
              backgroundColor: getStatusColor(data.headline.posture),
              color: 'white',
              fontWeight: 'bold',
            }}
          />
          <Typography variant="caption">
            Last updated: {lastRefresh.toLocaleString()}
          </Typography>
        </Box>
      </Paper>

      {/* Key Metrics Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid', borderLeftColor: getStatusColor(data.headline.posture) }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" component="div">
                  ICT Score
                </Typography>
                {getStatusIcon(data.headline.posture)}
              </Box>
              <Typography variant="h3" component="div" fontWeight="bold" color={getStatusColor(data.headline.posture)}>
                {data.headline.ictPerformanceScore}/100
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall Performance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid', borderLeftColor: theme.palette.error.main }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" component="div">
                  Top Risks
                </Typography>
                <ErrorIcon color="error" />
              </Box>
              <Typography variant="h3" component="div" fontWeight="bold" color={theme.palette.error.main}>
                {data.topRisks.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Requiring Attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid', borderLeftColor: theme.palette.warning.main }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" component="div">
                  Watch Items
                </Typography>
                <Warning color="warning" />
              </Box>
              <Typography variant="h3" component="div" fontWeight="bold" color={theme.palette.warning.main}>
                {data.watchItems.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Under Monitoring
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid', borderLeftColor: theme.palette.info.main }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" component="div">
                  Actions
                </Typography>
                <Assignment color="info" />
              </Box>
              <Typography variant="h3" component="div" fontWeight="bold" color={theme.palette.info.main}>
                {data.managementActionRegister.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Management Required
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Overview
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getPostureData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={getRiskDistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getRiskDistributionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Executive Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Executive Summary
          </Typography>
          <Typography variant="body1" paragraph>
            {data.headline.summary}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Key Achievements
              </Typography>
              {data.executiveSummary.keyAchievementsThisPeriod.length > 0 ? (
                data.executiveSummary.keyAchievementsThisPeriod.map((achievement, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                    • {achievement}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No major achievements recorded this period.
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                Top Risks & Watch Items
              </Typography>
              {data.executiveSummary.topRisksAndWatchItems.length > 0 ? (
                data.executiveSummary.topRisksAndWatchItems.slice(0, 5).map((item, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                    • {item}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No critical risks identified.
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section Analysis */}
      <Typography variant="h5" gutterBottom>
        Domain Analysis
      </Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {data.sections.map((section, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" component="div">
                    {section.title}
                  </Typography>
                  <Chip
                    size="small"
                    label={section.boardAttentionLevel.toUpperCase()}
                    sx={{
                      backgroundColor: getStatusColor(section.boardAttentionLevel),
                      color: 'white',
                    }}
                  />
                </Box>
                <Typography variant="body2" paragraph>
                  {section.summary}
                </Typography>
                {section.keyRisks && section.keyRisks.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      Key Risks
                    </Typography>
                    {section.keyRisks.slice(0, 2).map((risk, riskIndex) => (
                      <Typography key={riskIndex} variant="body2" sx={{ mb: 0.5 }}>
                        • {risk}
                      </Typography>
                    ))}
                  </Box>
                )}
                {section.recommendations && section.recommendations.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Recommendations
                    </Typography>
                    {section.recommendations.slice(0, 2).map((rec, recIndex) => (
                      <Typography key={recIndex} variant="body2" sx={{ mb: 0.5 }}>
                        • {rec}
                      </Typography>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Action Items */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Management Action Register
          </Typography>
          {data.managementActionRegister.length > 0 ? (
            <Grid container spacing={2}>
              {data.managementActionRegister.slice(0, 6).map((action, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                      <Typography variant="subtitle2" sx={{ flex: 1 }}>
                        {action.issue}
                      </Typography>
                      <Chip
                        size="small"
                        label={action.priority.toUpperCase()}
                        sx={{
                          backgroundColor: getStatusColor(action.priority),
                          color: 'white',
                          ml: 1,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {action.recommendedAction}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Owner: {action.owner}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Due: {action.dueDate}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No urgent management actions required at this time.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
