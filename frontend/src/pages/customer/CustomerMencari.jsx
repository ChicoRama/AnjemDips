import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Button from '../../components/Button';
import { waktuLabel } from '../../utils/format';

function formatRibuan(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('id-ID');
}

export default function CustomerMencari() {
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(() => location.state?.order || null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [offerCount, setOfferCount] = useState(0);

  // Ambil order pending terbaru jika halaman dibuka langsung / di-refresh,
  // sekaligus pantau berkala jika driver sudah menerima pesanan
  useEffect(() => {
    let isMounted = true;

    const syncOrder = async () => {
      try {
        const res = await api.get('/orders');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];

        const target = order?.id
          ? list.find((item) => item.id === order.id)
          : list.find((item) => item.status === 'pending');

        if (!isMounted || !target) return;

        setOrder(target);

        if (target.status === 'pending') {
          try {
            const offersRes = await api.get(`/orders/${target.id}/offers`);
            const offerList = Array.isArray(offersRes.data?.data)
              ? offersRes.data.data
              : [];
            if (isMounted) {
              setOfferCount(
                offerList.filter(
                  (o) => o.offered_by === 'driver' && o.status === 'pending'
                ).length
              );
            }
          } catch {
            // Abaikan error jaringan sementara saat memuat tawaran
          }
        }

        if (
          ['accepted', 'on_progress', 'on_the_way', 'in_progress'].includes(
            target.status
          )
        ) {
          navigate('/customer/lacak', {
            replace: true,
            state: { order: target },
          });
        }
      } catch {
        // Abaikan error jaringan sementara saat polling
      }
    };

    syncOrder();
    const interval = setInterval(syncOrder, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [order?.id, navigate]);

  const isJastip = order?.jenis_layanan === 'jastip';
  const backPath = isJastip ? '/customer/jastip' : '/customer/anjem';

  const vehicleLabel =
    order?.jenis_kendaraan === 'motor' ? 'Motor' : 'Mobil';
  const penumpangCount = order?.jumlah_penumpang || 1;
  const waktuText = waktuLabel(order);

  const handleCancel = async () => {
    if (!order?.id) {
      navigate(backPath);
      return;
    }

    setError('');
    setCancelling(true);
    try {
      await api.patch(`/orders/${order.id}/status`, {
        status: 'cancelled',
      });
      navigate(backPath);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal membatalkan pesanan.'
      );
    } finally {
      setCancelling(false);
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
      {/* Peta Radar Latar */}
      <svg
        width="390"
        height="560"
        viewBox="0 0 390 560"
        fill="none"
        aria-hidden="true"
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <path
          d="M-10 420 C90 380 140 300 220 320 S350 380 400 260"
          stroke="#fff"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M120 -10 C150 100 100 200 160 330 S220 480 200 570"
          stroke="#fff"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path d="M-10 150 L400 110" stroke="#fff" strokeWidth="9" />
        <path
          d="M270 -10 C290 60 250 140 300 250"
          stroke="#fff"
          strokeWidth="7"
        />
        <rect x="300" y="330" width="70" height="60" rx="10" fill="#DDE7E4" />
        <rect x="20" y="200" width="70" height="80" rx="10" fill="#DDE7E4" />
        <circle cx="195" cy="300" r="130" fill="#0F766E" fillOpacity=".07" />
        <circle cx="195" cy="300" r="88" fill="#0F766E" fillOpacity=".1" />
        <circle cx="195" cy="300" r="48" fill="#0F766E" fillOpacity=".16" />
        <circle
          cx="195"
          cy="300"
          r="12"
          fill="#0F766E"
          stroke="#fff"
          strokeWidth="4"
        />
        <circle
          cx="260"
          cy="240"
          r="7"
          fill="#fff"
          stroke="#5B6678"
          strokeWidth="2"
        />
        <circle
          cx="130"
          cy="350"
          r="7"
          fill="#fff"
          stroke="#5B6678"
          strokeWidth="2"
        />
        <circle
          cx="230"
          cy="380"
          r="7"
          fill="#fff"
          stroke="#5B6678"
          strokeWidth="2"
        />
      </svg>

      {/* Tombol Kembali Mengambang */}
      <Link
        to={backPath}
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

      {/* Bottom Sheet Status Pencarian */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#fff',
          borderRadius: '28px 28px 0 0',
          padding: '12px 20px 20px',
          boxShadow: '0 -8px 30px rgba(15,23,42,.1)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '4px',
            borderRadius: '4px',
            background: '#D5DAE1',
            margin: '0 auto 16px',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '99px',
              background: '#E6F4F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0F766E"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="animate-spin"
            >
              <path d="M21 12a9 9 0 1 1-6.2-8.55" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '17px',
                letterSpacing: '-.01em',
              }}
            >
              Mencari driver…
            </div>
            <div style={{ color: '#5B6678' }}>
              {isJastip
                ? 'Permintaanmu dikirim ke driver JasTip yang aktif di sekitarmu.'
                : `Permintaanmu dikirim ke driver ${vehicleLabel} yang aktif di sekitarmu.`}
            </div>
          </div>
        </div>

        {/* Kartu Ringkasan Rute & Harga */}
        <div
          style={{
            marginTop: '16px',
            background: '#F5F6F8',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '99px',
                background: '#0F766E',
                flex: 'none',
              }}
            />
            <span style={{ fontWeight: 600 }}>
              {order?.titik_jemput || 'Titik jemput'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                background: '#F59E0B',
                flex: 'none',
              }}
            />
            <span style={{ fontWeight: 600 }}>
              {order?.titik_antar || 'Tujuan'}
            </span>
          </div>

          <div style={{ height: '1px', background: '#E2E6EB' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#5B6678' }}>
              {isJastip
                ? `JasTip · ${order?.nama_barang || 'Titip barang'} · ${waktuText}`
                : `${vehicleLabel} · ${penumpangCount} penumpang · ${waktuText}`}
            </span>
            <span style={{ fontWeight: 800 }}>
              Rp {formatRibuan(order?.ongkir ?? 15000)}
            </span>
          </div>
        </div>

        <div
          style={{
            color: '#5B6678',
            fontSize: '12px',
            marginTop: '12px',
            textAlign: 'center',
          }}
        >
          Biasanya 1–2 menit. Kamu akan melihat tawaran begitu driver menjawab.
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

        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          <Button
            type="button"
            variant="dangerOutline"
            disabled={cancelling}
            onClick={handleCancel}
            style={{ flex: 1 }}
          >
            {cancelling ? 'Membatalkan...' : 'Batalkan'}
          </Button>
          <Button
            to="/customer/tawaran"
            state={order ? { order } : undefined}
            variant="primary"
            disabled={offerCount === 0}
            style={{ flex: 1 }}
          >
            {offerCount > 0
              ? `Lihat tawaran (${offerCount})`
              : 'Belum ada tawaran'}
          </Button>
        </div>
      </div>
    </div>
  );
}
