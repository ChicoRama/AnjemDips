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

export default function CustomerJastip() {
  const navigate = useNavigate();

  const [namaBarang, setNamaBarang] = useState('');
  const [titikJemput, setTitikJemput] = useState('');
  const [titikAntar, setTitikAntar] = useState('Lokasi saya saat ini');
  const [waktuBerangkat, setWaktuBerangkat] = useState('sekarang'); // 'sekarang' | 'jadwal'
  const [hargaBarangDigits, setHargaBarangDigits] = useState('30000');
  const [ongkirDigits, setOngkirDigits] = useState('8000');
  const [catatan, setCatatan] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const numericHargaBarang = Number(hargaBarangDigits) || 0;
  const numericOngkir = Number(ongkirDigits) || 0;
  const perkiraanTotal = numericHargaBarang + numericOngkir;

  const handleHargaBarangChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setHargaBarangDigits(raw);
    if (error) setError('');
  };

  const handleOngkirChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setOngkirDigits(raw);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanBarang = namaBarang.trim();
    const cleanBeli = titikJemput.trim();
    const cleanAntar = titikAntar.trim();

    if (!cleanBarang || !cleanBeli || !cleanAntar) {
      setError('Barang yang dititip, lokasi beli/ambil, dan tujuan wajib diisi.');
      return;
    }

    if (!numericOngkir || numericOngkir < 2000) {
      setError('Minimal tawaran upah driver adalah Rp 2.000.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        jenis_layanan: 'jastip',
        nama_barang: cleanBarang,
        titik_jemput: cleanBeli,
        titik_antar: cleanAntar,
        waktu_berangkat: waktuBerangkat,
        jadwal_at:
          waktuBerangkat === 'jadwal' ? new Date().toISOString() : null,
        perkiraan_harga_barang: numericHargaBarang,
        ongkir: numericOngkir,
        catatan: catatan.trim(),
      };

      const res = await api.post('/orders', payload);
      navigate('/customer/mencari', {
        state: { order: res.data?.data },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal membuat pesanan JasTip. Coba lagi.'
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
          Titip barang (JasTip)
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
        {/* Kartu Detail Titipan & Lokasi */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <Input
            label="Barang yang dititip"
            placeholder="Contoh: 2 porsi nasi goreng, tanpa pedas"
            value={namaBarang}
            onChange={(e) => {
              setNamaBarang(e.target.value);
              if (error) setError('');
            }}
          />

          <Input
            label="Beli / ambil di"
            placeholder="Nama tempat atau alamat"
            value={titikJemput}
            onChange={(e) => {
              setTitikJemput(e.target.value);
              if (error) setError('');
            }}
          />

          <Input
            label="Antar ke"
            value={titikAntar}
            onChange={(e) => {
              setTitikAntar(e.target.value);
              if (error) setError('');
            }}
          />

          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#475569',
                marginBottom: '6px',
              }}
            >
              Waktu
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
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  background:
                    waktuBerangkat === 'sekarang' ? '#fff' : 'transparent',
                  color: waktuBerangkat === 'sekarang' ? '#8A4B04' : '#5B6678',
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
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  background:
                    waktuBerangkat === 'jadwal' ? '#fff' : 'transparent',
                  color: waktuBerangkat === 'jadwal' ? '#8A4B04' : '#5B6678',
                  boxShadow:
                    waktuBerangkat === 'jadwal'
                      ? '0 1px 3px rgba(15,23,42,.12)'
                      : 'none',
                }}
              >
                Jadwalkan
              </div>
            </div>
          </div>
        </Card>

        {/* Kartu Harga Barang & Upah Driver */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '6px',
                }}
              >
                Perkiraan harga barang
              </div>
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
                <span style={{ color: '#5B6678', fontWeight: 700 }}>Rp</span>
                <input
                  aria-label="Perkiraan harga barang"
                  value={formatRibuan(hargaBarangDigits)}
                  onChange={handleHargaBarangChange}
                  inputMode="numeric"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 0,
                    outline: 0,
                    background: 'transparent',
                    font: "800 15px 'Plus Jakarta Sans',system-ui,sans-serif",
                    color: '#0F172A',
                  }}
                />
              </div>
            </label>

            <label style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '6px',
                }}
              >
                Upah driver (tawaran)
              </div>
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
                <span style={{ color: '#5B6678', fontWeight: 700 }}>Rp</span>
                <input
                  aria-label="Upah driver (tawaran)"
                  value={formatRibuan(ongkirDigits)}
                  onChange={handleOngkirChange}
                  inputMode="numeric"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 0,
                    outline: 0,
                    background: 'transparent',
                    font: "800 15px 'Plus Jakarta Sans',system-ui,sans-serif",
                    color: '#0F172A',
                  }}
                />
              </div>
            </label>
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
              Perkiraan total
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: '15px',
                color: '#4A2C03',
              }}
            >
              Rp {formatRibuan(String(perkiraanTotal))}
            </span>
          </div>

          <div style={{ color: '#5B6678', fontSize: '11.5px' }}>
            Driver bisa menerima upahmu atau menawar balik sebelum membeli.
          </div>
        </Card>

        {/* Kartu Catatan */}
        <Card style={{ display: 'block' }}>
          <Input
            label="Catatan untuk driver (opsional)"
            placeholder="Misal: tunggu di depan gerbang"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
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
      <div style={{ padding: '12px 20px 20px', flex: 'none' }}>
        <Button type="submit" variant="amber" disabled={submitting}>
          {submitting ? 'Mencari driver...' : 'Cari driver'}
        </Button>
      </div>
    </form>
  );
}

