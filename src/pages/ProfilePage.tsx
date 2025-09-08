// src/pages/ProfilePage.tsx

import { useEffect, useMemo, useState } from 'react';
import {
  Container, Paper, Stack, TextInput, Select, Textarea,
  Button, Group, Image, SimpleGrid, Divider, FileInput, Tooltip, Alert, Text, Center,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';

type Profile = {
  email: string;
  role: 'kepala_sekolah' | 'guru' | 'operator' | string;
  nama_lengkap?: string | null;
  nip?: string | null;
  no_hp?: string | null;
  jenis_kelamin?: 'L' | 'P' | null;
  tanggal_lahir?: string | null;
  alamat?: string | null;
  mapel?: string | null;
  status_kepegawaian?: 'aktif' | 'cuti' | 'nonaktif' | null;
  tanggal_bergabung?: string | null;
  foto_url?: string | null;
};

export default function ProfilPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  // State DateInput
  const [tglLahir, setTglLahir] = useState<string | null>(null);
  const [tglBergabung, setTglBergabung] = useState<string | null>(null);

  // Upload
  const [file, setFile] = useState<File | null>(null);

  const API = useMemo(() => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001', []);

  // Cek apakah user adalah admin
  const isAdmin = useMemo(() => {
    return user?.role === 'kepala_sekolah' || user?.role === 'operator';
  }, [user?.role]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        notifications.show({ title: 'Gagal', message: 'Token tidak ditemukan, login ulang.', color: 'red' });
        return;
      }

      const res = await fetch('/api/guru/me', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setTglLahir(data.profile?.tanggal_lahir ?? null);
        setTglBergabung(data.profile?.tanggal_bergabung ?? null);
      } else {
        notifications.show({ title: 'Gagal', message: data.message || 'Gagal memuat profil', color: 'red' });
      }
    } catch {
      notifications.show({ title: 'Kesalahan', message: 'Gagal memuat profil', color: 'red' });
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        notifications.show({ title: 'Gagal', message: 'Token tidak ditemukan, login ulang.', color: 'red' });
        return;
      }

      const payload = {
        nama_lengkap: profile.nama_lengkap ?? null,
        no_hp: profile.no_hp ?? null,
        jenis_kelamin: profile.jenis_kelamin ?? null,
        tanggal_lahir: tglLahir,
        alamat: profile.alamat ?? null,
        foto_url: profile.foto_url ?? null,
        ...(isAdmin && {
          nip: profile.nip ?? null,
          mapel: profile.mapel ?? null,
          status_kepegawaian: profile.status_kepegawaian ?? null,
          tanggal_bergabung: tglBergabung,
        })
      };

      const res = await fetch('/api/guru/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setTglLahir(data.profile?.tanggal_lahir ?? null);
        setTglBergabung(data.profile?.tanggal_bergabung ?? null);
        notifications.show({ title: 'Sukses', message: 'Profil diperbarui', color: 'green' });
      } else {
        notifications.show({ title: 'Gagal', message: data.message || 'Gagal menyimpan profil', color: 'red' });
      }
    } catch {
      notifications.show({ title: 'Kesalahan', message: 'Gagal menyimpan profil', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setEmailVerificationSent(true);
        notifications.show({ 
          title: 'Email Verifikasi Dikirim', 
          message: 'Silakan cek email Anda untuk verifikasi', 
          color: 'blue' 
        });
      }
    } catch {
      notifications.show({ title: 'Gagal', message: 'Gagal mengirim email verifikasi', color: 'red' });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      notifications.show({ title: 'Peringatan', message: 'Pilih file terlebih dahulu', color: 'yellow' });
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        notifications.show({ title: 'Gagal', message: 'Token tidak ditemukan, login ulang.', color: 'red' });
        return;
      }

      const form = new FormData();
      form.append('foto', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json();
      if (res.ok) {
        const newUrl = data.url as string;
        setProfile((p) => (p ? { ...p, foto_url: newUrl } : p));
        notifications.show({ title: 'Sukses', message: 'Foto berhasil diunggah', color: 'green' });
      } else {
        notifications.show({ title: 'Gagal', message: data.message || 'Upload gagal', color: 'red' });
      }
    } catch {
      notifications.show({ title: 'Kesalahan', message: 'Gagal mengunggah file', color: 'red' });
    } finally {
      setFile(null);
    }
  };

  if (initializing) return <div>Memuat profil...</div>;
  if (!profile) return <div>Profil tidak ditemukan</div>;

  const fotoSrc = profile.foto_url
    ? (profile.foto_url.startsWith('http') ? profile.foto_url : `${API}${profile.foto_url}`)
    : '';

  // Helper untuk placeholder jika data kosong
  const showValue = (val?: string | null) => val && val.trim() !== '' ? val : 'Belum diisi';

  return (
    <Container size="sm" py="xl">
      <Paper shadow="sm" p="lg" radius="md">
        <Stack gap="md">
          <Center>
            <Stack align="center" gap={4}>
              <Image
                src={fotoSrc || '/default-profile.png'}
                alt="Foto Profil"
                width={120}
                height={120}
                radius={100}
                fit="cover"
                style={{ border: '2px solid #eee', background: '#fafafa' }}
              />
              <Text fw={600} size="lg">{showValue(profile.nama_lengkap)}</Text>
              <Text size="sm" c="dimmed">{profile.email}</Text>
              <Text size="xs" c="dimmed" mb={8}>
                Role: {profile.role}
              </Text>
            </Stack>
          </Center>

          <Divider my="sm" />

          <SimpleGrid cols={2} spacing="md">
            <TextInput
              label="Nama Lengkap"
              value={profile.nama_lengkap || ''}
              onChange={(e) => setProfile({ ...profile, nama_lengkap: e.currentTarget.value })}
              placeholder="Masukkan nama lengkap"
              required
            />

            <TextInput
              label="Email"
              value={profile.email || ''}
              disabled
              rightSection={
                <Tooltip label="Verifikasi Email">
                  <Button 
                    size="xs" 
                    onClick={handleEmailVerification}
                    disabled={emailVerificationSent}
                  >
                    {emailVerificationSent ? 'Dikirim' : 'Verifikasi'}
                  </Button>
                </Tooltip>
              }
            />

            {isAdmin ? (
              <TextInput
                label="NIP"
                value={profile.nip || ''}
                onChange={(e) => setProfile({ ...profile, nip: e.currentTarget.value })}
                placeholder="Masukkan NIP"
              />
            ) : (
              <TextInput
                label="NIP"
                value={showValue(profile.nip)}
                disabled
                description="Hanya dapat diubah oleh admin"
              />
            )}

            <TextInput
              label="No. HP"
              value={profile.no_hp || ''}
              onChange={(e) => setProfile({ ...profile, no_hp: e.currentTarget.value })}
              placeholder="Masukkan nomor HP"
            />

            <Select
              label="Jenis Kelamin"
              data={[
                { value: 'L', label: 'Laki-laki' },
                { value: 'P', label: 'Perempuan' }
              ]}
              value={profile.jenis_kelamin || null}
              onChange={(v) => setProfile({ ...profile, jenis_kelamin: v as 'L' | 'P' | null })} // perbaikan di sini
              clearable
              placeholder="Pilih jenis kelamin"
            />

            <DateInput
              label="Tanggal Lahir"
              value={tglLahir}
              onChange={setTglLahir}
              clearable
              placeholder="Pilih tanggal lahir"
            />

            {isAdmin ? (
              <TextInput
                label="Mata Pelajaran"
                value={profile.mapel || ''}
                onChange={(e) => setProfile({ ...profile, mapel: e.currentTarget.value })}
                placeholder="Masukkan mata pelajaran"
              />
            ) : (
              <TextInput
                label="Mata Pelajaran"
                value={showValue(profile.mapel)}
                disabled
                description="Hanya dapat diubah oleh admin"
              />
            )}

            {isAdmin ? (
              <Select
                label="Status Kepegawaian"
                data={[
                  { value: 'aktif', label: 'aktif' },
                  { value: 'cuti', label: 'cuti' },
                  { value: 'nonaktif', label: 'nonaktif' }
                ]}
                value={profile.status_kepegawaian || null}
                onChange={(v) => setProfile({ ...profile, status_kepegawaian: v as 'aktif' | 'cuti' | 'nonaktif' | null })} // perbaikan di sini
                clearable
                placeholder="Pilih status"
              />
            ) : (
              <TextInput
                label="Status Kepegawaian"
                value={showValue(profile.status_kepegawaian)}
                disabled
                description="Hanya dapat diubah oleh admin"
              />
            )}

            {isAdmin ? (
              <DateInput
                label="Tanggal Bergabung"
                value={tglBergabung}
                onChange={setTglBergabung}
                clearable
                placeholder="Pilih tanggal bergabung"
              />
            ) : (
              <TextInput
                label="Tanggal Bergabung"
                value={profile.tanggal_bergabung ? new Date(profile.tanggal_bergabung).toLocaleDateString('id-ID') : 'Belum diisi'}
                disabled
                description="Hanya dapat diubah oleh admin"
              />
            )}
          </SimpleGrid>

          <Textarea
            label="Alamat"
            value={profile.alamat || ''}
            onChange={(e) => setProfile({ ...profile, alamat: e.currentTarget.value })}
            minRows={3}
            placeholder="Masukkan alamat"
          />

          <Divider label="Unggah Foto" labelPosition="center" />

          <Group gap="md" align="center">
            <FileInput
              label="Pilih Foto (Max 1MB)"
              value={file}
              onChange={setFile}
              accept="image/png,image/jpeg,image/jpg,image/webp"
              description="Format: PNG, JPG, JPEG, WEBP"
              placeholder="Pilih file foto"
              style={{ flex: 1 }}
            />
            <Button onClick={handleUpload} disabled={!file}>Upload Foto</Button>
          </Group>

          {emailVerificationSent && (
            <Alert color="blue" mt="xs">
              Email verifikasi telah dikirim ke {profile.email}
            </Alert>
          )}

          <Group justify="flex-end" mt="lg">
            <Button onClick={handleSave} loading={loading}>
              Simpan Perubahan
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
