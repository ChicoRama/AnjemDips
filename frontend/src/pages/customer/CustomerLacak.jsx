import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const ACTIVE_STATUSES = [
  'accepted',
  'on_progress',
  'on_the_way',
  'in_progress',
  'pending',
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

export default function CustomerLacak() {
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(() => location.state?.order || null);
  const [secondsAgo, setSecondsAgo] = useState(3);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  // Sinkronisasi status order & posisi driver secara berkala
  useEffect(() => {
    let isMounted = true;

    const syncOrder = async () => {
      try {
        const res = await api.get('/orders');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const target = order?.id
          ? list.find((item) => item.id === order.id)
          : list.find((item) => ACTIVE_STATUSES.includes(item.status));

        if (!isMounted || !target) return;
        setOrder(target);
        setSecondsAgo(1);
      } catch {
        // Pertahankan data terakhir saat gangguan jaringan sementara
      }
    };

    syncOrder();
    const pollInterval = setInterval(syncOrder, 5000);
    const tickInterval = setInterval(() => {
      setSecondsAgo((prev) => (prev >= 5 ? 1 : prev + 1));
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      clearInterval(tickInterval);
    };
  }, [order?.id]);

  const isOnWay = ['on_progress', 'on_the_way', 'in_progress'].includes(
    order?.status
  );
  const isCompleted = order?.status === 'completed';
  const isCancelled = order?.status === 'cancelled';
  const canCancel = ['pending', 'accepted'].includes(order?.status);

  const statusSubtitle = isCompleted
    ? 'Pesanan telah selesai'
    : isOnWay
    ? 'Driver sedang mengantar'
    : 'Driver sedang menjemput';

  const etaText = isCompleted
    ? 'Selesai'
    : isOnWay
    ? 'Dalam perjalanan'
    : 'Driver menuju lokasimu';

  const distanceText = isCompleted ? 'Tiba' : isOnWay ? 'Mengantar' : 'Menjemput';
  const activeStepCount = isCompleted ? 4 : isOnWay ? 3 : 2;

  const driverName = order?.driver?.nama || 'Driver';
  const driverInitial = (driverName.trim()[0] || 'D').toUpperCase();
  const isMotor =
    (order?.driver?.jenis_kendaraan || order?.jenis_kendaraan) === 'motor';
  const vehicleLabel = isMotor ? 'Motor' : 'Mobil';
  const platNomor = order?.driver?.plat_nomor || '-';

  const isJastip = order?.jenis_layanan === 'jastip';
  const hargaBarang = Number(order?.perkiraan_harga_barang) || 0;
  const ongkir = Number(order?.ongkir) || 0;
  const agreedPrice = isJastip ? hargaBarang + ongkir : ongkir;

  const driverWa = formatWaUrl(
    order?.driver?.no_wa,
    `Halo kak ${driverName}, saya pemesan AnjemDips.`
  );

  const handleCancelOrder = async () => {
    if (!order?.id) {
      navigate('/customer');
      return;
    }

    setError('');
    setCancelling(true);
    try {
      await api.patch(`/orders/${order.id}/status`, {
        status: 'cancelled',
      });
      navigate('/customer');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Pesanan tidak dapat dibatalkan pada tahap ini.'
      );
    } finally {
      setCancelling(false);
    }
  };

  // Layar khusus bila pesanan dibatalkan (mis. oleh driver)
  if (isCancelled) {
    return (
      <div
        className="pwa-shell"
        style={{
          minHeight: '844px',
          boxSizing: 'border-box',
          background: '#F5F6F8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: '18px' }}>
          Pesanan dibatalkan
        </div>
        <div style={{ color: '#5B6678' }}>
          Pesanan ini telah dibatalkan. Kamu bisa membuat pesanan baru.
        </div>
        <Link
          to="/customer"
          style={{
            marginTop: '8px',
            height: '44px',
            padding: '0 24px',
            borderRadius: '12px',
            background: '#0F766E',
            color: '#fff',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
          }}
        >
          Kembali ke beranda
        </Link>
      </div>
    );
  }

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
      {/* Peta Rute Driver */}
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
        <path
          d="M290 -10 C310 70 270 150 320 270"
          stroke="#fff"
          strokeWidth="7"
        />
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
          stroke="#0F766E"
          strokeWidth="3"
        />
        <circle cx="190" cy="345" r="3.5" fill="#0F766E" />
        <g transform="translate(120 120)">
          <circle r="20" fill="#0F766E" fillOpacity=".18" />
          <circle
            r="14"
            fill="#0F766E"
            stroke="#fff"
            strokeWidth="3"
          />
          <path
            d="M-5 2v-3l1.5-3.5h7L8 -1v3zM-5 2v2M8 2v2"
            stroke="#fff"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="scale(.9)"
          />
        </g>
      </svg>

      {/* Tombol Kembali */}
      <Link
        to="/customer/pesanan"
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

      {/* Pil Status Pembaruan */}
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
        Diperbarui {secondsAgo} detik lalu
      </div>

      {/* Bottom Sheet Info Driver & Status */}
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
          <div>
            <div style={{ color: '#5B6678', fontSize: '12px' }}>
              {statusSubtitle}
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '22px',
                letterSpacing: '-.02em',
              }}
            >
              {etaText}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#5B6678', fontSize: '12px' }}>Tahap</div>
            <div style={{ fontWeight: 800, fontSize: '15px' }}>
              {distanceText}
            </div>
          </div>
        </div>

        {/* Indikator Progres 4 Tahap */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '14px' }}>
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '4px',
                background: step <= activeStepCount ? '#0F766E' : '#E2E6EB',
              }}
            />
          ))}
        </div>

        {/* Kartu Profil Driver & Tarif */}
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
            {driverInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '15px' }}>
              {driverName}
            </div>
            <div style={{ color: '#5B6678', fontSize: '12px' }}>
              {vehicleLabel} · {platNomor}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#5B6678', fontSize: '11px' }}>
              Harga disepakati
            </div>
            <div style={{ fontWeight: 800 }}>
              Rp {formatRibuan(agreedPrice)}
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

        {/* Tombol Hubungi & Batalkan */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          {driverWa ? (
            <a
              href={driverWa}
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
                flex: 1,
                background: '#0F766E',
                color: '#fff',
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
                <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
              </svg>
              Hubungi
            </a>
          ) : (
            <Link
              to="/customer/lacak"
              state={order ? { order } : undefined}
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
                flex: 1,
                background: '#0F766E',
                color: '#fff',
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
                <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
              </svg>
              Hubungi
            </Link>
          )}

          {canCancel && (
            <button
              type="button"
              disabled={cancelling}
              onClick={handleCancelOrder}
              style={{
                height: '46px',
                borderRadius: '14px',
                border: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                font: "700 13px 'Plus Jakarta Sans',system-ui,sans-serif",
                boxSizing: 'border-box',
                flex: 1,
                background: '#fff',
                color: '#B91C1C',
                boxShadow: 'inset 0 0 0 1.5px #F3C4C4',
                cursor: cancelling ? 'not-allowed' : 'pointer',
                opacity: cancelling ? 0.6 : 1,
              }}
            >
              {cancelling ? 'Membatalkan...' : 'Batalkan'}
            </button>
          )}

          {isCompleted && (
            <Link
              to="/customer/history"
              style={{
                height: '46px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
                boxSizing: 'border-box',
                flex: 1,
                background: '#E6F4F2',
                color: '#0B5F59',
              }}
            >
              Lihat riwayat
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}