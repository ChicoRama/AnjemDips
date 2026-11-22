import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import BottomNav from '../../components/BottomNav';

const ACTIVE_STATUSES = [
  'pending',
  'accepted',
  'on_progress',
  'on_the_way',
  'in_progress',
];

export default function CustomerBeranda() {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadActiveOrder = async () => {
      try {
        const res = await api.get('/orders');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const found = list.find((item) => ACTIVE_STATUSES.includes(item.status));
        if (isMounted) {
          setActiveOrder(found || null);
        }
      } catch {
        if (isMounted) {
          setActiveOrder(null);
        }
      }
    };

    loadActiveOrder();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = user?.nama || 'Mahasiswa';
  const initial = (displayName.trim()[0] || 'N').toUpperCase();

  const isJastip = activeOrder?.jenis_layanan === 'jastip';
  const isPending = activeOrder?.status === 'pending';
  const activeOrderTarget = activeOrder
    ? isPending
      ? '/customer/mencari'
      : '/customer/lacak'
    : '/customer/pesanan';

  return (
    <div
      className="pwa-shell"
      style={{
        minHeight: '844px',
        background: '#F5F6F8',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '13px',
        lineHeight: 1.4,
        color: '#0F172A',
        boxSizing: 'border-box',
      }}
    >
      {/* Header Top */}
      <div
        style={{
          padding: '20px 20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flex: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '99px',
              background: '#0F766E',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '15px',
              flex: 'none',
            }}
          >
            {initial}
          </div>
          <div>
            <div style={{ color: '#5B6678', fontSize: '12px' }}>Halo,</div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '16px',
                letterSpacing: '-.01em',
              }}
            >
              {displayName}
            </div>
          </div>
        </div>

        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: '#fff',
            boxShadow: '0 0 0 1px rgba(15,23,42,.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0F172A',
            flex: 'none',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          padding: '18px 20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          flex: 1,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '-.02em',
              margin: 0,
            }}
          >
            Mau ke mana hari ini?
          </h1>
          <div style={{ color: '#5B6678', marginTop: '2px' }}>
            Ajukan harga, driver terdekat yang menjawab.
          </div>
        </div>

        {/* Kartu GPS */}
        <Card
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: '#E6F4F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F766E',
              flex: 'none',
            }}
          >
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
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#5B6678', fontSize: '11px' }}>
              Lokasimu sekarang
            </div>
            <div style={{ fontWeight: 700 }}>Terdeteksi otomatis</div>
          </div>
          <Chip variant="teal">GPS aktif</Chip>
        </Card>

        {/* Tile AnJem & JasTip */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to="/customer/anjem"
            style={{
              flex: 1,
              borderRadius: '20px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              textDecoration: 'none',
              boxSizing: 'border-box',
              height: '150px',
              background: '#0F766E',
              color: '#fff',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '13px',
                background: 'rgba(255,255,255,.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="6" cy="16" r="3" />
                <circle cx="18" cy="16" r="3" />
                <path d="M6 16l4-7h5l3 7M9 9H7" />
              </svg>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontWeight: 800, fontSize: '16px' }}>AnJem</div>
              <div style={{ fontSize: '12px', color: '#C9ECE8' }}>
                Antar-jemput
              </div>
            </div>
          </Link>

          <Link
            to="/customer/jastip"
            style={{
              flex: 1,
              borderRadius: '20px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              textDecoration: 'none',
              boxSizing: 'border-box',
              height: '150px',
              background: '#FDE9B8',
              color: '#4A2C03',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '13px',
                background: 'rgba(74,44,3,.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4A2C03"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 8h14l-1 12H6z" />
                <path d="M9 8a3 3 0 0 1 6 0" />
              </svg>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontWeight: 800, fontSize: '16px' }}>JasTip</div>
              <div style={{ fontSize: '12px', color: '#6B4308' }}>
                Titip barang
              </div>
            </div>
          </Link>
        </div>

        {/* Section Pesanan Aktif */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '4px',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '14px' }}>Pesanan aktif</div>
          <Link
            to="/customer/pesanan"
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#0F766E',
              textDecoration: 'none',
            }}
          >
            Lihat semua
          </Link>
        </div>

        <Card
          to={activeOrderTarget}
          state={activeOrder ? { order: activeOrder } : undefined}
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '13px',
              background: isJastip ? '#FDE9B8' : '#E6F4F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isJastip ? '#6B4308' : '#0F766E',
              flex: 'none',
            }}
          >
            {isJastip ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 8h14l-1 12H6z" />
                <path d="M9 8a3 3 0 0 1 6 0" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 16v-4l2-5h12l2 5v4zM4 16v3M20 16v3" />
              </svg>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700 }}>
              {activeOrder
                ? isJastip
                  ? 'JasTip'
                  : 'AnJem · Mobil'
                : 'Belum ada pesanan aktif'}
            </div>
            <div
              style={{
                color: '#5B6678',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeOrder
                ? isPending
                  ? 'Menunggu driver menerima'
                  : `${activeOrder.driver?.nama || 'Driver'} sedang menjemput`
                : 'Buat pesanan AnJem atau JasTip sekarang'}
            </div>
          </div>

          <Chip variant="teal">
            {activeOrder ? (isPending ? 'Mencari' : 'Lacak') : 'Pesanan'}
          </Chip>
        </Card>

        {/* Info Tawar-Menawar */}
        <Card
          variant="soft"
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0F766E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flex: 'none', marginTop: '1px' }}
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8h.01M11 12h1v5h1" />
          </svg>
          <div style={{ fontSize: '12px', color: '#0B4F4A' }}>
            Harga ditentukan lewat tawar-menawar. Kamu bisa menyetujui tawaran
            driver atau menawar balik.
          </div>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNav role="customer" />
    </div>
  );
}

