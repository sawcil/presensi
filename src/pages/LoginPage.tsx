// src/pages/LoginPage.tsx
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Container, Paper, Stack, Title, Text, TextInput, PasswordInput, Button, Alert, Tabs, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';


export default function LoginPage() {
  const { user, login } = useAuth();
  const nav = useNavigate();

  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errLogin, setErrLogin] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  // Register state
  const [nama, setNama] = useState('');
  const [emailReg, setEmailReg] = useState('');
  const [passwordReg, setPasswordReg] = useState('');
  const [errReg, setErrReg] = useState('');
  const [loadingReg, setLoadingReg] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrLogin('');
    setLoadingLogin(true);
    try {
      const ok = await login(email, password); // panggil AuthContext login -> POST /api/auth/login
      if (ok) {
        notifications.show({ title: 'Login berhasil', message: 'Selamat datang', color: 'green' });
        nav('/dashboard', { replace: true });
      } else {
        setErrLogin('Email atau password salah');
        notifications.show({ title: 'Login gagal', message: 'Periksa email/password', color: 'red' });
      }
    } catch {
      setErrLogin('Gagal menghubungi server');
      notifications.show({ title: 'Kesalahan', message: 'Coba lagi', color: 'red' });
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrReg('');
    setLoadingReg(true);
    try {
      const res = await fetch('/api/auth/register', { // lewat proxy vite
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_lengkap: nama, email: emailReg, password: passwordReg, role: 'guru' }),
      });
      const data = await res.json();
      if (res.ok) {
        // Simpan token & user seperti login (opsional langsung login)
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        notifications.show({ title: 'Registrasi berhasil', message: 'Akun dibuat, masuk ke dashboard', color: 'green' });
        nav('/dashboard', { replace: true });
      } else {
        const msg = data?.message || 'Registrasi gagal';
        setErrReg(msg);
        notifications.show({ title: 'Registrasi gagal', message: msg, color: 'red' });
      }
    } catch {
      setErrReg('Gagal menghubungi server');
      notifications.show({ title: 'Kesalahan', message: 'Coba lagi', color: 'red' });
    } finally {
      setLoadingReg(false);
    }
  };

  return (
    <Container
      size={440}
      mih="100vh"
      display="flex"
      style={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <Paper withBorder p="xl" radius="lg" shadow="md" w="100%">
        <Stack>
          <div>
            <Title order={2} ta="center">Sistem Presensi Guru</Title>
            <Text c="dimmed" size="sm" ta="center">Masuk atau buat akun baru</Text>
          </div>

          <Tabs value={tab} onChange={(v) => setTab((v as any) || 'login')}>
            <Tabs.List grow>
              <Tabs.Tab value="login">Masuk</Tabs.Tab>
              <Tabs.Tab value="register">Daftar</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="login" pt="md">
              <form onSubmit={handleLogin}>
                <Stack>
                  <TextInput label="Email" placeholder="nama@sekolah.sch.id" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
                  <PasswordInput label="Password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.currentTarget.value)} required />
                  {errLogin && <Alert color="red">{errLogin}</Alert>}
                  <Group justify="flex-end">
                    <Button type="submit" loading={loadingLogin}>Login</Button>
                  </Group>
                </Stack>
              </form>
            </Tabs.Panel>

            <Tabs.Panel value="register" pt="md">
              <form onSubmit={handleRegister}>
                <Stack>
                  <TextInput label="Nama Lengkap" placeholder="Nama lengkap" value={nama} onChange={(e) => setNama(e.currentTarget.value)} required />
                  <TextInput label="Email" placeholder="nama@sekolah.sch.id" value={emailReg} onChange={(e) => setEmailReg(e.currentTarget.value)} required />
                  <PasswordInput label="Password" placeholder="Minimal 6 karakter" value={passwordReg} onChange={(e) => setPasswordReg(e.currentTarget.value)} required />
                  {errReg && <Alert color="red">{errReg}</Alert>}
                  <Group justify="flex-end">
                    <Button type="submit" loading={loadingReg}>Daftar</Button>
                  </Group>
                </Stack>
              </form>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Paper>
    </Container>
  );
}
