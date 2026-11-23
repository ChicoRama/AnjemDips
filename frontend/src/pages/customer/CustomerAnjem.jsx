import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';

function formatRibuan(digits) {
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}

const MAX_PENUMPANG = { motor: 1, mobil: 8 };

export default function CustomerAnjem() {
  const navigate = useNavigate();

  const [titikJemput, setTitikJemput] = useState('');
  const [titikAntar, setTitikAntar] = useState('');
  const [jenisKendaraan, setJenisKendaraan] = useState('mobil'); // 'motor' | 'mobil'
  const [waktuBerangkat, setWaktuBerangkat] = useState('sekarang'); // 'sekarang' | 'jadwal'
  const [jadwalAt, setJadwalAt] = useState('');
  const [jumlahPenumpang, setJumlahPenumpang] = useState(3);
  const [ongkirDigits, setOngkirDigits] = useState('15000');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const maxPenumpang = MAX_PENUMPANG[jenisKendaraan];

  const handleSelectKendaraan = (vehicle) => {
    setJenisKendaraan(vehicle);
    if (vehicle === 'motor' && jumlahPenumpang > 1) {
      setJumlahPenumpang(1);
    } else if (vehicle === 'mobil' && jumlahPenumpang === 1) {
      setJumlahPenumpang(3);
    }
  };

  const handleOngkirChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setOngkirDigits(raw);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanJemput = titikJemput.trim();
    const cleanAntar = titikAntar.trim();
    const numericOngkir = Number(ongkirDigits);

    if (!cleanJemput || !cleanAntar) {
      setError('Titik jemput dan tujuan wajib diisi.');
      return;
    }

    if (!numericOngkir || numericOngkir < 2000) {
      setError('Minimal tawaran harga adalah Rp 2.000.');
      return;
    }

    let jadwalIso = null;
    if (waktuBerangkat === 'jadwal') {
      const picked = new Date(jadwalAt);
      if (
        !jadwalAt ||
        Number.isNaN(picked.getTime()) ||
        picked.getTime() < Date.now()
      ) {
        setError(
          'Pilih tanggal dan jam berangkat yang valid (tidak di masa lalu).'
        );
        return;
      }
      jadwalIso = picked.toISOString();
    }

    setSubmitting(true);
    try {
      const payload = {
        jenis_layanan: 'anjem',
        titik_jemput: cleanJemput,
        titik_antar: cleanAntar,
        ongkir: numericOngkir,
        jenis_kendaraan: jenisKendaraan,
        jumlah_penumpang: jumlahPenumpang,
        waktu_berangkat: waktuBerangkat,
        jadwal_at: jadwalIso,
      };

      const res = await api.post('/orders', payload);
      navigate('/customer/mencari', {
        state: { order: res.data?.data },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal membuat pesanan. Coba lagi.'
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
          to="/customer"
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
          Pesan AnJem
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
          overflow: 'hidden',
        }}
      >
        {/* Kartu Titik Jemput & Tujuan + Peta */}
        <Card
          style={{
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                flex: 'none',
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '99px',
                  background: '#0F766E',
                }}
              />
              <span
                style={{
                  width: '2px',
                  height: '22px',
                  background: '#D5DAE1',
                }}
              />
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '3px',
                  background: '#F59E0B',
                }}
              />
            </div>

            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <Input
                label="Titik jemput"
                hideLabel
                aria-label="Titik jemput"
                placeholder="Jemput di mana? (contoh: Kos Sirojudin)"
                value={titikJemput}
                onChange={(e) => {
                  setTitikJemput(e.target.value);
                  if (error) setError('');
                }}
              />
              <Input
                label="Tujuan"
                hideLabel
                aria-label="Tujuan"
                placeholder="Mau ke mana?"
                value={titikAntar}
                onChange={(e) => {
                  setTitikAntar(e.target.value);
                  if (error) setError('');
                }}
              />
            </div>
          </div>

          <div
            style={{
              height: '92px',
              borderRadius: '12px',
              background: '#E9EEF0',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <svg
              width="100%"
              height="92"
              viewBox="0 0 330 92"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M-5 70 C60 60 90 20 160 44 S280 80 340 20"
                stroke="#fff"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path d="M110 -5 L150 100" stroke="#fff" strokeWidth="6" />
              <path
                d="M-5 70 C60 60 90 20 160 44 S280 80 340 20"
                stroke="#0F766E"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="1 7"
              />
              <circle cx="52" cy="62" r="7" fill="#0F766E" />
              <circle cx="268" cy="62" r="7" fill="#F59E0B" />
            </svg>
          </div>
        </Card>

        {/* Kartu Kendaraan, Berangkat & Penumpang */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#475569',
                marginBottom: '6px',
              }}
            >
              Jenis kendaraan
            </div>
            <div
              style={{
                display: 'flex',
                background: '#F1F3F6',
                borderRadius: '12px',
                padding: '3px',
                gap: '3px',
              }}
            >
              <div
                role="button"
                tabIndex={0}
                aria-pressed={jenisKendaraan === 'motor'}
                onClick={() => handleSelectKendaraan('motor')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectKendaraan('motor');
                  }
                }}
                style={{
                  flex: 1,
                  height: '38px',
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  background:
                    jenisKendaraan === 'motor' ? '#fff' : 'transparent',
                  color: jenisKendaraan === 'motor' ? '#0F766E' : '#5B6678',
                  boxShadow:
                    jenisKendaraan === 'motor'
                      ? '0 1px 3px rgba(15,23,42,.12)'
                      : 'none',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="6" cy="16" r="3" />
                  <circle cx="18" cy="16" r="3" />
                  <path d="M6 16l4-7h5l3 7M9 9H7" />
                </svg>
                Motor
              </div>

              <div
                role="button"
                tabIndex={0}
                aria-pressed={jenisKendaraan === 'mobil'}
                onClick={() => handleSelectKendaraan('mobil')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectKendaraan('mobil');
                  }
                }}
                style={{
                  flex: 1,
                  height: '38px',
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  background:
                    jenisKendaraan === 'mobil' ? '#fff' : 'transparent',
                  color: jenisKendaraan === 'mobil' ? '#0F766E' : '#5B6678',
                  boxShadow:
                    jenisKendaraan === 'mobil'
                      ? '0 1px 3px rgba(15,23,42,.12)'
                      : 'none',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 16v-4l2-5h12l2 5v4zM4 16v3M20 16v3" />
                </svg>
                Mobil
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '6px',
                }}
              >
                Berangkat
              </div>
              <div
                style={{
                  display: 'flex',
                  background: '#F1F3F6',
                  borderRadius: '12px',
                  padding: '3px',
                  gap: '3px',
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={waktuBerangkat === 'sekarang'}
                  onClick={() => setWaktuBerangkat('sekarang')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setWaktuBerangkat('sekarang');
                    }
                  }}
                  style={{
                    flex: 1,
                    height: '38px',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    background:
                      waktuBerangkat === 'sekarang' ? '#fff' : 'transparent',
                    color:
                      waktuBerangkat === 'sekarang' ? '#0F766E' : '#5B6678',
                    boxShadow:
                      waktuBerangkat === 'sekarang'
                        ? '0 1px 3px rgba(15,23,42,.12)'
                        : 'none',
                  }}
                >
                  Sekarang
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={waktuBerangkat === 'jadwal'}
                  onClick={() => setWaktuBerangkat('jadwal')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setWaktuBerangkat('jadwal');
                    }
                  }}
                  style={{
                    flex: 1,
                    height: '38px',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    background:
                      waktuBerangkat === 'jadwal' ? '#fff' : 'transparent',
                    color: waktuBerangkat === 'jadwal' ? '#0F766E' : '#5B6678',
                    boxShadow:
                      waktuBerangkat === 'jadwal'
                        ? '0 1px 3px rgba(15,23,42,.12)'
                        : 'none',
                  }}
                >
                  Jadwal
                </div>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '6px',
                }}
              >
                Jumlah penumpang
              </div>
              <div
                style={{
                  height: '44px',
                  borderRadius: '12px',
                  background: '#F5F6F8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 5px',
                }}
              >
                <button
                  type="button"
                  aria-label="Kurangi"
                  disabled={jumlahPenumpang <= 1}
                  onClick={() =>
                    setJumlahPenumpang((prev) => Math.max(1, prev - 1))
                  }
                  style={{
                    opacity: jumlahPenumpang <= 1 ? 0.4 : 1,
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    border: 0,
                    background: '#fff',
                    fontSize: '18px',
                    color: '#0F172A',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(15,23,42,.1)',
                  }}
                >
                  -
                </button>
                <span style={{ fontWeight: 800, fontSize: '15px' }}>
                  {jumlahPenumpang}
                </span>
                <button
                  type="button"
                  aria-label="Tambah"
                  disabled={jumlahPenumpang >= maxPenumpang}
                  onClick={() =>
                    setJumlahPenumpang((prev) => Math.min(maxPenumpang, prev + 1))
                  }
                  style={{
                    opacity: jumlahPenumpang >= maxPenumpang ? 0.4 : 1,
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    border: 0,
                    background: '#fff',
                    fontSize: '18px',
                    color: '#0F172A',
                    cursor: jumlahPenumpang >= maxPenumpang ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 2px rgba(15,23,42,.1)',
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {waktuBerangkat === 'jadwal' && (
            <Input
              label="Tanggal & jam berangkat"
              type="datetime-local"
              value={jadwalAt}
              onChange={(e) => {
                setJadwalAt(e.target.value);
                if (error) setError('');
              }}
            />
          )}

          <div
            style={{
              color: '#5B6678',
              fontSize: '11.5px',
              marginTop: '-4px',
            }}
          >
            Pilih “Jadwal” untuk berangkat di waktu mendatang, lalu tentukan
            tanggal dan jamnya.
          </div>
        </Card>

        {/* Kartu Harga Tawaran */}
        <Card>
          <label style={{ display: 'block' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#475569',
                marginBottom: '6px',
              }}
            >
              Harga yang kamu tawarkan
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
                aria-label="Tawaran harga"
                value={formatRibuan(ongkirDigits)}
                onChange={handleOngkirChange}
                inputMode="numeric"
                style={{
                  flex: 1,
                  border: 0,
                  outline: 0,
                  background: 'transparent',
                  font: "800 20px 'Plus Jakarta Sans',system-ui,sans-serif",
                  color: '#0F172A',
                  minWidth: 0,
                }}
              />
            </div>
          </label>
          <div
            style={{
              color: '#5B6678',
              fontSize: '11.5px',
              marginTop: '8px',
            }}
          >
            Driver bisa langsung menerima, atau menawar balik.
          </div>
        </Card>

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
          flex: 'none',
          background: '#F5F6F8',
        }}
      >
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Mencari driver...' : 'Cari driver'}
        </Button>
      </div>
    </form>
  );
}
