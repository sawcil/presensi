
export interface MenuItem {
  path: string;
  label: string;
  icon: string;
  roles: string[];
}

export const menuItems: MenuItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: '📊',
    roles: ['kepala_sekolah', 'operator']
  },
  {
    path: '/presensi',
    label: 'Presensi Saya',
    icon: '✅',
    roles: ['guru']
  },
  {
    path: '/scan-qr',
    label: 'Scan QR',
    icon: '📱',
    roles: ['guru']
  },
  {
    path: '/laporan',
    label: 'Laporan Kehadiran',
    icon: '📋',
    roles: ['kepala_sekolah', 'operator']
  },
  {
    path: '/guru-management',
    label: 'Kelola Guru',
    icon: '👥',
    roles: ['operator']
  },
  {
    path: '/settings',
    label: 'Pengaturan',
    icon: '⚙️',
    roles: ['kepala_sekolah', 'operator']
  }
];

export const getMenuByRole = (userRole: string): MenuItem[] => {
  return menuItems.filter(item => item.roles.includes(userRole));
};
