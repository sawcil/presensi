// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShellLayout from './AppShellLayout';
import DashboardPage from './pages/DashboardPages';
import PresensiPage from './pages/PresensiPage';
import ScanPage from './pages/ScanPages';
import LoginPage from './pages/LoginPage';
import ProfilPage from './pages/ProfilePage'; 



export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <AppShellLayout>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/presensi" element={<PresensiPage />} />
              <Route path="/scan-qr" element={<ScanPage />} />
              <Route path="/profil" element={<ProfilPage />} /> {}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AppShellLayout>
        }
      />
    </Routes>
  );
}
