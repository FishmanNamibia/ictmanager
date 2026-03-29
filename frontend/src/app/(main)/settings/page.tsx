'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantSettings } from '@/contexts/TenantSettingsContext';
import { APP_MODULES, APP_ROLES, AppUserRole, OPTIONAL_APP_MODULES, TenantSettings } from '@/lib/tenant-settings';

type SettingsFormState = {
  organizationName: string;
  systemName: string;
  logoUrl: string;
  tagline: string;
  loginHeadline: string;
  loginSubtext: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  enabledModules: string[];
  roleModules: Record<AppUserRole, string[]>;
};

function settingsToForm(settings: TenantSettings): SettingsFormState {
  return {
    organizationName: settings.branding.organizationName,
    systemName: settings.branding.systemName,
    logoUrl: settings.branding.logoUrl,
    tagline: settings.branding.tagline,
    loginHeadline: settings.branding.loginHeadline,
    loginSubtext: settings.branding.loginSubtext,
    primaryColor: settings.theme.primaryColor,
    secondaryColor: settings.theme.secondaryColor,
    backgroundColor: settings.theme.backgroundColor,
    enabledModules: settings.modules.enabled,
    roleModules: settings.access.roleModules,
  };
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, loading, updateSettings } = useTenantSettings();
  const [form, setForm] = useState<SettingsFormState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canManage = user?.role === 'ict_manager';

  useEffect(() => {
    setForm(settingsToForm(settings));
  }, [settings]);

  const selectedModules = useMemo(
    () => OPTIONAL_APP_MODULES.filter((module) => form?.enabledModules.includes(module.id)),
    [form?.enabledModules],
  );
  const roleVisibleModules = useMemo(
    () => OPTIONAL_APP_MODULES.filter((module) => form?.enabledModules.includes(module.id)),
    [form?.enabledModules],
  );

  if (loading || !form) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const setField = <K extends keyof SettingsFormState>(key: K, value: SettingsFormState[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const toggleModule = (moduleId: string) => {
    setForm((current) => {
      if (!current) return current;
      const nextEnabled = current.enabledModules.includes(moduleId)
        ? current.enabledModules.filter((id) => id !== moduleId)
        : [...current.enabledModules, moduleId];
      return { ...current, enabledModules: nextEnabled };
    });
  };

  const toggleRoleModule = (roleId: AppUserRole, moduleId: string) => {
    setForm((current) => {
      if (!current) return current;
      const currentModules = current.roleModules[roleId] ?? [];
      const nextModules = currentModules.includes(moduleId)
        ? currentModules.filter((id) => id !== moduleId)
        : [...currentModules, moduleId];
      return {
        ...current,
        roleModules: {
          ...current.roleModules,
          [roleId]: nextModules,
        },
      };
    });
  };

  const handleSave = async () => {
    if (!canManage) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await updateSettings({
        branding: {
          organizationName: form.organizationName.trim(),
          systemName: form.systemName.trim(),
          logoUrl: form.logoUrl.trim(),
          tagline: form.tagline.trim(),
          loginHeadline: form.loginHeadline.trim(),
          loginSubtext: form.loginSubtext.trim(),
        },
        theme: {
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          backgroundColor: form.backgroundColor,
        },
        modules: {
          enabled: APP_MODULES
            .filter((module) => module.core || form.enabledModules.includes(module.id))
            .map((module) => module.id),
        },
        access: {
          roleModules: APP_ROLES.reduce<Record<string, string[]>>((acc, role) => {
            acc[role.id] = (form.roleModules[role.id] ?? []).filter((moduleId) =>
              form.enabledModules.includes(moduleId),
            );
            return acc;
          }, {}),
        },
      });
      setNotice('Tenant branding, theme, company modules, and role view access updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Tenant Settings</Typography>
          <Typography color="text.secondary">
            Control organisation branding, theme colours, and which modules are available to this tenant.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => void handleSave()} disabled={!canManage || saving}>
          {saving ? 'Saving...' : 'Save settings'}
        </Button>
      </Box>

      {!canManage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You can view branding and module settings, but only an ICT manager can change them.
        </Alert>
      )}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Branding</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Organisation Name"
                    value={form.organizationName}
                    onChange={(event) => setField('organizationName', event.target.value)}
                    fullWidth
                    disabled={!canManage}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="System Name"
                    value={form.systemName}
                    onChange={(event) => setField('systemName', event.target.value)}
                    fullWidth
                    disabled={!canManage}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Logo URL"
                    value={form.logoUrl}
                    onChange={(event) => setField('logoUrl', event.target.value)}
                    fullWidth
                    disabled={!canManage}
                    helperText="Use an internal or public image URL. Leave blank to use the default logo."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Header Tagline"
                    value={form.tagline}
                    onChange={(event) => setField('tagline', event.target.value)}
                    fullWidth
                    disabled={!canManage}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Login Headline"
                    value={form.loginHeadline}
                    onChange={(event) => setField('loginHeadline', event.target.value)}
                    fullWidth
                    disabled={!canManage}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Login Intro Text"
                    value={form.loginSubtext}
                    onChange={(event) => setField('loginSubtext', event.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                    disabled={!canManage}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Theme</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Primary Color"
                    type="color"
                    value={form.primaryColor}
                    onChange={(event) => setField('primaryColor', event.target.value)}
                    fullWidth
                    disabled={!canManage}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Secondary Color"
                    type="color"
                    value={form.secondaryColor}
                    onChange={(event) => setField('secondaryColor', event.target.value)}
                    fullWidth
                    disabled={!canManage}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Background Color"
                    type="color"
                    value={form.backgroundColor}
                    onChange={(event) => setField('backgroundColor', event.target.value)}
                    fullWidth
                    disabled={!canManage}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Enabled Modules</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                My Desk and Settings stay available. Turn the optional modules on or off for this tenant.
              </Typography>
              <Stack spacing={1}>
                {OPTIONAL_APP_MODULES.map((module) => (
                  <Box
                    key={module.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <FormControlLabel
                      control={(
                        <Checkbox
                          checked={form.enabledModules.includes(module.id)}
                          onChange={() => toggleModule(module.id)}
                          disabled={!canManage}
                        />
                      )}
                      label={(
                        <Box>
                          <Typography fontWeight={600}>{module.label}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {module.description}
                          </Typography>
                        </Box>
                      )}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Role View Access</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Restrict which enabled modules each role may open. This applies even when the module is active for the tenant.
              </Typography>
              <Stack spacing={2}>
                {APP_ROLES.map((role) => (
                  <Box
                    key={role.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography fontWeight={700} sx={{ mb: 1 }}>{role.label}</Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {roleVisibleModules.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Enable tenant modules first before assigning them to roles.
                        </Typography>
                      ) : (
                        roleVisibleModules.map((module) => (
                          <FormControlLabel
                            key={`${role.id}-${module.id}`}
                            control={(
                              <Checkbox
                                checked={(form.roleModules[role.id] ?? []).includes(module.id)}
                                onChange={() => toggleRoleModule(role.id, module.id)}
                                disabled={!canManage}
                              />
                            )}
                            label={module.label}
                          />
                        ))
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Preview</Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: form.primaryColor,
                  color: '#fff',
                  mb: 2,
                }}
              >
                <Typography variant="overline" sx={{ opacity: 0.84 }}>{form.organizationName}</Typography>
                <Typography variant="h6" fontWeight={700}>{form.systemName}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.78 }}>{form.tagline}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {selectedModules.map((module) => (
                  <Chip key={module.id} label={module.label} sx={{ bgcolor: form.secondaryColor, color: form.primaryColor }} />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Role access snapshot
              </Typography>
              <Stack spacing={1} sx={{ mb: 2 }}>
                {APP_ROLES.map((role) => (
                  <Box key={`preview-${role.id}`}>
                    <Typography variant="body2" fontWeight={600}>{role.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(form.roleModules[role.id] ?? [])
                        .filter((moduleId) => form.enabledModules.includes(moduleId))
                        .map((moduleId) => OPTIONAL_APP_MODULES.find((module) => module.id === moduleId)?.label ?? moduleId)
                        .join(', ') || 'No optional modules assigned'}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block">
                Login headline preview
              </Typography>
              <Typography fontWeight={700} sx={{ mb: 1 }}>{form.loginHeadline}</Typography>
              <Typography variant="body2" color="text.secondary">
                {form.loginSubtext}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
