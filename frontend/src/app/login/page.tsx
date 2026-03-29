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
} from '@mui/material';
import {
  Computer as AssetIcon,
  Apps as AppsIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { getLoginPagePalette } from '@/theme';
import { SESSION_EXPIRED_NOTICE_KEY, tenantApi } from '@/lib/api';
import { DEFAULT_TENANT_SETTINGS, normalizeTenantSettings, PublicTenantBranding } from '@/lib/tenant-settings';

type FormData = { email: string; password: string };

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
  const [branding, setBranding] = useState<PublicTenantBranding | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const effectiveSettings = branding
    ? normalizeTenantSettings({
        tenantId: branding.tenantId,
        tenantSlug: branding.tenantSlug,
        branding: branding.branding,
        theme: branding.theme,
      })
    : DEFAULT_TENANT_SETTINGS;
  const loginPagePalette = getLoginPagePalette(effectiveSettings.theme);

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

  useEffect(() => {
    setLogoSrc(effectiveSettings.branding.logoUrl || '/logo/ict-management-system.png');
  }, [effectiveSettings.branding.logoUrl]);

  useEffect(() => {
    let active = true;
    void tenantApi.getDefaultBranding()
      .then((result) => {
        if (active) setBranding(result);
      })
      .catch(() => {
        if (active) setBranding(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    setError(null);
    setSubmitting(true);
    try {
      await login(data.email.trim(), data.password);
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
          {effectiveSettings.branding.organizationName.toUpperCase()}
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
          {effectiveSettings.branding.loginHeadline}
        </Typography>
        <Typography sx={{ color: loginPagePalette.textMuted, mb: 3, maxWidth: 520 }}>
          {effectiveSettings.branding.loginSubtext}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <img
                src={logoSrc}
                alt={effectiveSettings.branding.organizationName}
                width={56}
                height={56}
                style={{ objectFit: 'contain', borderRadius: 8 }}
                onError={() => setLogoSrc('/logo/ict-management-system.png')}
              />
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1 }}>
                  {effectiveSettings.branding.organizationName}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {effectiveSettings.branding.systemName}
                </Typography>
              </Box>
            </Box>
            <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1 }}>
              SECURE SIGN-IN
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {effectiveSettings.branding.tagline}. Sign in with your email and password.
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
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
              sx={{ lineHeight: 1.5, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}
            >
              <MuiLink
                href="https://dynaverseinvestment.com"
                target="_blank"
                rel="noreferrer"
                underline="hover"
                color="inherit"
              >
                dyanverse investment product
              </MuiLink>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
