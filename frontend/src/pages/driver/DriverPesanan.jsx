import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import BottomNav from '../../components/BottomNav';
import { waktuLabel } from '../../utils/format';

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

export default function DriverPesanan() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  const fetchDriverOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      const activeList = list.filter(
        (item) =>
          item.driver_id === user?.id &&
          DRIVER_ACTIVE_STATUSES.includes(item.status)
      );
      setOrders(activeList);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDriverOrders();
    const interval = setInterval(fetchDriverOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchDriverOrders]);

  const handleUpdateStatus = async (orderId, nextStatus) => {
    setError('');
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, {
        status: nextStatus,
      });
      await fetchDriverOrders();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal memperbarui status pesanan.'
      );
    } finally {
      setUpdatingId(null);
    }
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
          Pesanan
        </h1>
        <div style={{ color: '#5B6678', marginTop: '2px' }}>
          Pesanan aktif yang sedang kamu tangani.
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
        {error && (
          <div
            role="alert"
            style={{
              borderRadius: '12px',
              background: '#FEF2F2',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#B91C1C',
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <Card style={{ textAlign: 'center', color: '#5B6678' }}>
            Memuat pesanan aktif...
          </Card>
        ) : orders.length === 0 ? (
          <Card
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '8px',
              padding: '24px 16px',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '15px' }}>
              Belum ada pesanan aktif
            </div>
            <div style={{ color: '#5B6678', fontSize: '12px' }}>
              Ambil request masuk dari Beranda Driver untuk mulai mengantar.
            </div>
            <Link
              to="/driver"
              style={{
                marginTop: '6px',
                height: '40px',
                padding: '0 18px',
                borderRadius: '12px',
                background: '#0F766E',
                color: '#fff',
                fontWeight: 700,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              Lihat request masuk
            </Link>
          </Card>
        ) : (
          orders.map((order) => {
            const isJastip = order.jenis_layanan === 'jastip';
            const isMotor = order.jenis_kendaraan === 'motor';
            const isOnWay = ['on_progress', 'on_the_way', 'in_progress'].includes(
              order.status
            );

            const customerName = order.customer?.nama || 'Mahasiswa';
            const customerWa = formatWaUrl(
              order.customer?.no_wa,
              `Halo kak ${customerName}, saya driver AnjemDips yang mengambil pesananmu.`
            );

            const hargaBarang = Number(order.perkiraan_harga_barang) || 0;
            const ongkir = Number(order.ongkir) || 0;
            const totalTagihan = isJastip ? hargaBarang + ongkir : ongkir;

            return (
              <Card
                key={order.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Header Kartu */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
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
                    ) : isMotor ? (
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
                        <circle cx="6" cy="16" r="3" />
                        <circle cx="18" cy="16" r="3" />
                        <path d="M6 16l4-7h5l3 7M9 9H7" />
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
                    <div style={{ fontWeight: 800 }}>{customerName}</div>
                    <div style={{ color: '#5B6678', fontSize: '12px' }}>
                      {isJastip
                        ? `JasTip · ${order.nama_barang || 'Titip barang'}${
                            order.waktu_berangkat === 'jadwal'
                              ? ` · ${waktuLabel(order)}`
                              : ''
                          }`
                        : `AnJem · ${order.jumlah_penumpang || 1} penumpang${
                            order.waktu_berangkat === 'jadwal'
                              ? ` · ${waktuLabel(order)}`
                              : ''
                          }`}
                    </div>
                  </div>

                  <Chip variant="teal">
                    {isOnWay ? 'Di jalan' : 'Menjemput'}
                  </Chip>
                </div>

                {/* Rute */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingLeft: '2px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '99px',
                        background: '#0F766E',
                        flex: 'none',
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{order.titik_jemput}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '3px',
                        background: '#F59E0B',
                        flex: 'none',
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{order.titik_antar}</span>
                  </div>
                </div>

                {/* Progress Bar 4 Tahap */}
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '4px',
                      background: '#0F766E',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '4px',
                      background: '#0F766E',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '4px',
                      background: isOnWay ? '#0F766E' : '#E2E6EB',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '4px',
                      background: '#E2E6EB',
                    }}
                  />
                </div>

                <div
                  style={{
                    color: '#5B6678',
                    fontSize: '11.5px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Diterima</span>
                  <span
                    style={
                      !isOnWay
                        ? { color: '#0F766E', fontWeight: 700 }
                        : undefined
                    }
                  >
                    Menjemput
                  </span>
                  <span
                    style={
                      isOnWay
                        ? { color: '#0F766E', fontWeight: 700 }
                        : undefined
                    }
                  >
                    Di jalan
                  </span>
                  <span>Selesai</span>
                </div>

                {/* Rincian Tarif */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#F5F6F8',
                    borderRadius: '12px',
                    padding: '10px 12px',
                  }}
                >
                  <span style={{ color: '#5B6678', fontSize: '12px' }}>
                    {isJastip
                      ? `Upah Rp ${formatRibuan(ongkir)} + barang Rp ${formatRibuan(hargaBarang)}`
                      : 'Upah perjalanan'}
                  </span>
                  <span style={{ fontWeight: 800, color: '#0F766E' }}>
                    Rp {formatRibuan(totalTagihan)}
                  </span>
                </div>

                {/* Tombol Tahap Perjalanan Utama */}
                {!isOnWay ? (
                  <button
                    type="button"
                    disabled={updatingId === order.id}
                    onClick={() => handleUpdateStatus(order.id, 'on_progress')}
                    style={{
                      height: '46px',
                      borderRadius: '14px',
                      border: 0,
                      background: '#0F766E',
                      color: '#fff',
                      font: "700 13.5px 'Plus Jakarta Sans',system-ui,sans-serif",
                      cursor:
                        updatingId === order.id ? 'not-allowed' : 'pointer',
                      width: '100%',
                    }}
                  >
                    {updatingId === order.id
                      ? 'Memperbarui...'
                      : isJastip
                      ? 'Barang dibeli · Mulai antar'
                      : 'Sudah jemput · Mulai antar'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={updatingId === order.id}
                    onClick={() => handleUpdateStatus(order.id, 'completed')}
                    style={{
                      height: '46px',
                      borderRadius: '14px',
                      border: 0,
                      background: '#16A34A',
                      color: '#fff',
                      font: "700 13.5px 'Plus Jakarta Sans',system-ui,sans-serif",
                      cursor:
                        updatingId === order.id ? 'not-allowed' : 'pointer',
                      width: '100%',
                    }}
                  >
                    {updatingId === order.id
                      ? 'Menyelesaikan...'
                      : 'Selesaikan pesanan'}
                  </button>
                )}

                {/* Tombol Peta, WhatsApp & Batalkan */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link
                    to="/driver/navigasi"
                    state={{ order }}
                    style={{
                      flex: 1,
                      height: '40px',
                      borderRadius: '12px',
                      background: '#fff',
                      boxShadow: 'inset 0 0 0 1.5px #D5DAE1',
                      color: '#0F172A',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    Peta
                  </Link>

                  {customerWa && (
                    <a
                      href={customerWa}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        height: '40px',
                        borderRadius: '12px',
                        background: '#E6F4F2',
                        color: '#0B5F59',
                        fontWeight: 700,
                        fontSize: '12.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      WhatsApp
                    </a>
                  )}

                  <button
                    type="button"
                    disabled={updatingId === order.id}
                    onClick={() => {
                      if (
                        window.confirm(
                          'Yakin batalkan pesanan ini? Pemesan akan diberi tahu.'
                        )
                      ) {
                        handleUpdateStatus(order.id, 'cancelled');
                      }
                    }}
                    style={{
                      flex: 1,
                      height: '40px',
                      borderRadius: '12px',
                      border: 0,
                      background: '#fff',
                      boxShadow: 'inset 0 0 0 1.5px #F3C4C4',
                      color: '#B91C1C',
                      font: "700 12.5px 'Plus Jakarta Sans',system-ui,sans-serif",
                      cursor:
                        updatingId === order.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Batalkan
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav role="driver" />
    </div>
  );
}
