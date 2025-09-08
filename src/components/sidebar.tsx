// src/components/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMenuByRole } from '../config/menuConfig';
import '../styles/sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const userMenuItems = getMenuByRole(user.role);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      kepala_sekolah: 'Kepala Sekolah',
      guru: 'Guru',
      operator: 'Operator',
    } as const;
    return roleNames[role as keyof typeof roleNames] || role;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Sistem Presensi</h1>
        <div className="user-info">
          <div className="user-name">{user.nama}</div>
          <div className="user-role">{getRoleDisplayName(user.role)}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {userMenuItems.map((item) => (
          <NavLink key={item.path} to={item.path} className="nav-item">
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button">
          <span className="logout-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
