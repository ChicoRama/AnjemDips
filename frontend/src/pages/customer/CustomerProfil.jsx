import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Button from '../../components/Button';
import BottomNav from '../../components/BottomNav';

export default function CustomerProfil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const res = await api.get('/orders');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const completed = list.filter(
          (item) => item.status === 'completed'
        ).length;
        if (isMounted) {
          setStats({ completed, total: list.length });
        }
      } catch {
        // Abaikan error statistik jika offline sementara
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = user?.nama || 'Mahasiswa';
  const initial = (displayName.trim()[0] || 'M').toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      className="pwa-shell"
      style={{
        height: '844px',
        minHeight: '844px',
        boxSizing: 'border-box',
        background: '#F5F6F8',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '13px',
        lineHeight: 1.4,
        color: '#0F172A',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 20px 0', flex: 'none' }}>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '-.02em',
            margin: 0,
          }}
        >
          Profil
        </h1>
        <div style={{ color: '#5B6678', marginTop: '2px' }}>
          Informasi akun dan pengaturan.
        </div>
      </div>

      {/* Konten Utama */}
      <div
        style={{
          flex: 1,
          padding: '16px 20px 84px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto',
        }}
      >
        {/* Kartu Identitas Utama */}
        <Card
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '99px',
              background: '#0F766E',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '20px',
              flex: 'none',
            }}
          >
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: '16px',
                letterSpacing: '-.01em',
              }}
            >
              {displayName}
            </div>
            <div style={{ color: '#5B6678', fontSize: '12px', marginTop: '2px' }}>
              {user?.nim ? `NIM ${user.nim}` : user?.email || '-'}
            </div>
          </div>
          <Chip variant="teal">Pemesan</Chip>
        </Card>

        {/* Ringkasan Aktivitas */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Card style={{ flex: 1, padding: '12px 14px' }}>
            <div style={{ color: '#5B6678', fontSize: '11px' }}>
              Pesanan selesai
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '20px',
                color: '#0F766E',
                marginTop: '2px',
              }}
            >
              {stats.completed}
            </div>
          </Card>

          <Card style={{ flex: 1, padding: '12px 14px' }}>
            <div style={{ color: '#5B6678', fontSize: '11px' }}>
              Total transaksi
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '20px',
                color: '#0F172A',
                marginTop: '2px',
              }}
            >
              {stats.total}
            </div>
          </Card>
        </div>

        {/* Kartu Detail Akun */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '14px' }}>Data akun</div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#5B6678' }}>NIM</span>
            <span style={{ fontWeight: 700 }}>{user?.nim || '-'}</span>
          </div>

          <div style={{ height: '1px', background: '#EEF0F3' }} />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#5B6678' }}>Email</span>
            <span style={{ fontWeight: 700 }}>{user?.email || '-'}</span>
          </div>

          <div style={{ height: '1px', background: '#EEF0F3' }} />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#5B6678' }}>Nomor WhatsApp</span>
            <span style={{ fontWeight: 700 }}>{user?.no_wa || '-'}</span>
          </div>
        </Card>

        {/* Pengaturan & Zona Berbahaya */}
        <Card style={{ padding: '4px 14px' }}>
          <Link
            to="/customer/hapus-akun"
            style={{
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              color: '#B91C1C',
              fontWeight: 700,
            }}
          >
            <span>Hapus akun permanen</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </Card>

        {/* Tombol Keluar */}
        <div style={{ marginTop: '4px' }}>
          <Button
            type="button"
            variant="dangerOutline"
            onClick={handleLogout}
          >
            Keluar dari akun
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav role="customer" />
    </div>
  );
}

