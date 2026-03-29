import { createTheme } from '@mui/material/styles';
import { DEFAULT_TENANT_SETTINGS, TenantThemeSettings } from '@/lib/tenant-settings';
import { ThemeMode } from '@/contexts/ThemeModeContext';

function darken(hexColor: string, amount = 0.12): string {
  const safe = hexColor.replace('#', '');
  const num = parseInt(safe, 16);
  const adjust = (channel: number) => Math.max(0, Math.min(255, Math.round(channel * (1 - amount))));
  const r = adjust((num >> 16) & 0xff);
  const g = adjust((num >> 8) & 0xff);
  const b = adjust(num & 0xff);
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

export function createAppTheme(
  themeSettings?: Partial<TenantThemeSettings>,
  mode: ThemeMode = 'light',
) {
  const primary = themeSettings?.primaryColor ?? DEFAULT_TENANT_SETTINGS.theme.primaryColor;
  const secondary = themeSettings?.secondaryColor ?? DEFAULT_TENANT_SETTINGS.theme.secondaryColor;
  const background = themeSettings?.backgroundColor ?? DEFAULT_TENANT_SETTINGS.theme.backgroundColor;
  const isDark = mode === 'dark';
  const backgroundDefault = isDark ? '#0f1723' : background;
  const backgroundPaper = isDark ? '#162131' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const drawerShadow = isDark ? '1px 0 3px rgba(0,0,0,0.28)' : '1px 0 3px rgba(0,0,0,0.05)';
  const cardShadow = isDark ? '0 2px 6px rgba(0,0,0,0.24)' : '0 1px 3px rgba(0,0,0,0.08)';

  return createTheme({
    palette: {
      mode,
      primary: { main: primary, dark: darken(primary, 0.16) },
      secondary: { main: secondary, dark: darken(secondary, 0.12) },
      background: { default: backgroundDefault, paper: backgroundPaper },
      warning: { main: '#e65100' },
      success: { main: '#2e7d32' },
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none' },
          containedPrimary: {
            backgroundColor: primary,
            '&:hover': { backgroundColor: darken(primary, 0.16) },
          },
          containedSecondary: {
            backgroundColor: secondary,
            color: primary,
            '&:hover': { backgroundColor: darken(secondary, 0.12) },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: cardShadow,
            border: `1px solid ${cardBorder}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: { backgroundColor: primary, boxShadow: 'none' },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${cardBorder}`,
            boxShadow: drawerShadow,
          },
        },
      },
    },
  });
}

export const theme = createAppTheme(undefined, 'light');

export function getLoginPagePalette(themeSettings?: Partial<TenantThemeSettings>) {
  const primary = themeSettings?.primaryColor ?? DEFAULT_TENANT_SETTINGS.theme.primaryColor;
  const secondary = themeSettings?.secondaryColor ?? DEFAULT_TENANT_SETTINGS.theme.secondaryColor;

  return {
    background: primary,
    accent: secondary,
    cardBg: '#ffffff',
    textLight: 'rgba(255,255,255,0.92)',
    textMuted: 'rgba(255,255,255,0.72)',
  };
}
