import { createTheme } from '@mui/material/styles';

// My Desk–inspired: dark blue header, gold accent, clean content area
const darkBlue = '#0d2137';
const gold = '#c9a227';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: darkBlue },
    secondary: { main: gold },
    background: { default: '#f0f2f5', paper: '#ffffff' },
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
        containedPrimary: { backgroundColor: darkBlue, '&:hover': { backgroundColor: '#0a1a2b' } },
        containedSecondary: { backgroundColor: gold, color: '#0d2137', '&:hover': { backgroundColor: '#b8921f' } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: darkBlue, boxShadow: 'none' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '1px 0 3px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

export const loginPagePalette = {
  background: darkBlue,
  accent: gold,
  cardBg: '#ffffff',
  textLight: 'rgba(255,255,255,0.9)',
  textMuted: 'rgba(255,255,255,0.7)',
};
