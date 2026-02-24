'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  AppBar,
  IconButton,
  Menu,
  MenuItem,
  InputBase,
  LinearProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Computer as AssetIcon,
  Apps as AppsIcon,
  People as PeopleIcon,
  Key as LicenseIcon,
  Description as PoliciesIcon,
  Security as CybersecurityIcon,
  Gavel as RiskComplianceIcon,
  Business as VendorsContractsIcon,
  Folder as ProjectsIcon,
  PublishedWithChanges as ChangeManagementIcon,
  Storage as DataGovernanceIcon,
  Support as ServiceDeskIcon,
  TrendingUp as ExecutiveIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Brightness4 as BrightnessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const DRAWER_WIDTH = 260;
const HEADER_HEIGHT = 64;

const navItems: { path: string; label: string; icon: React.ReactNode; roles?: string[] }[] = [
  { path: '/dashboard', label: 'My Desk', icon: <DashboardIcon /> },
  { path: '/assets', label: 'Assets', icon: <AssetIcon /> },
  { path: '/licenses', label: 'Licenses', icon: <LicenseIcon /> },
  { path: '/applications', label: 'Applications', icon: <AppsIcon /> },
  { path: '/staff', label: 'Staff & Skills', icon: <PeopleIcon /> },
  { path: '/policies', label: 'ICT Policies', icon: <PoliciesIcon /> },
  { path: '/cybersecurity', label: 'Cybersecurity', icon: <CybersecurityIcon /> },
  { path: '/risk-compliance', label: 'ICT Risk & Compliance', icon: <RiskComplianceIcon /> },
  { path: '/vendors-contracts', label: 'Vendors & Contracts', icon: <VendorsContractsIcon /> },
  { path: '/projects', label: 'ICT Projects', icon: <ProjectsIcon /> },
  { path: '/change-management', label: 'Change Management', icon: <ChangeManagementIcon /> },
  { path: '/data-governance', label: 'Data Governance', icon: <DataGovernanceIcon /> },
  { path: '/service-desk', label: 'Service Desk', icon: <ServiceDeskIcon /> },
  { path: '/executive', label: 'Executive view', icon: <ExecutiveIcon /> },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [modulesAnchor, setModulesAnchor] = useState<null | HTMLElement>(null);
  const [navigating, setNavigating] = useState(false);

  const canSee = (item: (typeof navItems)[0]) => {
    if (!item.roles?.length) return true;
    return user && item.roles.includes(user.role);
  };

  useEffect(() => {
    // Preload module routes so navigation feels immediate.
    router.prefetch('/dashboard');
    navItems.forEach((item) => router.prefetch(item.path));
  }, [router]);

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  const time = new Date();
  const greeting = time.getHours() < 12 ? 'Morning' : time.getHours() < 18 ? 'Afternoon' : 'Evening';
  const firstName = user?.fullName?.split(' ')[0] || 'User';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1, height: HEADER_HEIGHT }}>
        <Toolbar sx={{ height: HEADER_HEIGHT, gap: 1 }}>
          {/* Logo directly on dark header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
            <img
              src="/logo/logoictms.png"
              alt="Integrated ICTMS"
              style={{ height: 48, width: 'auto', maxWidth: 240, objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.3))' }}
              width={240}
              height={48}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', display: { xs: 'none', md: 'block' }, fontWeight: 600, letterSpacing: 0.8, fontSize: '0.7rem' }}>
              YOUR ICT COMMAND CENTRE
            </Typography>
          </Box>

          {/* Nav: My Desk + Modules */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              component={Link}
              href="/dashboard"
              onClick={() => setNavigating(true)}
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                border: 'none',
                cursor: 'pointer',
                bgcolor: pathname === '/dashboard' ? 'secondary.main' : 'transparent',
                color: pathname === '/dashboard' ? 'primary.main' : '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                '&:hover': { bgcolor: pathname === '/dashboard' ? 'secondary.dark' : 'rgba(255,255,255,0.1)' },
              }}
            >
              My Desk
            </Typography>
            <Typography
              component="button"
              onClick={(e) => setModulesAnchor(e.currentTarget)}
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                border: 'none',
                cursor: 'pointer',
                bgcolor: 'transparent',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Modules
              <ExpandMoreIcon sx={{ fontSize: 18 }} />
            </Typography>
          </Box>

          <Menu
            anchorEl={modulesAnchor}
            open={!!modulesAnchor}
            onClose={() => setModulesAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{ sx: { minWidth: 200 } }}
          >
            {navItems.filter(canSee).filter((i) => i.path !== '/dashboard').map((item) => (
              <MenuItem
                key={item.path}
                component={Link}
                href={item.path}
                onClick={() => { setModulesAnchor(null); setNavigating(true); }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            ))}
          </Menu>

          {/* Search */}
          <Box
            sx={{
              flex: 1,
              maxWidth: 360,
              mx: 2,
              display: { xs: 'none', md: 'block' },
              position: 'relative',
              borderRadius: 1,
              bgcolor: 'rgba(255,255,255,0.12)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
            }}
          >
            <Box sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.7)' }}>
              <SearchIcon fontSize="small" />
            </Box>
            <InputBase
              placeholder="Search…"
              sx={{
                color: '#fff',
                pl: 4,
                py: 0.75,
                width: '100%',
                '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.7)', opacity: 1 },
              }}
            />
          </Box>

          {/* Time (optional) */}
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', display: { xs: 'none', lg: 'block' } }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {' · '}
            {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </Typography>

          <IconButton size="small" sx={{ color: '#fff' }}><NotificationsIcon /></IconButton>
          <IconButton size="small" sx={{ color: '#fff' }}><BrightnessIcon /></IconButton>

          {/* User */}
          <Box
            component="button"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#fff',
              textAlign: 'left',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: 'secondary.main',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              {user?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U'}
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" fontWeight={600}>{user?.fullName}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>
                {user?.role?.replace('_', ' ')}
              </Typography>
            </Box>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <MenuItem onClick={() => { setAnchorEl(null); logout(); router.push('/login'); }}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      {navigating && (
        <LinearProgress
          color="secondary"
          sx={{
            position: 'fixed',
            top: `${HEADER_HEIGHT}px`,
            left: 0,
            right: 0,
            zIndex: (t) => t.zIndex.drawer + 2,
          }}
        />
      )}

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            top: HEADER_HEIGHT,
            mt: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', py: 2 }}>
          <Typography
            variant="overline"
            sx={{ px: 2, color: 'secondary.main', fontWeight: 700, letterSpacing: 1 }}
          >
            Modules
          </Typography>
          <List dense sx={{ pt: 1 }}>
            {navItems.filter(canSee).map((item) => (
              <ListItemButton
                key={item.path}
                component={Link}
                href={item.path}
                onClick={() => setNavigating(true)}
                selected={pathname === item.path}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: '#fff',
                    '& .MuiListItemIcon-root': { color: '#fff' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: `${HEADER_HEIGHT}px`,
          ml: 0,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
