// src/components/ProtectedRoute.tsx
import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<'kepala_sekolah' | 'guru' | 'operator'>;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Tampilkan loading state sederhana
  if (loading) {
    return <div style={{ padding: 16 }}>Loading...</div>;
  }

  // Belum login -> redirect ke login, simpan state asal
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role-based guard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
