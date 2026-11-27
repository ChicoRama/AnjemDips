import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Button from '../../components/Button';
import BottomNav from '../../components/BottomNav';
import NotificationCenter from '../../components/NotificationCenter';
import { getDriverVehicleProfile } from '../../mocks/driverMocks';
import { formatRibuan, waktuLabel } from '../../utils/format';

const ACTIVE_TRIP_STATUSES = [
  'accepted',
  'on_progress',
  'on_the_way',
  'in_progress',
];

function isSameDay(isoDate) {
  if (!isoDate) return false;
  const target = new Date(isoDate);
  const now = new Date();
  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  );
}

export default function DriverBeranda() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState(Boolean(user?.is_online));
  const [togglingStatus, setTogglingStatus] = useState(false);

  const [pendingOrders, setPendingOrders] = useState([]);
  const [offerMap, setOfferMap] = useState({}); // orderId -> tawaran terbaru driver ini
  const [activeTrip, setActiveTrip] = useState(null);
  const [todayStats, setTodayStats] = useState({ count: 0, earnings: 0 });
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [error, setError] = useState('');

  const vehicle = getDriverVehicleProfile(user);
  const vehicleLabel =
    vehicle.jenis_kendaraan === 'mobil'
      ? 'Mobil'
      : vehicle.jenis_kendaraan === 'motor'
      ? 'Motor'
      : 'Kendaraan';
  const platLabel = vehicle.plat_nomor || 'plat belum diisi';

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];

      const incoming = list.filter((item) => item.status === 'pending');
      const running = list.find(
        (item) =>
          item.driver_id === user?.id &&
          ACTIVE_TRIP_STATUSES.includes(item.status)
      );

      const completedToday = list.filter(
        (item) =>
          item.driver_id === user?.id &&
          item.status === 'completed' &&
          isSameDay(item.updated_at || item.created_at)
      );

      const totalEarnings = completedToday.reduce(
        (sum, item) => sum + (Number(item.ongkir) || 0),
        0
      );

      // Ambil tawaran terbaru driver ini untuk tiap request (tawar balik / tawaran terkirim)
      const offerEntries = await Promise.all(
        incoming.map(async (item) => {
          try {
            const offersRes = await api.get(`/orders/${item.id}/offers`);
            const offerList = Array.isArray(offersRes.data?.data)
              ? offersRes.data.data
              : [];
            return [item.id, offerList[0] || null];
          } catch {
            return [item.id, null];
          }
        })
      );

      setPendingOrders(incoming);
      setOfferMap(Object.fromEntries(offerEntries));
      setActiveTrip(running || null);
      setTodayStats({
        count: completedToday.length,
        earnings: totalEarnings,
      });
    } catch {
      // Pertahankan data terakhir jika jaringan bermasalah sementara
    } finally {
      setLoadingOrders(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleToggleOnline = async () => {
    if (togglingStatus) return;
    setTogglingStatus(true);
    setError('');
    try {
      const next = !isOnline;
      const res = await api.patch('/driver/status', { is_online: next });
      updateUser(res.data.user);
      setIsOnline(next);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal mengubah status online.'
      );
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleQuickAccept = async (order) => {
    setError('');
    setAcceptingId(order.id);
    try {
      const res = await api.patch(`/orders/${order.id}/accept`);
      navigate('/driver/pesanan', {
        state: { order: res.data?.data || order },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal mengambil pesanan ini.'
      );
      await fetchOrders();
    } finally {
      setAcceptingId(null);
    }
  };

  const displayName = user?.nama || 'Driver';
  const initial = (displayName.trim()[0] || 'D').toUpperCase();

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

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 'none' }}>
          <NotificationCenter />
        {/* Toggle Status OFF / ON */}
        <button
          type="button"
          onClick={handleToggleOnline}
          disabled={togglingStatus}
          aria-pressed={isOnline}
          style={{
            height: '38px',
            padding: '0 14px',
            borderRadius: '99px',
            border: 0,
            background: isOnline ? '#DDF3E4' : '#E8EAEE',
            color: isOnline ? '#14532D' : '#475569',
            font: "800 12px 'Plus Jakarta Sans',system-ui,sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '99px',
              background: isOnline ? '#16A34A' : '#64748B',
            }}
          />
          {isOnline ? 'ON · Aktif' : 'OFF · Nonaktif'}
        </button>
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
        {/* Banner: data kendaraan belum lengkap */}
        {!vehicle.lengkap && (
          <Card
            to="/driver/profil"
            style={{
              background: '#FEF6E7',
              boxShadow: '0 0 0 1.5px #F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: '#4A2C03' }}>
                Lengkapi data kendaraan
              </div>
              <div style={{ fontSize: '12px', color: '#6B4308' }}>
                Jenis kendaraan dan plat nomor wajib diisi sebelum bisa
                menerima atau menawar order.
              </div>
            </div>
            <span
              style={{
                background: '#F59E0B',
                color: '#3B2402',
                borderRadius: '99px',
                padding: '5px 11px',
                fontSize: '11px',
                fontWeight: 800,
                flex: 'none',
              }}
            >
              Isi sekarang
            </span>
          </Card>
        )}

        {/* Kartu Kendaraan & Status Operasional */}
        {isOnline ? (
          <Card
            variant="soft"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: '#0F766E',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                }}
              >
                {vehicle.jenis_kendaraan === 'mobil' ? (
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 16v-4l2-5h12l2 5v4zM4 16v3M20 16v3" />
                  </svg>
                ) : (
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="6" cy="16" r="3" />
                    <circle cx="18" cy="16" r="3" />
                    <path d="M6 16l4-7h5l3 7M9 9H7" />
                  </svg>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#0B4F4A' }}>
                  {vehicle.lengkap ? 'Siap menerima order' : 'Status ON'}
                </div>
                <div style={{ fontSize: '12px', color: '#0B5F59' }}>
                  {vehicleLabel} · {platLabel}
                  {vehicle.jenis_kendaraan === 'mobil'
                    ? ` · Maks ${vehicle.kapasitas_penumpang} org`
                    : ''}
                </div>
              </div>
            </div>
            <Chip variant="success">Online</Chip>
          </Card>
        ) : (
          <Card
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: '#F1F3F6',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
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
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                  <line x1="12" y1="2" x2="12" y2="12" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>
                  Status kamu sedang OFF
                </div>
                <div style={{ color: '#5B6678', fontSize: '12px' }}>
                  Aktifkan status untuk mulai melihat dan mengambil request
                  mahasiswa.
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              height={44}
              onClick={handleToggleOnline}
            >
              Mulai terima order (ON)
            </Button>
          </Card>
        )}

        {/* Ringkasan Pendapatan & Trip Hari Ini */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Card style={{ flex: 1, padding: '12px 14px' }}>
            <div style={{ color: '#5B6678', fontSize: '11px' }}>
              Pendapatan hari ini
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '18px',
                color: '#0F766E',
                marginTop: '2px',
              }}
            >
              Rp {formatRibuan(todayStats.earnings)}
            </div>
          </Card>

          <Card style={{ flex: 1, padding: '12px 14px' }}>
            <div style={{ color: '#5B6678', fontSize: '11px' }}>
              Trip selesai
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '18px',
                color: '#0F172A',
                marginTop: '2px',
              }}
            >
              {todayStats.count} pesanan
            </div>
          </Card>
        </div>

        {/* Banner Pesanan yang Sedang Berjalan */}
        {activeTrip && (
          <Card
            to="/driver/pesanan"
            style={{
              background: '#0F766E',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: '#C9ECE8', fontWeight: 600 }}>
                Pesanan sedang berjalan
              </div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {activeTrip.customer?.nama || 'Pemesan'} ·{' '}
                {activeTrip.titik_antar}
              </div>
            </div>
            <span
              style={{
                background: '#fff',
                color: '#0F766E',
                borderRadius: '99px',
                padding: '5px 11px',
                fontSize: '11px',
                fontWeight: 800,
                flex: 'none',
              }}
            >
              Lanjutkan
            </span>
          </Card>
        )}

        {/* Section Header Request Masuk */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '2px',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '14px' }}>
            Request masuk ({isOnline ? pendingOrders.length : 0})
          </div>
          <span style={{ fontSize: '11.5px', color: '#5B6678' }}>
            {vehicleLabel} · {platLabel}
          </span>
        </div>

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

        {/* Daftar Request Masuk */}
        {!isOnline ? (
          <Card
            style={{
              textAlign: 'center',
              padding: '22px 16px',
              color: '#5B6678',
            }}
          >
            <div style={{ fontWeight: 700, color: '#0F172A' }}>
              Radar request nonaktif
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Ubah status menjadi ON di kanan atas untuk melihat permintaan
              masuk.
            </div>
          </Card>
        ) : loadingOrders ? (
          <Card style={{ textAlign: 'center', color: '#5B6678' }}>
            Mencari request di sekitarmu...
          </Card>
        ) : pendingOrders.length === 0 ? (
          <Card
            style={{
              textAlign: 'center',
              padding: '24px 16px',
              color: '#5B6678',
            }}
          >
            <div style={{ fontWeight: 800, color: '#0F172A' }}>
              Belum ada request baru
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Tetap aktifkan halaman ini, pesanan baru akan muncul otomatis.
            </div>
          </Card>
        ) : (
          pendingOrders.map((order) => {
            const isJastip = order.jenis_layanan === 'jastip';
            const orderVehicle =
              order.jenis_kendaraan === 'mobil' ? 'Mobil' : 'Motor';

            const requestedPax = Number(order.jumlah_penumpang) || 1;
            const isMismatch =
              !isJastip &&
              Boolean(order.jenis_kendaraan) &&
              Boolean(vehicle.jenis_kendaraan) &&
              order.jenis_kendaraan !== vehicle.jenis_kendaraan;
            const isOverCapacity =
              !isJastip &&
              Boolean(vehicle.kapasitas_penumpang) &&
              requestedPax > vehicle.kapasitas_penumpang;

            const latestOffer = offerMap[order.id] || null;
            const hasCounter =
              latestOffer?.offered_by === 'customer' &&
              latestOffer?.status === 'pending';
            const hasMyBid =
              latestOffer?.offered_by === 'driver' &&
              latestOffer?.status === 'pending';

            const quickBlocked =
              !vehicle.lengkap || !isOnline || isMismatch || isOverCapacity;

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
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: 0,
                    }}
                  >
                    <Chip variant={isJastip ? 'warning' : 'teal'}>
                      {isJastip ? 'JasTip' : `AnJem · ${orderVehicle}`}
                    </Chip>
                    <span
                      style={{
                        fontSize: '11.5px',
                        color: '#5B6678',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {waktuLabel(order)}
                    </span>
                  </div>

                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '15px',
                      color: '#0F766E',
                      flex: 'none',
                    }}
                  >
                    Rp {formatRibuan(order.ongkir)}
                  </span>
                </div>

                {/* Penanda status request */}
                {(isMismatch || isOverCapacity || hasCounter || hasMyBid) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {isMismatch && <Chip variant="danger">Beda kendaraan</Chip>}
                    {isOverCapacity && (
                      <Chip variant="danger">Melebihi kapasitas</Chip>
                    )}
                    {hasCounter && (
                      <Chip variant="warning">
                        Tawar balik Rp {formatRibuan(latestOffer.offered_price)}
                      </Chip>
                    )}
                    {hasMyBid && (
                      <Chip variant="neutral">Tawaranmu terkirim</Chip>
                    )}
                  </div>
                )}

                {/* Info Pemesan / Barang */}
                <div style={{ fontWeight: 700, fontSize: '13px' }}>
                  {order.customer?.nama || 'Mahasiswa'}
                  {isJastip && order.nama_barang
                    ? ` · ${order.nama_barang}`
                    : !isJastip && order.jumlah_penumpang
                    ? ` · ${order.jumlah_penumpang} penumpang`
                    : ''}
                </div>

                {/* Rute Jemput & Antar */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
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
                      alignItems: 'center',
                      gap: '8px',
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

                {/* Tombol Detail & Terima */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                  <Link
                    to={`/driver/request/${order.id}`}
                    state={{ order }}
                    style={{
                      flex: 1,
                      height: '40px',
                      borderRadius: '11px',
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
                    {hasCounter ? 'Lihat tawar balik' : 'Detail / Nego'}
                  </Link>

                  <button
                    type="button"
                    disabled={acceptingId === order.id || quickBlocked}
                    onClick={() => handleQuickAccept(order)}
                    style={{
                      flex: 1,
                      height: '40px',
                      borderRadius: '11px',
                      border: 0,
                      background: quickBlocked ? '#E8EAEE' : '#0F766E',
                      color: quickBlocked ? '#64748B' : '#fff',
                      font: "700 12.5px 'Plus Jakarta Sans',system-ui,sans-serif",
                      cursor:
                        acceptingId === order.id || quickBlocked
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {acceptingId === order.id ? 'Memproses...' : 'Terima'}
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