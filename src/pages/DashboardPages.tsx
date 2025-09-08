// src/pages/DashboardPages.tsx
import { useEffect, useMemo, useState } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card, Grid, Group, Text, Title, Skeleton, Stack } from '@mantine/core';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);


export default function DashboardPage() {
  const [kpi, setKpi] = useState({ hadir: 0, terlambat: 0, izin: 0, totalGuru: 0 });
  const [trend, setTrend] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setKpi(data.kpi);
      } else {
        console.error('Failed to fetch dashboard data');
      }

      // sementara: mock trend 30 hari dan label
      setTrend(Array.from({ length: 30 }, () => Math.round(70 + Math.random() * 25)));
      setLabels(Array.from({ length: 30 }, (_, i) => `H-${30 - i}`));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hadirPct = useMemo(
    () => (kpi.totalGuru ? Math.round((kpi.hadir / kpi.totalGuru) * 100) : 0),
    [kpi]
  );

  const lineData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Kehadiran (%)',
          data: trend,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14,165,233,0.2)',
          tension: 0.3,
          fill: true,
        },
      ],
    }),
    [labels, trend]
  );

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: { y: { min: 0, max: 100, ticks: { callback: (v: any) => `${v}%` } } },
    }),
    []
  );

  const doughnutData = useMemo(
    () => ({
      labels: ['Hadir', 'Terlambat', 'Izin'],
      datasets: [
        {
          data: [kpi.hadir, kpi.terlambat, kpi.izin],
          backgroundColor: ['#10b981', '#f59e0b', '#64748b'],
        },
      ],
    }),
    [kpi]
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
    }),
    []
  );

  if (loading) {
    return (
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Skeleton height={140} radius="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Skeleton height={140} radius="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Skeleton height={140} radius="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Skeleton height={320} radius="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Skeleton height={320} radius="md" />
        </Grid.Col>
      </Grid>
    );
  }

  return (
    <Stack>
      <div>
        <Title order={2}>Dashboard</Title>
        <Text c="dimmed">Ringkasan kehadiran dan status real-time</Text>
      </div>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder shadow="sm" radius="md">
            <Text size="sm" c="dimmed" tt="uppercase">
              Kehadiran Hari Ini
            </Text>
            <Group justify="space-between" mt="md">
              <Title order={1}>{hadirPct}%</Title>
              <Text c="dimmed">
                {kpi.hadir}/{kpi.totalGuru} guru
              </Text>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder shadow="sm" radius="md">
            <Text size="sm" c="dimmed" tt="uppercase">
              Terlambat
            </Text>
            <Title order={2} mt="md">
              {kpi.terlambat}
            </Title>
            <Text c="dimmed">Hari ini</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder shadow="sm" radius="md">
            <Text size="sm" c="dimmed" tt="uppercase">
              Izin
            </Text>
            <Title order={2} mt="md">
              {kpi.izin}
            </Title>
            <Text c="dimmed">Hari ini</Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder radius="md" shadow="sm">
            <Text fw={700} mb="sm">
              Tren Kehadiran 30 Hari
            </Text>
            <div style={{ height: 300 }}>
              <Line data={lineData} options={lineOptions} />
            </div>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="md" shadow="sm">
            <Text fw={700} mb="sm">
              Distribusi Status (Minggu Ini)
            </Text>
            <div style={{ height: 300 }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
