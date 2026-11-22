import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import api from '../../api/axios';
import { DRIVER_NEGO_INCREMENTS } from '../../mocks/driverMocks';

function formatRibuan(digitsOrNum) {
  const clean = String(digitsOrNum || '').replace(/\D/g, '');
  if (!clean) return '';
  return Number(clean).toLocaleString('id-ID');
}

export default function DriverNego() {
  const location = useLocation();
  const navigate = useNavigate();

  const order = location.state?.order || null;
  const baseOffer = Number(order?.ongkir) || 15000;

  const [offerDigits, setOfferDigits] = useState(String(baseOffer + 3000));
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState('');

  const numericOffer = Number(offerDigits) || 0;
  const backUrl = order?.id ? `/driver/request/${order.id}` : '/driver';

  const handleAddIncrement = (inc) => {
    const next = (Number(offerDigits) || baseOffer) + inc;
    setOfferDigits(String(next));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!numericOffer || numericOffer < 2000) {
      setError('Minimal penawaran harga adalah Rp 2.000.');
      return;
    }

    if (!order?.id) {
      setError('Data pesanan tidak ditemukan. Kembali ke daftar request.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/orders/${order.id}/offers`, {
        offered_price: numericOffer,
        note: note.trim(),
      });
      setSentSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal mengirim tawaran harga.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
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
          to={backUrl}
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
          Tawar harga
        </div>
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
        {/* Kartu Ringkasan Request */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 800 }}>
              {order?.customer?.nama || 'Pemesan'}
            </span>
            <span style={{ color: '#5B6678', fontSize: '12px' }}>
              Tawaran awal: <strong>Rp {formatRibuan(baseOffer)}</strong>
            </span>
          </div>

          <div style={{ color: '#475569', fontSize: '12.5px' }}>
            {order?.titik_jemput || 'Titik jemput'} â†’{' '}
            {order?.titik_antar || 'Titik antar'}
          </div>
        </Card>

        {/* Kartu Input Penawaran Driver */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <label style={{ display: 'block' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#475569',
                marginBottom: '6px',
              }}
            >
              Harga yang kamu ajukan
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                height: '52px',
                borderRadius: '12px',
                background: '#F5F6F8',
                padding: '0 14px',
              }}
            >
              <span style={{ fontWeight: 700, color: '#5B6678' }}>Rp</span>
              <input
                aria-label="Penawaran harga driver"
                inputMode="numeric"
                value={formatRibuan(offerDigits)}
                onChange={(e) => {
                  setOfferDigits(e.target.value.replace(/\D/g, ''));
                  if (error) setError('');
                }}
                style={{
                  flex: 1,
                  border: 0,
                  outline: 0,
                  background: 'transparent',
                  font: "800 20px 'Plus Jakarta Sans',system-ui,sans-serif",
                  color: '#0F766E',
                  minWidth: 0,
                }}
              />
            </div>
          </label>

          {/* Preset Kenaikan Cepat */}
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#5B6678',
                marginBottom: '6px',
              }}
            >
              Tambah cepat dari tawaran pemesan
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {DRIVER_NEGO_INCREMENTS.map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleAddIncrement(inc)}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '11px',
                    border: 0,
                    background: '#fff',
                    boxShadow: 'inset 0 0 0 1.5px #D5DAE1',
                    font: "700 12px 'Plus Jakarta Sans',system-ui,sans-serif",
                    color: '#0F172A',
                    cursor: 'pointer',
                  }}
                >
                  + Rp {formatRibuan(inc)}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Alasan / catatan untuk pemesan (opsional)"
            placeholder="Misal: Jarak agak jauh atau hujan"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Card>

        {/* Info Nego */}
        <Card
          variant="soft"
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0F766E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flex: 'none', marginTop: '1px' }}
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8h.01M11 12h1v5h1" />
          </svg>
          <div style={{ fontSize: '12px', color: '#0B4F4A' }}>
            Pemesan akan menerima penawaranmu dan dapat langsung menyetujui
            atau mengajukan harga balik.
          </div>
        </Card>

        {sentSuccess && (
          <Card
            style={{
              background: '#DDF3E4',
              color: '#14532D',
              fontWeight: 700,
              fontSize: '12.5px',
            }}
          >
            Penawaran Rp {formatRibuan(numericOffer)} berhasil dikirim ke
            pemesan! Menunggu konfirmasi pemesan.
          </Card>
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

      {/* Tombol Bawah */}
      <div
        style={{
          padding: '12px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          flex: 'none',
        }}
      >
        {sentSuccess ? (
          <Button
            type="button"
            variant="primary"
            onClick={() => navigate('/driver')}
          >
            Kembali ke beranda
          </Button>
        ) : (
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting
              ? 'Mengirim tawaran...'
              : `Kirim tawaran Rp ${formatRibuan(numericOffer)}`}
          </Button>
        )}
      </div>
    </form>
  );
}

