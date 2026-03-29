'use client';

import { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantSettingsProvider, useTenantSettings } from '@/contexts/TenantSettingsContext';
import { ThemeModeProvider, useThemeMode } from '@/contexts/ThemeModeContext';
import { createAppTheme } from '@/theme';

function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useTenantSettings();
  const { mode } = useThemeMode();
  const theme = useMemo(() => createAppTheme(settings.theme, mode), [mode, settings.theme]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ThemeModeProvider>
            <TenantSettingsProvider>
              <AppThemeProvider>{children}</AppThemeProvider>
            </TenantSettingsProvider>
          </ThemeModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
