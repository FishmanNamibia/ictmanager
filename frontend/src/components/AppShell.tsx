'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Badge,
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
  Link as MuiLink,
  Snackbar,
  Tooltip,
  Divider,
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
  Brightness7 as LightModeIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppNotification, notificationApi } from '@/lib/api';
import { useTenantSettings } from '@/contexts/TenantSettingsContext';
import { AppModuleId } from '@/lib/tenant-settings';
import { useThemeMode } from '@/contexts/ThemeModeContext';

const DRAWER_WIDTH = 260;
const HEADER_HEIGHT = 64;

const navItems: { id: AppModuleId; path: string; label: string; icon: React.ReactNode; roles?: string[] }[] = [
  { id: 'dashboard', path: '/dashboard', label: 'My Desk', icon: <DashboardIcon /> },
  { id: 'assets', path: '/assets', label: 'Assets', icon: <AssetIcon /> },
  { id: 'licenses', path: '/licenses', label: 'Licenses', icon: <LicenseIcon /> },
  { id: 'applications', path: '/applications', label: 'Applications', icon: <AppsIcon /> },
  { id: 'staff', path: '/staff', label: 'Staff & Skills', icon: <PeopleIcon /> },
  { id: 'policies', path: '/policies', label: 'ICT Policies', icon: <PoliciesIcon /> },
  { id: 'cybersecurity', path: '/cybersecurity', label: 'Cybersecurity', icon: <CybersecurityIcon /> },
  { id: 'risk-compliance', path: '/risk-compliance', label: 'ICT Risk & Compliance', icon: <RiskComplianceIcon /> },
  { id: 'vendors-contracts', path: '/vendors-contracts', label: 'Vendors & Contracts', icon: <VendorsContractsIcon /> },
  { id: 'projects', path: '/projects', label: 'ICT Projects', icon: <ProjectsIcon /> },
  { id: 'change-management', path: '/change-management', label: 'Change Management', icon: <ChangeManagementIcon /> },
  { id: 'data-governance', path: '/data-governance', label: 'Data Governance', icon: <DataGovernanceIcon /> },
  { id: 'service-desk', path: '/service-desk', label: 'Service Desk', icon: <ServiceDeskIcon /> },
  { id: 'executive', path: '/executive', label: 'Executive View', icon: <ExecutiveIcon /> },
  { id: 'settings', path: '/settings', label: 'Settings', icon: <SettingsIcon />, roles: ['ict_manager'] },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { settings, canAccessModule } = useTenantSettings();
  const { mode, toggleMode } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [modulesAnchor, setModulesAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [navigating, setNavigating] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [popupNotification, setPopupNotification] = useState<AppNotification | null>(null);
  const [notificationNotice, setNotificationNotice] = useState<string | null>(null);
  const previousUnreadRef = useRef<number | null>(null);

  const canSee = (item: (typeof navItems)[0]) => {
    if (!canAccessModule(item.id, user?.role)) return false;
    if (!item.roles?.length) return true;
    return !!user && item.roles.includes(user.role);
  };

  const logoUrl = settings.branding.logoUrl || '/logo/logoictms.png';
  const systemName = settings.branding.systemName || 'I-ICTMS';
  const organizationName = settings.branding.organizationName || user?.tenantSlug || 'Integrated ICTMS';
  const tagline = settings.branding.tagline || 'YOUR ICT COMMAND CENTRE';

  useEffect(() => {
    // Preload module routes so navigation feels immediate.
    router.prefetch('/dashboard');
    navItems.forEach((item) => router.prefetch(item.path));
  }, [router]);

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  const loadNotifications = useCallback(async (showPopupForNew: boolean) => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      previousUnreadRef.current = null;
      return;
    }
    try {
      const data = await notificationApi.list(10);
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
      setNotificationError(null);
      if (
        showPopupForNew &&
        previousUnreadRef.current !== null &&
        data.unreadCount > previousUnreadRef.current
      ) {
        const newestUnread = data.items.find((item) => !item.readAt);
        if (newestUnread) setPopupNotification(newestUnread);
      }
      previousUnreadRef.current = data.unreadCount;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load notifications';
      setNotificationError(message);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadNotifications(false);
    const interval = window.setInterval(() => {
      void loadNotifications(true);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [loadNotifications, user]);

  const handleNotificationOpen = async (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
    await loadNotifications(false);
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.readAt) {
      await notificationApi.markRead(notification.id);
      setNotifications((items) =>
        items.filter((item) => item.id !== notification.id),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      previousUnreadRef.current = Math.max(0, (previousUnreadRef.current ?? unreadCount) - 1);
      setNotificationNotice('Notification marked as read');
    }
    setNotificationsAnchor(null);
    if (notification.linkUrl) {
      setNavigating(true);
      router.push(notification.linkUrl);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationApi.markAllRead();
    setNotifications([]);
    setNotificationNotice('All notifications marked as read');
    setNotificationsAnchor(null);
    setUnreadCount(0);
    previousUnreadRef.current = 0;
  };

  const unreadNotifications = notifications.filter((notification) => !notification.readAt);

  const handleNotificationNoticeClose = () => {
    setNotificationNotice(null);
  };

  const formatNotificationTime = (value: string) =>
    new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

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
              src={logoUrl}
              alt={organizationName}
              style={{ height: 48, width: 'auto', maxWidth: 240, objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.3))' }}
              width={240}
              height={48}
            />
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, lineHeight: 1.1 }}>
                {systemName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.82)', fontWeight: 600, letterSpacing: 0.7, fontSize: '0.7rem', display: 'block' }}>
                {organizationName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', display: 'block', fontSize: '0.66rem' }}>
                {tagline}
              </Typography>
            </Box>
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

          <Tooltip title="Notifications">
            <IconButton size="small" sx={{ color: '#fff' }} onClick={handleNotificationOpen}>
              <Badge badgeContent={unreadCount} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title={mode === 'dark' ? 'Switch to day mode' : 'Switch to night mode'}>
            <IconButton size="small" sx={{ color: '#fff' }} onClick={toggleMode}>
              {mode === 'dark' ? <LightModeIcon /> : <BrightnessIcon />}
            </IconButton>
          </Tooltip>

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
          <Menu
            anchorEl={notificationsAnchor}
            open={!!notificationsAnchor}
            onClose={() => setNotificationsAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { width: 360, maxWidth: 'calc(100vw - 24px)' } }}
          >
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
              <Typography
                component="button"
                onClick={() => void handleMarkAllRead()}
                sx={{
                  border: 'none',
                  background: 'none',
                  color: 'primary.main',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                Mark all read
              </Typography>
            </Box>
            <Divider />
            {notificationError && (
              <Box sx={{ p: 2 }}>
                <Alert severity="error">{notificationError}</Alert>
              </Box>
            )}
            {!notificationError && unreadNotifications.length === 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  All notifications are read.
                </Typography>
              </Box>
            )}
            {!notificationError && unreadNotifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => void handleNotificationClick(notification)}
                sx={{
                  alignItems: 'flex-start',
                  py: 1.5,
                  whiteSpace: 'normal',
                  bgcolor: 'rgba(12, 95, 89, 0.08)',
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {notification.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                      {formatNotificationTime(notification.createdAt)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {notification.message}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          {children}
        </Box>
        <Box sx={{ pt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
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
        </Box>
      </Box>
      <Snackbar
        open={!!popupNotification}
        autoHideDuration={5000}
        onClose={() => setPopupNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={popupNotification?.severity ?? 'info'}
          variant="filled"
          onClose={() => setPopupNotification(null)}
          sx={{ width: '100%', cursor: popupNotification?.linkUrl ? 'pointer' : 'default' }}
          onClick={() => {
            if (!popupNotification) return;
            void handleNotificationClick(popupNotification);
            setPopupNotification(null);
          }}
        >
          <strong>{popupNotification?.title}</strong>
          <br />
          {popupNotification?.message}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!notificationNotice}
        autoHideDuration={2500}
        onClose={handleNotificationNoticeClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={handleNotificationNoticeClose}
          sx={{ width: '100%' }}
        >
          {notificationNotice}
        </Alert>
      </Snackbar>
    </Box>
  );
}
