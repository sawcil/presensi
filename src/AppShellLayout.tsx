import {
  AppShell, Burger, Group, Text, ScrollArea, NavLink, Box,
  ActionIcon, Menu, Avatar, useMantineColorScheme, useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconSun, IconMoon, IconLogout, IconUserCircle } from '@tabler/icons-react';
import { useAuth } from './contexts/AuthContext';

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { logout, user } = useAuth();

  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  const dark = computedColorScheme === 'dark';
  const toggleColorScheme = () => setColorScheme(dark ? 'light' : 'dark');

  const menu = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/presensi', label: 'Presensi Saya', icon: '✅' },
    { to: '/scan-qr', label: 'Scan QR', icon: '📱' },
    { to: '/profil', label: 'Profil', icon: '👤' },
  ];

  const handleLogout = () => {
    logout();
    nav('/login', { replace: true });
  };

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header withBorder>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" />
            <Text fw={800}>Sistem Presensi</Text>
          </Group>

          <Group gap="xs">
            <ActionIcon variant="subtle" aria-label="Toggle color scheme" onClick={toggleColorScheme}>
              {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>

            <Menu shadow="md" width={220}>
              <Menu.Target>
                <ActionIcon variant="light" aria-label="User menu">
                  <Avatar size={28} radius="xl" color="initials" name={user?.nama}>
                    {!user?.nama && <IconUserCircle size={16} />}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Akun</Menu.Label>
                <Menu.Item leftSection={<IconUserCircle size={14} />}>
                  {user?.nama || 'Pengguna'}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={handleLogout}>
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm" component={ScrollArea}>
        {menu.map((item) => (
          <NavLink
            key={item.to}
            component={Link}
            to={item.to}
            label={item.label}
            leftSection={<Box style={{ width: 20 }}>{item.icon}</Box>}
            active={pathname === item.to}
            variant="light"
            styles={{ root: { borderRadius: 8 } }}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
