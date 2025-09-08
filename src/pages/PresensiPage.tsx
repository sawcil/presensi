// src/pages/PresensiPage.tsx
import { useEffect, useState } from 'react';
import { Card, Stack, Title, Grid, Text, Table, Skeleton, Badge } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';

type PresensiRecord = {
  id: number;
  tanggal: string;
  status: 'HADIR' | 'TERLAMBAT' | 'IZIN';
  waktu_presensi?: string;
  keterangan?: string;
};

const StatusBadge = ({ s }: { s: PresensiRecord['status'] }) => {
  const map = {
    HADIR: { color: 'green', label: 'HADIR' },
    TERLAMBAT: { color: 'yellow', label: 'TERLAMBAT' },
    IZIN: { color: 'gray', label: 'IZIN' },
  }[s];
  return <Badge color={map.color} variant="light">{map.label}</Badge>;
};

export default function PresensiPage() {
  const { user } = useAuth();
  const [presensi, setPresensi] = useState<PresensiRecord[]>([]);
  const [summary, setSummary] = useState({ total_hadir: 0, total_terlambat: 0, total_izin: 0, persentase_kehadiran: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`http://localhost:3001/api/presensi/user/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setPresensi(data.presensi);
        setSummary(data.summary);
      } else {
        setPresensi([]);
        setSummary({ total_hadir: 0, total_terlambat: 0, total_izin: 0, persentase_kehadiran: 0 });
      }
    } catch {
      setPresensi([]);
      setSummary({ total_hadir: 0, total_terlambat: 0, total_izin: 0, persentase_kehadiran: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Skeleton height={320} radius="md" />;
  }

  return (
    <Stack>
      <Title order={2}>Presensi Saya {user ? `- ${user.nama}` : ''}</Title>

      <Grid>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder><Text c="dimmed" size="sm">Hadir</Text><Title>{summary.total_hadir}</Title></Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder><Text c="dimmed" size="sm">Terlambat</Text><Title>{summary.total_terlambat}</Title></Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder><Text c="dimmed" size="sm">Izin</Text><Title>{summary.total_izin}</Title></Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card withBorder><Text c="dimmed" size="sm">Kehadiran</Text><Title>{summary.persentase_kehadiran}%</Title></Card>
        </Grid.Col>
      </Grid>

      <Card withBorder>
        <Text fw={700} mb="sm">Riwayat Presensi (30 Hari Terakhir)</Text>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Tanggal</Table.Th>
              <Table.Th>Waktu</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Keterangan</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {presensi.length ? presensi.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>{new Date(r.tanggal).toLocaleDateString('id-ID')}</Table.Td>
                <Table.Td>{r.waktu_presensi || '-'}</Table.Td>
                <Table.Td><StatusBadge s={r.status} /></Table.Td>
                <Table.Td>{r.keterangan || '-'}</Table.Td>
              </Table.Tr>
            )) : (
              <Table.Tr>
                <Table.Td colSpan={4} style={{ textAlign: 'center' }}>Belum ada data presensi</Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}
