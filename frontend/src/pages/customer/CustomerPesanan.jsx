import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

export default function CustomerPesanan() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');

  const fetchActiveOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      const activeList = list.filter((item) =>
        ACTIVE_STATUSES.includes(item.status)
      );
      setOrders(activeList);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchActiveOrders]);

  const handleCancelOrder = async (orderId) => {
    setError('');
    setCancellingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, {
        status: 'cancelled',
      });
      await fetchActiveOrders();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal membatalkan pesanan.'
      );
    } finally {
      setCancellingId(null);
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
          Pesanan yang sedang berjalan.
        </div>
      </div>

      {/* Daftar Pesanan Aktif */}
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
            Memuat pesanan...
          </Card>
        ) : orders.length === 0 ? (
          <Card
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '8px',
              padding: '22px 16px',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '15px' }}>
              Belum ada pesanan aktif
            </div>
            <div style={{ color: '#5B6678', fontSize: '12px' }}>
              Pesanan AnJem atau JasTip yang sedang berjalan akan tampil di
              sini.
            </div>
            <Link
              to="/customer/anjem"
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
              Buat pesanan
            </Link>
          </Card>
        ) : (
          orders.map((order) => {
            const isJastip = order.jenis_layanan === 'jastip';
            const isMotor = order.jenis_kendaraan === 'motor';
            const vehicleLabel = isMotor ? 'Motor' : 'Mobil';
            const isPending = order.status === 'pending';
            const isOnWay = [
              'on_progress',
              'on_the_way',
              'in_progress',
            ].includes(order.status);

            const hargaBarang = Number(order.perkiraan_harga_barang) || 0;
            const ongkir = Number(order.ongkir) || 0;
            const totalHarga = isJastip ? hargaBarang + ongkir : ongkir;

            // Tampilan kartu pesanan yang masih menunggu driver (pending)
            if (isPending) {
              return (
                <Card
                  key={order.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
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
                      <div
                        style={{
                          color: '#5B6678',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {isJastip
                          ? order.nama_barang ||
                            `${order.titik_jemput} â†’ ${order.titik_antar}`
                          : `${order.titik_jemput} â†’ ${order.titik_antar}`}
                      </div>
                    </div>

                    <Chip variant="warning">Menunggu driver</Chip>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#5B6678' }}>
                      {isJastip
                        ? hargaBarang > 0
                          ? `Barang Rp ${formatRibuan(hargaBarang)} + upah Rp ${formatRibuan(ongkir)}`
                          : `Upah Rp ${formatRibuan(ongkir)}`
                        : `${order.jumlah_penumpang || 1} penumpang · ${
                            order.waktu_berangkat === 'jadwal'
                              ? 'Jadwal'
                              : 'Sekarang'
                          }`}
                    </span>
                    <span style={{ fontWeight: 800 }}>
                      Rp {formatRibuan(totalHarga)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={cancellingId === order.id}
                    onClick={() => handleCancelOrder(order.id)}
                    style={{
                      height: '44px',
                      borderRadius: '12px',
                      border: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      font: "700 13px 'Plus Jakarta Sans',system-ui,sans-serif",
                      textDecoration: 'none',
                      boxSizing: 'border-box',
                      background: '#fff',
                      color: '#B91C1C',
                      boxShadow: 'inset 0 0 0 1.5px #F3C4C4',
                      width: '100%',
                      cursor:
                        cancellingId === order.id ? 'not-allowed' : 'pointer',
                      opacity: cancellingId === order.id ? 0.6 : 1,
                    }}
                  >
                    {cancellingId === order.id
                      ? 'Membatalkan...'
                      : 'Batalkan pesanan'}
                  </button>
                </Card>
              );
            }

            // Tampilan kartu pesanan aktif yang sudah diterima driver
            const driverName = order.driver?.nama || 'Driver';
            const driverPlat = order.driver?.plat_nomor;
            const driverWa = formatWaUrl(
              order.driver?.no_wa,
              `Halo kak ${driverName}, saya pemesan AnjemDips.`
            );

            return (
              <Card
                key={order.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
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
                    <div style={{ color: '#5B6678', fontSize: '12px' }}>
                      {isJastip && order.nama_barang
                        ? order.nama_barang
                        : `Hari ini · ${
                            order.waktu_berangkat === 'jadwal'
                              ? 'Jadwal'
                              : 'Berangkat sekarang'
                          }`}
                    </div>
                  </div>

                  <Chip variant="teal">
                    {isOnWay ? 'Di jalan' : 'Menjemput'}
                  </Chip>
                </div>

                {/* Rute Jemput & Tujuan */}
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
                    <span style={{ fontWeight: 600 }}>
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
                        width: '10px',
                        height: '10px',
                        borderRadius: '3px',
                        background: '#F59E0B',
                        flex: 'none',
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>
                      {order.titik_antar}
                    </span>
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

                {/* Driver & Harga */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: '#5B6678' }}>
                    {driverName}
                    {driverPlat ? ` · ${driverPlat}` : ''}
                  </span>
                  <span style={{ fontWeight: 800 }}>
                    Rp {formatRibuan(totalHarga)}
                  </span>
                </div>

                {/* Tombol Aksi */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    to="/customer/lacak"
                    state={{ order }}
                    style={{
                      height: '44px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                      textDecoration: 'none',
                      boxSizing: 'border-box',
                      flex: 1,
                      background: '#0F766E',
                      color: '#fff',
                    }}
                  >
                    Lacak driver
                  </Link>

                  {driverWa ? (
                    <a
                      href={driverWa}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        height: '44px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '13px',
                        textDecoration: 'none',
                        boxSizing: 'border-box',
                        flex: 1,
                        background: '#fff',
                        color: '#0F172A',
                        boxShadow: 'inset 0 0 0 1.5px #D5DAE1',
                      }}
                    >
                      Hubungi
                    </a>
                  ) : (
                    <Link
                      to="/customer/lacak"
                      state={{ order }}
                      style={{
                        height: '44px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '13px',
                        textDecoration: 'none',
                        boxSizing: 'border-box',
                        flex: 1,
                        background: '#fff',
                        color: '#0F172A',
                        boxShadow: 'inset 0 0 0 1.5px #D5DAE1',
                      }}
                    >
                      Hubungi
                    </Link>
                  )}
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

