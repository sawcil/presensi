// src/pages/ScanPages.tsx

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Card, Stack, Title, Text, Alert, Button, Tabs } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import QRCode from 'qrcode';

export default function ScanPage() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [qrDataURL, setQrDataURL] = useState('');
  const [activeTab, setActiveTab] = useState<'scan' | 'generate'>('generate');

  // Generate QR Code untuk presensi
  useEffect(() => {
    if (user && activeTab === 'generate') {
      generateQRCode();
    }
  }, [user, activeTab]);

  const generateQRCode = async () => {
    try {
      if (!user) return;
      
      const presensiData = {
        userId: user.id,
        nama: user.nama,
        timestamp: new Date().toISOString(),
        type: 'presensi'
      };

      const qrString = JSON.stringify(presensiData);
      const dataURL = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrDataURL(dataURL);
    } catch (err) {
      setError('Gagal generate QR Code');
    }
  };

  const submitPresensi = async (qrData: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/presensi/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          qr_data: qrData,
          scan_time: new Date().toISOString()
        })
      });

      const result = await response.json();
      if (response.ok) {
        setResult(`Presensi berhasil: ${result.status}`);
      } else {
        setError(result.message || 'Gagal submit presensi');
      }
    } catch (err) {
      setError('Gagal mengirim data presensi');
    }
  };

  // Scanner QR
  useEffect(() => {
    if (activeTab !== 'scan') return;

    const codeReader = new BrowserMultiFormatReader();
    let stopped = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          codeReader.decodeFromVideoDevice(null, videoRef.current, (res, err) => {
            if (stopped) return;
            
            if (res) {
              const text = res.getText();
              setResult(text);
              
              try {
                const qrData = JSON.parse(text);
                if (qrData.type === 'presensi') {
                  submitPresensi(qrData);
                }
              } catch {
                setError('Format QR tidak valid');
              }
            }

            if (err && (err as any).name !== 'NotFoundException') {
              setError((err as any).message ?? 'Decode error');
            }
          });
        }
      } catch (e: any) {
        setError(e?.message ?? 'Camera init error');
      }
    }

    start();

    return () => {
      stopped = true;
      try {
        codeReader.reset();
      } catch {}
      const tracks = (videoRef.current?.srcObject as MediaStream | undefined)?.getTracks?.() ?? [];
      tracks.forEach((t) => t.stop());
    };
  }, [activeTab]);

  useEffect(() => {
    setError('');
    setResult('');
  }, [activeTab]);

  return (
    <Stack gap="md" p="md">
      <Title order={2}>Presensi QR Code</Title>
      <Text size="sm" c="dimmed">
        Generate QR untuk presensi atau scan QR presensi
      </Text>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as 'scan' | 'generate')}>
        <Tabs.List>
          <Tabs.Tab value="generate">Generate QR</Tabs.Tab>
          <Tabs.Tab value="scan">Scan QR</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="generate" pt="md">
          <Card shadow="sm" p="lg">
            <Stack align="center" gap="md">
              <Title order={3}>QR Code Presensi Anda</Title>
              <Text size="sm" ta="center">
                Tunjukkan QR ini ke operator/admin untuk presensi kehadiran
              </Text>
              
              {qrDataURL && (
                <img 
                  src={qrDataURL} 
                  alt="QR Code Presensi" 
                  style={{ maxWidth: '300px', border: '1px solid #ddd', borderRadius: '8px' }}
                />
              )}
              
              <Text size="xs" c="dimmed" ta="center">
                Nama: {user?.nama}<br/>
                Generated: {new Date().toLocaleString('id-ID')}
              </Text>
              
              <Button onClick={generateQRCode} variant="light">
                Refresh QR Code
              </Button>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="scan" pt="md">
          <Card shadow="sm" p="lg">
            <Stack gap="md">
              <Title order={3}>Scan QR Presensi</Title>
              <Text size="sm">
                Pindai QR code presensi, pastikan izin kamera aktif
              </Text>

              <div style={{ position: 'relative', maxWidth: '400px', margin: '0 auto' }}>
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
              </div>

              {error && (
                <Alert color="red" title="Error">
                  {error}
                </Alert>
              )}

              {result && (
                <Alert color="green" title="Hasil Scan">
                  {result}
                </Alert>
              )}

              <Text size="xs" c="dimmed" ta="center">
                Gunakan HTTPS/localhost; pilih kamera belakang jika tersedia.
              </Text>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
