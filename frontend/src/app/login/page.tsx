'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
} from '@mui/material';
import {
  Computer as AssetIcon,
  Apps as AppsIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { loginPagePalette } from '@/theme';
import { SESSION_EXPIRED_NOTICE_KEY } from '@/lib/api';

type FormData = { tenantSlug: string; email: string; password: string };

const featureCards = [
  {
    icon: <AssetIcon sx={{ fontSize: 28 }} />,
    title: 'Asset & Software',
    description: 'Hardware inventory, licenses, warranty and lifecycle in one place.',
  },
  {
    icon: <AppsIcon sx={{ fontSize: 28 }} />,
    title: 'Application Portfolio',
    description: 'Business and ICT ownership, criticality and system health.',
  },
  {
    icon: <PeopleIcon sx={{ fontSize: 28 }} />,
    title: 'Staff & Skills',
    description: 'ICT capacity, skills matrix and training tracked in one view.',
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 28 }} />,
    title: 'Security & Compliance',
    description: 'Risk register, access control and audit-ready evidence.',
  },
];

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [logoSrc, setLogoSrc] = useState('/logo/ict-management-system.png');
  const [error, setError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  // Redirect already-authenticated users — do this in useEffect to avoid
  // calling router during render (which triggers React warnings and double nav).
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const notice = sessionStorage.getItem(SESSION_EXPIRED_NOTICE_KEY);
    if (notice) {
      setSessionNotice(notice);
      sessionStorage.removeItem(SESSION_EXPIRED_NOTICE_KEY);
    }
  }, []);

  const onSubmit = async (data: FormData) => {
    setError(null);
    setSubmitting(true);
    try {
      await login(data.tenantSlug.trim(), data.email.trim(), data.password);
      // Single navigation after login — AuthContext state update will also
      // trigger the useEffect above, but router.replace is idempotent.
      router.replace('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render the form while we're checking stored auth or redirecting
  if (loading || isAuthenticated) return null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: loginPagePalette.background,
      }}
    >
      {/* Left: value proposition + feature cards */}
      <Box
        sx={{
          flex: { xs: 0, md: 1 },
          display: { xs: 'none', md: 'block' },
          p: 4,
          maxWidth: 720,
        }}
      >
        <Typography variant="overline" sx={{ color: loginPagePalette.textMuted, letterSpacing: 1 }}>
          INTEGRATED ICT MANAGEMENT SYSTEM
        </Typography>
        <Typography
          variant="h4"
          sx={{
            color: '#fff',
            fontWeight: 700,
            mt: 1,
            mb: 2,
            lineHeight: 1.3,
          }}
        >
          Your digital workspace for{' '}
          <Box component="span" sx={{ color: loginPagePalette.accent }}>
            everyday
          </Box>{' '}
          ICT management.
        </Typography>
        <Typography sx={{ color: loginPagePalette.textMuted, mb: 3, maxWidth: 520 }}>
          Use I-ICTMS to manage assets and licenses, track applications, oversee ICT staff and skills,
          and report on risk and performance — securely, in one place.
        </Typography>
        <Grid container spacing={2}>
          {featureCards.map((card, i) => (
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
                <Box sx={{ color: loginPagePalette.accent, mb: 1 }}>{card.icon}</Box>
                <Typography sx={{ color: '#fff', fontWeight: 600, mb: 0.5 }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" sx={{ color: loginPagePalette.textMuted }}>
                  {card.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Right: sign-in card */}
      <Box
        sx={{
          width: { xs: '100%', md: 440 },
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          bgcolor: { xs: loginPagePalette.background, md: 'transparent' },
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 400,
            boxShadow: { md: '0 4px 24px rgba(0,0,0,0.12)' },
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1 }}>
              SECURE SIGN-IN
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, mb: 0.5 }}>
              I-ICTMS
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Access your ICT command centre. Sign in with your tenant and credentials.
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {sessionNotice && (
              <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setSessionNotice(null)}>
                {sessionNotice}
              </Alert>
            )}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                label="Tenant (slug)"
                fullWidth
                margin="normal"
                required
                {...register('tenantSlug', { required: 'Required' })}
                error={!!errors.tenantSlug}
                helperText={errors.tenantSlug?.message}
                placeholder="e.g. demo"
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                required
                {...register('email', { required: 'Required' })}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                required
                {...register('password', { required: 'Required' })}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={submitting}
                sx={{
                  mt: 2,
                  mb: 2,
                  bgcolor: loginPagePalette.accent,
                  color: loginPagePalette.background,
                  '&:hover': { bgcolor: '#b8921f' },
                }}
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              By signing in, you confirm that you are an authorized user and agree to comply with
              internal governance and security policies. All access is monitored and logged.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

