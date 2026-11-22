import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import BottomNav from '../../components/BottomNav';

const HISTORY_STATUSES = ['completed', 'cancelled'];

function formatRibuan(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('id-ID');
}

function formatTanggal(isoString) {
  if (!isoString) return 'Hari ini';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Hari ini';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function CustomerHistory() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'completed' | 'cancelled'
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      const historyList = list.filter((item) =>
        HISTORY_STATUSES.includes(item.status)
      );
      setOrders(historyList);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Migrasi dari CustomerDashboard.jsx: hapus riwayat pesanan yang dibatalkan
  const handleDeleteOrder = async (orderId) => {
    setError('');
    setDeletingId(orderId);
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders((prev) => prev.filter((item) => item.id !== orderId));
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal menghapus riwayat pesanan.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredOrders = orders.filter((item) => {
    if (filter === 'completed') return item.status === 'completed';
    if (filter === 'cancelled') return item.status === 'cancelled';
    return true;
  });

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
          History
        </h1>
        <div style={{ color: '#5B6678', marginTop: '2px' }}>
          Riwayat perjalanan dan titipan.
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            background: '#E8EBEF',
            borderRadius: '12px',
            padding: '3px',
            gap: '3px',
            marginTop: '14px',
          }}
        >
          {[
            { key: 'all', label: 'Semua' },
            { key: 'completed', label: 'Selesai' },
            { key: 'cancelled', label: 'Dibatalkan' },
          ].map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                style={{
                  flex: 1,
                  height: '36px',
                  borderRadius: '9px',
                  border: 0,
                  background: active ? '#fff' : 'transparent',
                  color: active ? '#0F766E' : '#5B6678',
                  font: "700 12px 'Plus Jakarta Sans',system-ui,sans-serif",
                  boxShadow: active ? '0 1px 3px rgba(15,23,42,.12)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daftar Riwayat */}
      <div
        style={{
          flex: 1,
          padding: '14px 20px 84px',
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
            Memuat riwayat...
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '6px',
              padding: '24px 16px',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '15px' }}>
              Belum ada riwayat pesanan
            </div>
            <div style={{ color: '#5B6678', fontSize: '12px' }}>
              Pesanan AnJem atau JasTip yang sudah selesai atau dibatalkan akan
              muncul di sini.
            </div>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const isJastip = order.jenis_layanan === 'jastip';
            const isMotor = order.jenis_kendaraan === 'motor';
            const vehicleLabel = isMotor ? 'Motor' : 'Mobil';
            const isCompleted = order.status === 'completed';

            const hargaBarang = Number(order.perkiraan_harga_barang) || 0;
            const ongkir = Number(order.ongkir) || 0;
            const totalHarga = isJastip ? hargaBarang + ongkir : ongkir;

            const repeatRoute = isJastip
              ? '/customer/jastip'
              : '/customer/anjem';

            return (
              <Card
                key={order.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
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
                    <div style={{ fontWeight: 800 }}>
                      {isJastip ? 'JasTip' : `AnJem · ${vehicleLabel}`}
                    </div>
                    <div style={{ color: '#5B6678', fontSize: '11.5px' }}>
                      {formatTanggal(order.created_at)}
                      {order.driver?.nama ? ` · ${order.driver.nama}` : ''}
                    </div>
                  </div>

                  <Chip variant={isCompleted ? 'success' : 'danger'}>
                    {isCompleted ? 'Selesai' : 'Dibatalkan'}
                  </Chip>
                </div>

                {/* Rute / Detail Barang */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    paddingLeft: '2px',
                  }}
                >
                  {isJastip && order.nama_barang && (
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '12.5px',
                        color: '#0F172A',
                      }}
                    >
                      {order.nama_barang}
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '99px',
                        background: '#0F766E',
                        flex: 'none',
                      }}
                    />
                    <span style={{ color: '#475569', fontSize: '12.5px' }}>
                      {order.titik_jemput}
                    </span>
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
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        background: '#F59E0B',
                        flex: 'none',
                      }}
                    />
                    <span style={{ color: '#475569', fontSize: '12.5px' }}>
                      {order.titik_antar}
                    </span>
                  </div>
                </div>

                <div style={{ height: '1px', background: '#EEF0F3' }} />

                {/* Total & Tombol Aksi */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ color: '#5B6678', fontSize: '11px' }}>
                      Total biaya
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '14px' }}>
                      Rp {formatRibuan(totalHarga)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!isCompleted && (
                      <button
                        type="button"
                        disabled={deletingId === order.id}
                        onClick={() => handleDeleteOrder(order.id)}
                        style={{
                          height: '36px',
                          padding: '0 12px',
                          borderRadius: '10px',
                          border: 0,
                          background: '#fff',
                          boxShadow: 'inset 0 0 0 1.5px #F3C4C4',
                          color: '#B91C1C',
                          font: "700 12px 'Plus Jakarta Sans',system-ui,sans-serif",
                          cursor:
                            deletingId === order.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {deletingId === order.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    )}

                    <Link
                      to={repeatRoute}
                      style={{
                        height: '36px',
                        padding: '0 14px',
                        borderRadius: '10px',
                        background: '#E6F4F2',
                        color: '#0B5F59',
                        fontWeight: 700,
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      Pesan lagi
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav role="customer" />
    </div>
  );
}

