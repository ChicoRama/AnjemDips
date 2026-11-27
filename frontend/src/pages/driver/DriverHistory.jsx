
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import BottomNav from '../../components/BottomNav';

const HISTORY_STATUSES = ['completed', 'cancelled'];

function formatRibuan(value) {
  return (Number(value) || 0).toLocaleString('id-ID');
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

function readCache(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(cached) ? cached : [];
  } catch {
    return [];
  }
}

function saveCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Cache riwayat tidak dapat disimpan:', error);
  }
}

export default function DriverHistory() {
  const { user } = useAuth();
  const userId = user?.id;
  const cacheKey = `anjemdips:history:driver:${userId || 'guest'}`;

  const [orders, setOrders] = useState(() => readCache(cacheKey));
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Tampilkan cache terlebih dahulu.
    const cached = readCache(cacheKey);
    setOrders(cached);
    setLoading(false);

    try {
      const res = await api.get('/orders');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];

      const driverHistory = list.filter(
        (item) =>
          item.driver_id === userId &&
          HISTORY_STATUSES.includes(item.status)
      );

      // Respons kosong tidak boleh menghapus cache yang sudah ada.
      if (driverHistory.length > 0) {
        setOrders(driverHistory);
        saveCache(cacheKey, driverHistory);
      } else if (cached.length > 0) {
        setOrders(cached);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.warn('Gagal mengambil riwayat dari server:', error);
      setOrders(cached);
    } finally {
      setLoading(false);
    }
  }, [userId, cacheKey]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const completedOrders = orders.filter(
    (item) => item.status === 'completed'
  );

  const totalEarnings = completedOrders.reduce(
    (sum, item) => sum + (Number(item.ongkir) || 0),
    0
  );

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
          Riwayat pengantaran dan total pendapatan.
        </div>

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
        <Card
          variant="soft"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ color: '#0B5F59', fontSize: '11.5px', fontWeight: 600 }}>
              Total pendapatan bersih
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '20px',
                color: '#0B4F4A',
                marginTop: '2px',
              }}
            >
              Rp {formatRibuan(totalEarnings)}
            </div>
          </div>
          <Chip variant="teal">{completedOrders.length} selesai</Chip>
        </Card>

        {loading ? (
          <Card style={{ textAlign: 'center', color: '#5B6678' }}>
            Memuat riwayat pengantaran...
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card
            style={{
              textAlign: 'center',
              padding: '24px 16px',
              color: '#5B6678',
            }}
          >
            <div style={{ fontWeight: 800, color: '#0F172A' }}>
              Belum ada riwayat
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Pengantaran yang sudah selesai atau dibatalkan akan tampil di
              sini.
            </div>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const isJastip = order.jenis_layanan === 'jastip';
            const isCompleted = order.status === 'completed';

            return (
              <Card
                key={order.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      {isJastip ? 'JasTip' : 'AnJem'} ·{' '}
                      {order.customer?.nama || 'Mahasiswa'}
                    </div>
                    <div style={{ color: '#5B6678', fontSize: '11.5px' }}>
                      {formatTanggal(order.updated_at || order.created_at)}
                    </div>
                  </div>
                  <Chip variant={isCompleted ? 'success' : 'danger'}>
                    {isCompleted ? 'Selesai' : 'Dibatalkan'}
                  </Chip>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: '#5B6678', fontSize: '12px' }}>
                    Upah diterima
                  </span>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '14px',
                      color: isCompleted ? '#0F766E' : '#5B6678',
                    }}
                  >
                    Rp {formatRibuan(order.ongkir)}
                  </span>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <BottomNav role="driver" />
    </div>
  );
}
