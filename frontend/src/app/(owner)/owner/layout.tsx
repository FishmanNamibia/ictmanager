'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Avatar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  MonitorHeart as MonitorIcon,
  Notifications as RemindersIcon,
  CreditCard as SubscriptionIcon,
} from '@mui/icons-material';

const SIDEBAR_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'System Admin', href: '/owner', icon: <AdminIcon fontSize="small" /> },
  { label: 'System Monitoring', href: '/owner/monitoring', icon: <MonitorIcon fontSize="small" /> },
  { label: 'User Reminders', href: '/owner/reminders', icon: <RemindersIcon fontSize="small" /> },
  { label: 'Subscriptions & Reminders', href: '/owner/subscriptions', icon: <SubscriptionIcon fontSize="small" /> },
];

export default function OwnerShellLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const isActive = (href: string) => {
    if (href === '/owner') return pathname === '/owner';
    return pathname.startsWith(href);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#0d2137',
            color: '#fff',
            borderRight: 'none',
          },
        }}
      >
        {/* Logo / Brand */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#6C63FF', width: 36, height: 36, fontSize: 16, fontWeight: 700 }}>
            I
          </Avatar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}
            >
              I-ICTMS
            </Typography>
          </Box>
        </Box>

        {/* User info */}
        <Box sx={{ px: 2, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#fff' }}>
            System Administrator
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
            {user?.email}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            Super Admin
          </Typography>
        </Box>

        {/* Navigation */}
        <List sx={{ flex: 1, pt: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <ListItemButton
                key={item.href}
                onClick={() => router.push(item.href)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  bgcolor: active ? '#6C63FF' : 'transparent',
                  '&:hover': { bgcolor: active ? '#6C63FF' : 'rgba(255,255,255,0.06)' },
                }}
              >
                <ListItemIcon sx={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        {/* Logout */}
        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <ListItemButton onClick={handleLogout} sx={{ mx: 1, my: 1, borderRadius: 1 }}>
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.5)', minWidth: 36 }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ variant: 'body2', color: 'rgba(255,255,255,0.7)' }}
            />
          </ListItemButton>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: '#f0f2f5', minHeight: '100vh', overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
}
