import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Button from '../../components/Button';
import {
  MOCK_DRIVER_OFFER,
  MOCK_OVER_CAPACITY_OFFER,
  EXTRA_PRICE_OPTIONS,
} from '../../mocks/CustomerMocks';

function formatRibuan(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('id-ID');
}

export default function CustomerTawaran({ forceOverCapacity = false }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(() => location.state?.order || null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  // TODO-BACKEND: State lokal simulasi nego/kapasitas sebelum endpoint /api/orders/:id/offers tersedia
  const [resolvedCapacity, setResolvedCapacity] = useState(false);
  const [targetPassengers, setTargetPassengers] = useState(null);
  const [selectedExtra, setSelectedExtra] = useState(5000);
  const [customOffer, setCustomOffer] = useState(null);
  const [showCounterInput, setShowCounterInput] = useState(false);
  const [counterDigits, setCounterDigits] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      try {
        const res = await api.get('/orders');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const target = order?.id
          ? list.find((item) => item.id === order.id)
          : list.find((item) => item.status === 'pending');

        if (isMounted && target) {
          setOrder(target);
        }
      } catch {
        // Pertahankan state order yang ada jika terjadi gangguan jaringan sementara
      }
    };

    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [order?.id]);

  // TODO-BACKEND: Ambil daftar tawaran aktif dari GET /api/orders/:id/offers
  const mockSource = forceOverCapacity
    ? MOCK_OVER_CAPACITY_OFFER
    : MOCK_DRIVER_OFFER;

  const isMotor = order?.jenis_kendaraan === 'motor';
  const vehicleLabel = isMotor ? 'Motor' : 'Mobil';
  const capacity =
    order?.driver?.kapasitas_penumpang ||
    mockSource.driver.kapasitas_penumpang ||
    (isMotor ? 1 : 4);

  const originalPassengers =
    order?.jumlah_penumpang ||
    (forceOverCapacity
      ? MOCK_OVER_CAPACITY_OFFER.jumlah_penumpang_contoh
      : 3);

  const activePassengers =
    targetPassengers !== null ? targetPassengers : originalPassengers;

  const isOverCapacity =
    !isMotor &&
    !resolvedCapacity &&
    (forceOverCapacity || activePassengers > capacity);

  const excessCount = Math.max(0, activePassengers - capacity);

  const driverName = order?.driver?.nama || mockSource.driver.nama;
  const driverInitial = (driverName.trim()[0] || 'D').toUpperCase();
  const platNomor = order?.driver?.plat_nomor || mockSource.driver.plat_nomor;

  const baseCustomerOffer = Number(order?.ongkir) || 15000;
  const currentCustomerOffer =
    customOffer !== null ? customOffer : baseCustomerOffer;

  // TODO-BACKEND: Nominal tawaran driver berasal dari tabel offers
  const driverOffer =
    customOffer !== null
      ? customOffer
      : isOverCapacity
      ? baseCustomerOffer
      : baseCustomerOffer + MOCK_DRIVER_OFFER.selisih_tawaran;

  const adjustedNewOffer = baseCustomerOffer + selectedExtra;

  const reducedPassengerDisplay =
    targetPassengers !== null
      ? targetPassengers
      : Math.min(originalPassengers, capacity);

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
        err.response?.data?.message || 'Gagal membatalkan pesanan.'
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleSendAdjustedOffer = () => {
    // TODO-BACKEND: Kirim penyesuaian penumpang & harga ekstra ke POST /api/orders/:id/offers
    setTargetPassengers(reducedPassengerDisplay);
    setCustomOffer(adjustedNewOffer);
    setResolvedCapacity(true);
  };

  const handleOpenCounterOffer = () => {
    if (!showCounterInput) {
      setCounterDigits(String(currentCustomerOffer));
      setShowCounterInput(true);
      return;
    }

    const parsed = Number(counterDigits);
    if (!parsed || parsed < 2000) {
      setError('Minimal tawaran harga adalah Rp 2.000.');
      return;
    }

    // TODO-BACKEND: Kirim counter-offer ke POST /api/orders/:id/offers
    setError('');
    setCustomOffer(parsed);
    setShowCounterInput(false);
  };

  const handleAcceptOffer = () => {
    // TODO-BACKEND: Setujui tawaran via PATCH /api/orders/:id/offers/:offerId/accept
    navigate('/customer/pesanan', {
      state: {
        order: order
          ? {
              ...order,
              ongkir: driverOffer,
              jumlah_penumpang: activePassengers,
            }
          : undefined,
      },
    });
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
        <div
          style={{
            fontWeight: 800,
            fontSize: '17px',
            letterSpacing: '-.01em',
          }}
        >
          Tawaran driver
        </div>
      </div>

      {/* Konten Utama */}
      <div
        style={{
          flex: 1,
          padding: '6px 20px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Kartu Profil Driver */}
        <Card style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '99px',
              background: '#0F766E',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '17px',
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
              {vehicleLabel} · {platNomor} · {mockSource.jarak_jemput}
            </div>
          </div>
          <Chip variant="teal">Online</Chip>
        </Card>

        {isOverCapacity ? (
          <>
            {/* Kartu Peringatan Kelebihan Penumpang */}
            <Card
              variant="danger"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
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
                  Kapasitas mobil
                </div>
                <Chip variant="danger">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 5v9M12 19h.01" />
                  </svg>
                  Kelebihan {excessCount} orang
                </Chip>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div
                  style={{
                    flex: 1,
                    background: '#fff',
                    borderRadius: '14px',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ color: '#5B6678', fontSize: '11px' }}>
                    Dapat ditampung
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '20px' }}>
                    {capacity}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    background: '#FDECEC',
                    borderRadius: '14px',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#991B1B' }}>
                    Penumpang
                  </div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '20px',
                      color: '#991B1B',
                    }}
                  >
                    {originalPassengers}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#7F1D1D' }}>
                Penumpang melebihi kapasitas, jadi driver tidak bisa langsung
                menerima. Kurangi penumpang atau tawarkan harga ekstra.
              </div>
            </Card>

            {/* Kartu Pilihan Penyesuaian */}
            <Card
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>
                  Pilih salah satu
                </div>
                <div
                  style={{
                    color: '#5B6678',
                    fontSize: '11px',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  Kurangi penumpang
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
                    onClick={() =>
                      setTargetPassengers(
                        Math.max(1, reducedPassengerDisplay - 1)
                      )
                    }
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      border: 0,
                      background: '#F5F6F8',
                      fontSize: '18px',
                      color: '#0F172A',
                      cursor: 'pointer',
                    }}
                  >
                    âˆ’
                  </button>
                  <span style={{ fontWeight: 800, fontSize: '15px' }}>
                    {originalPassengers} â†’ {reducedPassengerDisplay}
                  </span>
                  <button
                    type="button"
                    aria-label="Tambah"
                    onClick={() =>
                      setTargetPassengers(
                        Math.min(originalPassengers, reducedPassengerDisplay + 1)
                      )
                    }
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      border: 0,
                      background: '#F5F6F8',
                      fontSize: '18px',
                      color: '#0F172A',
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: '#5B6678',
                    fontSize: '11px',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  Atau tambah harga ekstra untuk driver
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
                          height: '44px',
                          borderRadius: '12px',
                          border: 0,
                          background: isSelected ? '#0F766E' : '#fff',
                          boxShadow: isSelected
                            ? 'none'
                            : 'inset 0 0 0 1.5px #D5DAE1',
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
              </div>

              <div style={{ height: '1px', background: '#EEF0F3' }} />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700 }}>Total tawaran baru</span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '20px',
                    color: '#0F766E',
                    letterSpacing: '-.02em',
                  }}
                >
                  Rp {formatRibuan(adjustedNewOffer)}
                </span>
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* Kartu Kapasitas Normal (Muat) */}
            <Card
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 800 }}>
                  Kapasitas {isMotor ? 'motor' : 'mobil'}
                </div>
                <Chip variant="success">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                  Muat
                </Chip>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div
                  style={{
                    flex: 1,
                    background: '#F5F6F8',
                    borderRadius: '14px',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ color: '#5B6678', fontSize: '11px' }}>
                    Dapat ditampung
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '20px' }}>
                    {capacity}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    background: '#DDF3E4',
                    borderRadius: '14px',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#14532D' }}>
                    Penumpang
                  </div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '20px',
                      color: '#14532D',
                    }}
                  >
                    {activePassengers}
                  </div>
                </div>
              </div>

              <div style={{ color: '#5B6678', fontSize: '12px' }}>
                Jumlah penumpang tidak melebihi kapasitas, jadi pesanan bisa
                langsung diterima.
              </div>
            </Card>

            {/* Kartu Rute & Perbandingan Harga */}
            <Card
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
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
                  {order?.titik_jemput || 'Lokasi saya saat ini'}
                </span>
              </div>

              <div
                style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
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
                  {order?.titik_antar || 'Tujuan'}
                </span>
              </div>

              <div style={{ height: '1px', background: '#EEF0F3' }} />

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
                  Rp {formatRibuan(currentCustomerOffer)}
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
                  Rp {formatRibuan(driverOffer)}
                </span>
              </div>

              {showCounterInput && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#F5F6F8',
                    padding: '0 12px',
                    marginTop: '2px',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#5B6678' }}>Rp</span>
                  <input
                    aria-label="Nominal tawar balik"
                    inputMode="numeric"
                    value={formatRibuan(counterDigits)}
                    onChange={(e) =>
                      setCounterDigits(e.target.value.replace(/\D/g, ''))
                    }
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
      <div
        style={{
          padding: '12px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          flex: 'none',
        }}
      >
        {isOverCapacity ? (
          <>
            <Button
              type="button"
              variant="primary"
              onClick={handleSendAdjustedOffer}
            >
              Kirim tawaran baru
            </Button>
            <Button
              type="button"
              variant="dangerOutline"
              disabled={cancelling}
              onClick={handleCancelOrder}
            >
              {cancelling ? 'Membatalkan...' : 'Batalkan pesanan'}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="primary"
              onClick={handleAcceptOffer}
            >
              Setuju Rp {formatRibuan(driverOffer)}
            </Button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenCounterOffer}
                style={{ flex: 1 }}
              >
                {showCounterInput ? 'Kirim tawaran' : 'Tawar balik'}
              </Button>
              <Button
                type="button"
                variant="dangerOutline"
                disabled={cancelling}
                onClick={handleCancelOrder}
                style={{ flex: 1 }}
              >
                {cancelling ? 'Membatalkan...' : 'Batalkan'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

