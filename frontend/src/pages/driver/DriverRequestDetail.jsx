import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Button from '../../components/Button';
import { getDriverVehicleProfile } from '../../mocks/driverMocks';

function formatRibuan(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('id-ID');
}

export default function DriverRequestDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(() => location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [customerOffer, setCustomerOffer] = useState(null);
  const [acceptingOffer, setAcceptingOffer] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      try {
        const res = await api.get('/orders');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const found = list.find((item) => String(item.id) === String(id));
        if (isMounted && found) {
          setOrder(found);
        }
      } catch {
        // Gunakan state yang sudah diteruskan jika jaringan lambat
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrder();
    const interval = setInterval(loadOrder, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  // Pantau tawaran balik dari pemesan
  useEffect(() => {
    let isMounted = true;

    const loadOffers = async () => {
      try {
        const res = await api.get(`/orders/${id}/offers`);
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const latest = list[0];
        if (isMounted) {
          setCustomerOffer(
            latest &&
              latest.offered_by === 'customer' &&
              latest.status === 'pending'
              ? latest
              : null
          );
        }
      } catch {
        // Abaikan gangguan jaringan sementara
      }
    };

    loadOffers();
    const interval = setInterval(loadOffers, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  const vehicle = getDriverVehicleProfile(user);
  const isJastip = order?.jenis_layanan === 'jastip';

  const driverCapacity =
    vehicle.jenis_kendaraan === 'mobil'
      ? Number(vehicle.kapasitas_penumpang) || 4
      : 1;
  const requestedPassengers = Number(order?.jumlah_penumpang) || 1;
  const isOverCapacity = !isJastip && requestedPassengers > driverCapacity;
  const excessPassengers = Math.max(0, requestedPassengers - driverCapacity);

  const hargaBarang = Number(order?.perkiraan_harga_barang) || 0;
  const ongkir = Number(order?.ongkir) || 0;
  const perkiraanTotalJastip = hargaBarang + ongkir;

  const customerName = order?.customer?.nama || 'Mahasiswa';
  const customerInitial = (customerName.trim()[0] || 'M').toUpperCase();

  const handleAcceptOrder = async () => {
    if (!order?.id) return;
    setError('');
    setAccepting(true);
    try {
      const res = await api.patch(`/orders/${order.id}/accept`);
      navigate('/driver/pesanan', {
        state: { order: res.data?.data || order },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Pesanan ini sudah diambil driver lain atau tidak tersedia.'
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleAcceptCustomerOffer = async () => {
    if (!order?.id || !customerOffer) return;
    setError('');
    setAcceptingOffer(true);
    try {
      const res = await api.patch(
        `/orders/${order.id}/offers/${customerOffer.id}/accept`
      );
      navigate('/driver/pesanan', {
        state: { order: res.data?.data || order },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal menyetujui tawaran pemesan.'
      );
    } finally {
      setAcceptingOffer(false);
    }
  };

  return (
    <div
      className="pwa-shell"
      style={{
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
      <div
        style={{
          padding: '14px 20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '52px',
          flex: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/driver"
            aria-label="Kembali"
            style={{
              width: '44px',
              height: '44px',
              marginLeft: '-12px',
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
          <div
            style={{
              fontWeight: 800,
              fontSize: '17px',
              letterSpacing: '-.01em',
            }}
          >
            Detail request
          </div>
        </div>

        {order && (
          <Chip variant={isJastip ? 'warning' : 'teal'}>
            {isJastip
              ? 'JasTip'
              : `AnJem · ${order.jenis_kendaraan === 'mobil' ? 'Mobil' : 'Motor'}`}
          </Chip>
        )}
      </div>

      {/* Konten Utama */}
      <div
        style={{
          flex: 1,
          padding: '8px 20px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {loading && !order ? (
          <Card style={{ textAlign: 'center', color: '#5B6678' }}>
            Memuat detail request...
          </Card>
        ) : !order ? (
          <Card style={{ textAlign: 'center', color: '#5B6678' }}>
            Request tidak ditemukan atau sudah diambil.
          </Card>
        ) : (
          <>
            {/* Kartu Profil Pemesan */}
            <Card style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                  {order.customer?.nim
                    ? `NIM ${order.customer.nim}`
                    : 'Pemesan kampus'}
                </div>
              </div>
              <Chip variant="neutral">
                {order.waktu_berangkat === 'jadwal' ? 'Jadwal' : 'Sekarang'}
              </Chip>
            </Card>

            {/* Kartu Rute */}
            <Card
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ fontWeight: 800 }}>Rute pengantaran</div>

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
                <div>
                  <div style={{ fontSize: '11px', color: '#5B6678' }}>
                    {isJastip ? 'Beli / ambil di' : 'Titik jemput'}
                  </div>
                  <div style={{ fontWeight: 700 }}>{order.titik_jemput}</div>
                </div>
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
                <div>
                  <div style={{ fontSize: '11px', color: '#5B6678' }}>
                    {isJastip ? 'Antar ke' : 'Tujuan'}
                  </div>
                  <div style={{ fontWeight: 700 }}>{order.titik_antar}</div>
                </div>
              </div>

              {order.catatan && (
                <>
                  <div style={{ height: '1px', background: '#EEF0F3' }} />
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    <strong>Catatan:</strong> {order.catatan}
                  </div>
                </>
              )}
            </Card>

            {/* Kartu Detail Khusus AnJem (Kapasitas) vs JasTip (Barang) */}
            {isJastip ? (
              <Card
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontWeight: 800 }}>Detail titipan barang</div>
                <div
                  style={{
                    background: '#F5F6F8',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontWeight: 700,
                  }}
                >
                  {order.nama_barang || 'Titipan barang mahasiswa'}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: '#5B6678' }}>
                    Perkiraan harga barang
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    Rp {formatRibuan(hargaBarang)}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#FEF6E7',
                    borderRadius: '12px',
                    padding: '10px 12px',
                  }}
                >
                  <span style={{ color: '#6B4308', fontWeight: 600 }}>
                    Perkiraan total (barang + upah)
                  </span>
                  <span style={{ fontWeight: 800, color: '#4A2C03' }}>
                    Rp {formatRibuan(perkiraanTotalJastip)}
                  </span>
                </div>
              </Card>
            ) : (
              <Card
                variant={isOverCapacity ? 'danger' : 'default'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: isOverCapacity ? '#7F1D1D' : '#0F172A',
                    }}
                  >
                    Cek kapasitas kendaraan
                  </div>
                  <Chip variant={isOverCapacity ? 'danger' : 'success'}>
                    {isOverCapacity
                      ? `Kelebihan ${excessPassengers} orang`
                      : 'Muat'}
                  </Chip>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div
                    style={{
                      flex: 1,
                      background: isOverCapacity ? '#fff' : '#F5F6F8',
                      borderRadius: '12px',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#5B6678' }}>
                      Kapasitasmu
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '18px' }}>
                      {driverCapacity} org
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: isOverCapacity ? '#FDECEC' : '#DDF3E4',
                      borderRadius: '12px',
                      padding: '10px 12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        color: isOverCapacity ? '#991B1B' : '#14532D',
                      }}
                    >
                      Permintaan
                    </div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '18px',
                        color: isOverCapacity ? '#991B1B' : '#14532D',
                      }}
                    >
                      {requestedPassengers} org
                    </div>
                  </div>
                </div>

                {isOverCapacity && (
                  <div style={{ fontSize: '12px', color: '#7F1D1D' }}>
                    Jumlah penumpang melebihi kapasitas kendaraanmu. Kamu bisa
                    menawar harga ekstra lewat tombol “Tawar harga”.
                  </div>
                )}
              </Card>
            )}

            {/* Kartu Tawaran Harga Pemesan */}
            <Card
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ color: '#5B6678', fontSize: '11.5px' }}>
                  {isJastip
                    ? 'Upah driver ditawarkan'
                    : 'Tarif yang ditawarkan pemesan'}
                </div>
                <div style={{ fontSize: '11.5px', color: '#5B6678' }}>
                  Setujui langsung atau ajukan harga baru
                </div>
              </div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '20px',
                  color: '#0F766E',
                  letterSpacing: '-.02em',
                }}
              >
                Rp {formatRibuan(ongkir)}
              </div>
            </Card>
          </>
        )}

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
      </div>

      {/* Tombol Aksi Bawah */}
      {order && (
        <div
          style={{
            padding: '12px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flex: 'none',
          }}
        >
          {order.status !== 'pending' || order.driver_id ? (
            <Card variant="soft">
              <div style={{ fontWeight: 800, color: '#0B4F4A' }}>
                {order.driver_id === user?.id
                  ? 'Harga sudah disepakati'
                  : 'Pesanan ini sudah tidak tersedia'}
              </div>
              {order.driver_id === user?.id ? (
                <>
                  <div style={{ fontSize: '12px', color: '#0B5F59', marginTop: '4px' }}>
                    Harga final: Rp {formatRibuan(order.ongkir)}
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    height={44}
                    onClick={() => navigate('/driver/pesanan', { state: { order } })}
                  >
                    Lihat pesanan aktif
                  </Button>
                </>
              ) : (
                <div style={{ fontSize: '12px', color: '#5B6678', marginTop: '4px' }}>
                  Muat ulang daftar request untuk melihat pesanan lain.
                </div>
              )}
            </Card>
          ) : (
            <>
          {customerOffer && (
            <Card
              variant="soft"
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div style={{ fontWeight: 800, color: '#0B4F4A' }}>
                Pemesan menawar balik Rp{' '}
                {formatRibuan(customerOffer.offered_price)}
              </div>
              {customerOffer.adjusted_passengers ? (
                <div style={{ fontSize: '12px', color: '#0B5F59' }}>
                  Penumpang disesuaikan menjadi{' '}
                  {customerOffer.adjusted_passengers} orang.
                </div>
              ) : null}
              <Button
                type="button"
                variant="primary"
                height={44}
                disabled={acceptingOffer}
                onClick={handleAcceptCustomerOffer}
              >
                {acceptingOffer
                  ? 'Menyetujui...'
                  : `Setuju Rp ${formatRibuan(customerOffer.offered_price)}`}
              </Button>
            </Card>
          )}

          <Button
            type="button"
            variant="primary"
            disabled={accepting || isOverCapacity || !user?.is_online}
            onClick={handleAcceptOrder}
          >
            {accepting
              ? 'Menerima pesanan...'
              : isOverCapacity
              ? 'Melebihi kapasitas, silakan tawar'
              : !user?.is_online
              ? 'Aktifkan status ON dulu'
              : `Terima Rp ${formatRibuan(ongkir)}`}
          </Button>

          <Button
            to={`/driver/nego/${order.id}`}
            state={{ order }}
            variant="outline"
          >
            Tawar harga
          </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}