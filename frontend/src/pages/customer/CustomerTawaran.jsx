import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Button from '../../components/Button';

const EXTRA_PRICE_OPTIONS = [3000, 5000, 8000];

function formatRibuan(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('id-ID');
}

function OfferCard({
  order,
  offer,
  busy,
  onAccept,
  onCounter,
  onReject,
  onError,
}) {
  const driver = offer.driver || {};
  const driverName = driver.nama || 'Driver';
  const driverInitial = (driverName.trim()[0] || 'D').toUpperCase();
  const isMotorDriver = driver.jenis_kendaraan === 'motor';
  const vehicleLabel = isMotorDriver ? 'Motor' : 'Mobil';
  const capacity = isMotorDriver ? 1 : Number(driver.kapasitas_penumpang) || 4;

  const originalPassengers = Number(order?.jumlah_penumpang) || 1;
  const offerPassengers = Number(offer.adjusted_passengers) || originalPassengers;
  const isAnjem = order?.jenis_layanan === 'anjem';
  const isOverCapacity = isAnjem && offerPassengers > capacity;
  const excessCount = Math.max(0, offerPassengers - capacity);

  const isDriverOffer = offer.offered_by === 'driver';
  const baseCustomerOffer = Number(order?.ongkir) || 0;

  const [showCounter, setShowCounter] = useState(false);
  const [counterDigits, setCounterDigits] = useState(String(offer.offered_price));
  const [reducedPassengers, setReducedPassengers] = useState(
    Math.min(offerPassengers, capacity)
  );
  const [selectedExtra, setSelectedExtra] = useState(5000);

  // Tawaran pemesan sendiri yang masih menunggu jawaban driver
  if (!isDriverOffer) {
    return (
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
            flex: 'none',
          }}
        >
          {driverInitial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800 }}>{driverName}</div>
          <div style={{ color: '#5B6678', fontSize: '12px' }}>
            {offer.status === 'rejected'
              ? `Tawaranmu Rp ${formatRibuan(offer.offered_price)} ditolak driver. Tunggu tawaran baru dari driver.`
              : `Menunggu jawaban atas tawaranmu Rp ${formatRibuan(offer.offered_price)}`}
          </div>
        </div>
        <Chip variant={offer.status === 'rejected' ? 'danger' : 'warning'}>
          {offer.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
        </Chip>
      </Card>
    );
  }

  const handleSendCounter = () => {
    const parsed = Number(counterDigits);
    if (!parsed || parsed < 2000) {
      onError('Minimal tawaran harga adalah Rp 2.000.');
      return;
    }
    onCounter(offer.driver_id, parsed, null);
    setShowCounter(false);
  };

  const adjustedNewOffer = baseCustomerOffer + selectedExtra;

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Profil driver */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
          <div style={{ fontWeight: 800, fontSize: '15px' }}>{driverName}</div>
          <div style={{ color: '#5B6678', fontSize: '12px' }}>
            {vehicleLabel} · {driver.plat_nomor || '-'}
            {!isMotorDriver ? ` · Maks ${capacity} org` : ''}
          </div>
        </div>
        <Chip variant={driver.is_online ? 'teal' : 'off'}>
          {driver.is_online ? 'Online' : 'Offline'}
        </Chip>
      </div>

      {offer.note && (
        <div
          style={{
            background: '#F5F6F8',
            borderRadius: '12px',
            padding: '8px 12px',
            fontSize: '12px',
            color: '#475569',
          }}
        >
          <strong>Catatan driver:</strong> {offer.note}
        </div>
      )}

      {isOverCapacity ? (
        <>
          <div
            style={{
              background: '#FFF6F6',
              boxShadow: '0 0 0 1.5px #F3C4C4',
              borderRadius: '14px',
              padding: '12px',
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
              <div style={{ fontWeight: 800, color: '#7F1D1D' }}>
                Kapasitas kendaraan
              </div>
              <Chip variant="danger">Kelebihan {excessCount} orang</Chip>
            </div>
            <div style={{ fontSize: '12px', color: '#7F1D1D' }}>
              Penumpangmu ({offerPassengers}) melebihi kapasitas ({capacity}). Kurangi
              penumpang atau tawarkan harga ekstra.
            </div>

            <div
              style={{
                height: '44px',
                borderRadius: '12px',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 5px',
                boxShadow: 'inset 0 0 0 1.5px #F3C4C4',
              }}
            >
              <button
                type="button"
                aria-label="Kurangi"
                onClick={() => setReducedPassengers((p) => Math.max(1, p - 1))}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  border: 0,
                  background: '#F5F6F8',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                −
              </button>
              <span style={{ fontWeight: 800, fontSize: '15px' }}>
                {offerPassengers} → {reducedPassengers}
              </span>
              <button
                type="button"
                aria-label="Tambah"
                onClick={() =>
                  setReducedPassengers((p) => Math.min(offerPassengers, p + 1))
                }
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  border: 0,
                  background: '#F5F6F8',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {EXTRA_PRICE_OPTIONS.map((extra) => {
                const isSelected = selectedExtra === extra;
                return (
                  <button
                    key={extra}
                    type="button"
                    onClick={() => setSelectedExtra(extra)}
                    style={{
                      flex: 1,
                      height: '40px',
                      borderRadius: '12px',
                      border: 0,
                      background: isSelected ? '#0F766E' : '#fff',
                      boxShadow: isSelected ? 'none' : 'inset 0 0 0 1.5px #D5DAE1',
                      font: "700 12px 'Plus Jakarta Sans',system-ui,sans-serif",
                      color: isSelected ? '#fff' : '#0F172A',
                      cursor: 'pointer',
                    }}
                  >
                    + Rp {formatRibuan(extra)}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 700 }}>Total tawaran baru</span>
              <span style={{ fontWeight: 800, fontSize: '18px', color: '#0F766E' }}>
                Rp {formatRibuan(adjustedNewOffer)}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            disabled={busy}
            onClick={() =>
              onCounter(offer.driver_id, adjustedNewOffer, reducedPassengers)
            }
          >
            {busy ? 'Mengirim...' : 'Kirim tawaran baru'}
          </Button>

          <Button
            type="button"
            variant="dangerOutline"
            disabled={busy}
            onClick={() => onReject(offer)}
          >
            Tolak tawaran
          </Button>
        </>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#5B6678' }}>Tawaranmu</span>
            <span
              style={{
                fontWeight: 700,
                textDecoration: 'line-through',
                color: '#5B6678',
              }}
            >
              Rp {formatRibuan(baseCustomerOffer)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 700 }}>Tawaran driver</span>
            <span
              style={{
                fontWeight: 800,
                fontSize: '22px',
                color: '#0F766E',
                letterSpacing: '-.02em',
              }}
            >
              Rp {formatRibuan(offer.offered_price)}
            </span>
          </div>

          {showCounter && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                height: '44px',
                borderRadius: '12px',
                background: '#F5F6F8',
                padding: '0 12px',
              }}
            >
              <span style={{ fontWeight: 700, color: '#5B6678' }}>Rp</span>
              <input
                aria-label="Nominal tawar balik"
                inputMode="numeric"
                value={formatRibuan(counterDigits)}
                onChange={(e) => setCounterDigits(e.target.value.replace(/\D/g, ''))}
                style={{
                  flex: 1,
                  border: 0,
                  outline: 0,
                  background: 'transparent',
                  font: "800 16px 'Plus Jakarta Sans',system-ui,sans-serif",
                  color: '#0F172A',
                  minWidth: 0,
                }}
              />
            </div>
          )}

          <Button
            type="button"
            variant="primary"
            disabled={busy}
            onClick={() => onAccept(offer)}
          >
            {busy ? 'Memproses...' : `Setuju Rp ${formatRibuan(offer.offered_price)}`}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => (showCounter ? handleSendCounter() : setShowCounter(true))}
          >
            {showCounter ? 'Kirim tawaran' : 'Tawar balik'}
          </Button>

          <Button
            type="button"
            variant="dangerOutline"
            disabled={busy}
            onClick={() => onReject(offer)}
          >
            Tolak tawaran
          </Button>
        </>
      )}
    </Card>
  );
}

export default function CustomerTawaran() {
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(() => location.state?.order || null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyDriverId, setBusyDriverId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  const orderId = order?.id;

  const sync = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      const target = orderId
        ? list.find((item) => item.id === orderId)
        : list.find((item) => item.status === 'pending');

      if (!target) return;
      setOrder(target);

      if (['accepted', 'on_progress'].includes(target.status)) {
        navigate('/customer/lacak', { replace: true, state: { order: target } });
        return;
      }

      if (target.status !== 'pending') {
        navigate('/customer', { replace: true });
        return;
      }

      const offersRes = await api.get(`/orders/${target.id}/offers`);
      const all = Array.isArray(offersRes.data?.data) ? offersRes.data.data : [];

      // Ambil tawaran terbaru per driver yang masih pending
      const seen = new Set();
      const latestPending = [];
      for (const offer of all) {
        if (seen.has(offer.driver_id)) continue;
        seen.add(offer.driver_id);
        if (
          offer.status === 'pending' ||
          (offer.status === 'rejected' && offer.offered_by === 'customer')
        ) {
          latestPending.push(offer);
        }
      }
      setOffers(latestPending);
    } catch {
      // Pertahankan data terakhir saat gangguan jaringan sementara
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    sync();
    const interval = setInterval(sync, 5000);
    return () => clearInterval(interval);
  }, [sync]);

  const handleAccept = async (offer) => {
    if (!order?.id) return;
    setError('');
    setBusyDriverId(offer.driver_id);
    try {
      const res = await api.patch(`/orders/${order.id}/offers/${offer.id}/accept`);
      navigate('/customer/lacak', {
        replace: true,
        state: { order: res.data?.data },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyetujui tawaran.');
      await sync();
    } finally {
      setBusyDriverId(null);
    }
  };

  const handleCounter = async (driverId, price, passengers) => {
    if (!order?.id) return;
    setError('');
    setBusyDriverId(driverId);
    try {
      const payload = { driver_id: driverId, offered_price: price };
      if (passengers) payload.adjusted_passengers = passengers;
      await api.post(`/orders/${order.id}/offers`, payload);
      await sync();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim tawaran balik.');
    } finally {
      setBusyDriverId(null);
    }
  };

  const handleReject = async (offer) => {
    if (!order?.id) return;
    setError('');
    setBusyDriverId(offer.driver_id);
    try {
      await api.patch(`/orders/${order.id}/offers/${offer.id}/reject`);
      await sync();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menolak tawaran.');
    } finally {
      setBusyDriverId(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!order?.id) {
      navigate('/customer');
      return;
    }

    setError('');
    setCancelling(true);
    try {
      await api.patch(`/orders/${order.id}/status`, { status: 'cancelled' });
      navigate('/customer');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membatalkan pesanan.');
    } finally {
      setCancelling(false);
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
          gap: '8px',
          height: '52px',
          flex: 'none',
        }}
      >
        <Link
          to="/customer/mencari"
          state={order ? { order } : undefined}
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
        <div style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-.01em' }}>
          Tawaran driver
        </div>
      </div>

      {/* Konten */}
      <div
        style={{
          flex: 1,
          padding: '6px 20px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Ringkasan order */}
        {order && (
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
              <span style={{ fontWeight: 600 }}>{order.titik_jemput}</span>
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
              <span style={{ fontWeight: 600 }}>{order.titik_antar}</span>
            </div>
            <div style={{ height: '1px', background: '#EEF0F3' }} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: '#5B6678',
              }}
            >
              <span>
                {order.jenis_layanan === 'jastip'
                  ? 'JasTip'
                  : `${order.jumlah_penumpang || 1} penumpang`}
              </span>
              <span style={{ fontWeight: 800, color: '#0F172A' }}>
                Tawaranmu Rp {formatRibuan(order.ongkir)}
              </span>
            </div>
          </Card>
        )}

        {loading ? (
          <Card style={{ textAlign: 'center', color: '#5B6678' }}>
            Memuat tawaran...
          </Card>
        ) : offers.length === 0 ? (
          <Card
            style={{
              textAlign: 'center',
              padding: '24px 16px',
              color: '#5B6678',
            }}
          >
            <div style={{ fontWeight: 800, color: '#0F172A' }}>Belum ada tawaran</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Tawaran dari driver akan muncul di sini secara otomatis.
            </div>
          </Card>
        ) : (
          offers.map((offer) => (
            <OfferCard
              key={offer.id}
              order={order}
              offer={offer}
              busy={busyDriverId === offer.driver_id}
              onAccept={handleAccept}
              onCounter={handleCounter}
              onReject={handleReject}
              onError={setError}
            />
          ))
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

      {/* Tombol bawah */}
      <div style={{ padding: '12px 20px 20px', flex: 'none' }}>
        <Button
          type="button"
          variant="dangerOutline"
          disabled={cancelling}
          onClick={handleCancelOrder}
        >
          {cancelling ? 'Membatalkan...' : 'Batalkan pesanan'}
        </Button>
      </div>
    </div>
  );
}
