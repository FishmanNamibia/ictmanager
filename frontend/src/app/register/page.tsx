'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Link as MuiLink,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Business as OrgIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  CheckCircle as DoneIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { getLoginPagePalette } from '@/theme';
import { DEFAULT_TENANT_SETTINGS } from '@/lib/tenant-settings';

type RegisterForm = {
  organizationName: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const steps = ['Organisation', 'Admin account', 'Review'];

export default function RegisterPage() {
  const { isAuthenticated, loading, setSession } = useAuth();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<RegisterForm>({
    organizationName: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const palette = getLoginPagePalette(DEFAULT_TENANT_SETTINGS.theme);

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, loading, router]);

  if (loading || isAuthenticated) return null;

  const setField = (key: keyof RegisterForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validateStep0 = () => {
    if (form.organizationName.trim().length < 2) {
      setError('Organisation name must be at least 2 characters');
      return false;
    }
    return true;
  };

  const validateStep1 = () => {
    if (form.fullName.trim().length < 2) {
      setError('Full name is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Valid email is required');
      return false;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(form.password)) {
      setError('Password must contain uppercase, lowercase, and a number');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (activeStep === 0 && !validateStep0()) return;
    if (activeStep === 1 && !validateStep1()) return;
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await api<{
        accessToken: string;
        user: { id: string; email: string; fullName: string; role: string; tenantId: string; tenantSlug?: string };
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          organizationName: form.organizationName.trim(),
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });
      setSession(result.accessToken, result.user);
      router.replace('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: palette.background }}>
      {/* Left panel */}
      <Box
        sx={{
          flex: { xs: 0, md: 1 },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          p: 4,
          maxWidth: 600,
        }}
      >
        <Typography variant="overline" sx={{ color: palette.textMuted, letterSpacing: 1 }}>
          I-ICTMS
        </Typography>
        <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700, mt: 1, mb: 2 }}>
          Get started in minutes
        </Typography>
        <Typography sx={{ color: palette.textMuted, mb: 4, maxWidth: 480 }}>
          Register your organisation and set up your ICT management workspace.
          You will be the ICT Manager with full admin access.
        </Typography>
        <Grid container spacing={2}>
          {[
            { icon: <OrgIcon />, title: 'Your organisation', desc: 'Branded workspace with your name and logo.' },
            { icon: <PersonIcon />, title: 'Admin account', desc: 'ICT Manager role with full module access.' },
            { icon: <LockIcon />, title: 'Secure & isolated', desc: 'Tenant-separated data, audit logging enabled.' },
            { icon: <DoneIcon />, title: 'Ready to go', desc: 'All 13 modules enabled — configure as you grow.' },
          ].map((card, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  height: '100%',
                }}
              >
                <Box sx={{ color: palette.accent, mb: 1 }}>{card.icon}</Box>
                <Typography sx={{ color: '#fff', fontWeight: 600, mb: 0.5 }}>{card.title}</Typography>
                <Typography variant="body2" sx={{ color: palette.textMuted }}>{card.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Right panel: registration card */}
      <Box
        sx={{
          width: { xs: '100%', md: 480 },
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 440, borderRadius: 2, boxShadow: { md: '0 4px 24px rgba(0,0,0,0.12)' } }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
              Register your organisation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Step {activeStep + 1} of {steps.length}
            </Typography>

            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {activeStep === 0 && (
              <Box>
                <TextField
                  label="Organisation Name"
                  value={form.organizationName}
                  onChange={(e) => setField('organizationName', e.target.value)}
                  fullWidth
                  autoFocus
                  helperText="The name of your company, department, or institution."
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" onClick={handleNext} sx={{ bgcolor: palette.accent, color: palette.background, '&:hover': { bgcolor: '#b8921f' } }}>
                    Next
                  </Button>
                </Box>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                <TextField
                  label="Your Full Name"
                  value={form.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  fullWidth
                  autoFocus
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  fullWidth
                  helperText="Min 8 chars, uppercase + lowercase + number."
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Confirm Password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button onClick={handleBack}>Back</Button>
                  <Button variant="contained" onClick={handleNext} sx={{ bgcolor: palette.accent, color: palette.background, '&:hover': { bgcolor: '#b8921f' } }}>
                    Next
                  </Button>
                </Box>
              </Box>
            )}

            {activeStep === 2 && (
              <Box>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Organisation</Typography>
                  <Typography fontWeight={600}>{form.organizationName}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Admin name</Typography>
                  <Typography fontWeight={600}>{form.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Admin email</Typography>
                  <Typography fontWeight={600}>{form.email}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Role</Typography>
                  <Typography fontWeight={600}>ICT Manager (full access)</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  By registering, you agree to the platform terms and confirm you are authorised to
                  create a workspace for this organisation.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button onClick={handleBack} disabled={submitting}>Back</Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={submitting}
                    sx={{ bgcolor: palette.accent, color: palette.background, '&:hover': { bgcolor: '#b8921f' } }}
                  >
                    {submitting ? 'Creating workspace…' : 'Create workspace'}
                  </Button>
                </Box>
              </Box>
            )}

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}
            >
              Already have an account?{' '}
              <MuiLink href="/login" underline="hover" fontWeight={600}>
                Sign in
              </MuiLink>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
