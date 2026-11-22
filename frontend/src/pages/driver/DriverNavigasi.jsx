import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const DRIVER_ACTIVE_STATUSES = [
  'accepted',
  'on_progress',
  'on_the_way',
  'in_progress',
];

function formatRibuan(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('id-ID');
}

function formatWaUrl(phone, text) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = `62${cleaned.slice(1)}`;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

export default function DriverNavigasi() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(() => location.state?.order || null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const syncOrder = async () => {
      try {
        const res = await api.get('/orders');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const target = order?.id
          ? list.find((item) => item.id === order.id)
          : list.find(
              (item) =>
                item.driver_id === user?.id &&
                DRIVER_ACTIVE_STATUSES.includes(item.status)
            );

        if (isMounted && target) {
          setOrder(target);
        }
      } catch {
        // Pertahankan state terakhir
      }
    };

    syncOrder();
    return () => {
      isMounted = false;
    };
  }, [order?.id, user?.id]);

  const isOnWay = ['on_progress', 'on_the_way', 'in_progress'].includes(
    order?.status
  );
  const isCompleted = order?.status === 'completed';
  const isJastip = order?.jenis_layanan === 'jastip';

  const stageTitle = isCompleted
    ? 'Perjalanan selesai'
    : isOnWay
    ? 'Menuju lokasi antar'
    : isJastip
    ? 'Menuju lokasi pembelian'
    : 'Menuju titik jemput';

  const targetAddress = isOnWay
    ? order?.titik_antar || 'Titik tujuan'
    : order?.titik_jemput || 'Titik jemput';

  const activeSteps = isCompleted ? 4 : isOnWay ? 3 : 2;
  const customerName = order?.customer?.nama || 'Mahasiswa';
  const customerInitial = (customerName.trim()[0] || 'M').toUpperCase();
  const customerWa = formatWaUrl(
    order?.customer?.no_wa,
    `Halo kak ${customerName}, saya sudah di perjalanan.`
  );

  const hargaBarang = Number(order?.perkiraan_harga_barang) || 0;
  const ongkir = Number(order?.ongkir) || 0;
  const totalAmount = isJastip ? hargaBarang + ongkir : ongkir;

  const handleAdvanceStage = async () => {
    if (!order?.id) return;
    setError('');
    setUpdating(true);
    try {
      const nextStatus = isOnWay ? 'completed' : 'on_progress';
      const res = await api.patch(`/orders/${order.id}/status`, {
        status: nextStatus,
      });
      if (nextStatus === 'completed') {
        navigate('/driver/history');
      } else {
        setOrder(res.data?.data || { ...order, status: 'on_progress' });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal memperbarui status perjalanan.'
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="pwa-shell"
      style={{
        height: '844px',
        minHeight: '844px',
        boxSizing: 'border-box',
        background: '#E9EEF0',
        position: 'relative',
        overflow: 'hidden',
        fontSize: '13px',
        lineHeight: 1.4,
        color: '#0F172A',
      }}
    >
      {/* Peta Rute */}
      <svg
        width="390"
        height="600"
        viewBox="0 0 390 600"
        fill="none"
        aria-hidden="true"
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <path
          d="M-10 460 C90 420 150 330 230 350 S350 410 400 290"
          stroke="#fff"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M130 -10 C160 110 110 220 170 350 S230 520 210 610"
          stroke="#fff"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path d="M-10 170 L400 130" stroke="#fff" strokeWidth="9" />
        <rect x="310" y="370" width="70" height="70" rx="10" fill="#DDE7E4" />
        <rect x="18" y="220" width="80" height="90" rx="10" fill="#DDE7E4" />
        <path
          d="M120 120 C130 200 160 280 190 345"
          stroke="#0F766E"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle
          cx="190"
          cy="345"
          r="9"
          fill="#fff"
          stroke="#F59E0B"
          strokeWidth="3"
        />
        <circle cx="190" cy="345" r="3.5" fill="#F59E0B" />
        <g transform="translate(120 120)">
          <circle r="20" fill="#0F766E" fillOpacity=".18" />
          <circle r="14" fill="#0F766E" stroke="#fff" strokeWidth="3" />
          <circle r="4" fill="#fff" />
        </g>
      </svg>

      {/* Tombol Kembali */}
      <Link
        to="/driver/pesanan"
        aria-label="Kembali"
        style={{
          position: 'absolute',
          left: '16px',
          top: '16px',
          width: '44px',
          height: '44px',
          borderRadius: '14px',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(15,23,42,.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0F172A',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </Link>

      {/* Pil GPS */}
      <div
        style={{
          position: 'absolute',
          right: '16px',
          top: '20px',
          background: '#fff',
          borderRadius: '99px',
          padding: '7px 12px',
          boxShadow: '0 2px 8px rgba(15,23,42,.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 700,
          fontSize: '12px',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '99px',
            background: '#16A34A',
          }}
        />
        Navigasi aktif
      </div>

      {/* Bottom Sheet */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#fff',
          borderRadius: '28px 28px 0 0',
          padding: '12px 20px 22px',
          boxShadow: '0 -8px 30px rgba(15,23,42,.1)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '4px',
            borderRadius: '4px',
            background: '#D5DAE1',
            margin: '0 auto 14px',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: '#5B6678', fontSize: '12px' }}>
              {stageTitle}
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '18px',
                letterSpacing: '-.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {targetAddress}
            </div>
          </div>
          <div style={{ textAlign: 'right', flex: 'none', marginLeft: '10px' }}>
            <div style={{ color: '#5B6678', fontSize: '12px' }}>Estimasi</div>
            <div style={{ fontWeight: 800, fontSize: '15px' }}>
              {isOnWay ? '± 6 mnt' : '± 4 mnt'}
            </div>
          </div>
        </div>

        {/* Progress Bar 4 Tahap */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '14px' }}>
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '4px',
                background: step <= activeSteps ? '#0F766E' : '#E2E6EB',
              }}
            />
          ))}
        </div>

        {/* Kartu Pemesan */}
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            background: '#F5F6F8',
            borderRadius: '16px',
            padding: '12px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '99px',
              background: '#0F766E',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '16px',
              flex: 'none',
            }}
          >
            {customerInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '15px' }}>
              {customerName}
            </div>
            <div style={{ color: '#5B6678', fontSize: '12px' }}>
              {isJastip
                ? order?.nama_barang || 'JasTip'
                : `AnJem · ${order?.jumlah_penumpang || 1} penumpang`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#5B6678', fontSize: '11px' }}>
              Total tagihan
            </div>
            <div style={{ fontWeight: 800 }}>
              Rp {formatRibuan(totalAmount)}
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: '10px',
              borderRadius: '12px',
              background: '#FEF2F2',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#B91C1C',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* Tombol Aksi */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          {customerWa && (
            <a
              href={customerWa}
              target="_blank"
              rel="noreferrer"
              style={{
                height: '46px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
                boxSizing: 'border-box',
                padding: '0 16px',
                background: '#fff',
                color: '#0F172A',
                boxShadow: 'inset 0 0 0 1.5px #D5DAE1',
              }}
            >
              WhatsApp
            </a>
          )}

          {order && !isCompleted && (
            <button
              type="button"
              disabled={updating}
              onClick={handleAdvanceStage}
              style={{
                height: '46px',
                borderRadius: '14px',
                border: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                font: "700 13px 'Plus Jakarta Sans',system-ui,sans-serif",
                flex: 1,
                background: isOnWay ? '#16A34A' : '#0F766E',
                color: '#fff',
                cursor: updating ? 'not-allowed' : 'pointer',
              }}
            >
              {updating
                ? 'Memproses...'
                : isOnWay
                ? 'Selesaikan pesanan'
                : 'Mulai antar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

