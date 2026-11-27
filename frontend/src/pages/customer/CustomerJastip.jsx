import { useEffect, useMemo, useState } from 'react';
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
  const [spotOptions, setSpotOptions] = useState([]);
  const [spotDropdownOpen, setSpotDropdownOpen] = useState(false);
  const [spotsLoading, setSpotsLoading] = useState(false);
  const [titikAntar, setTitikAntar] = useState('');
  const [waktuBerangkat, setWaktuBerangkat] = useState('sekarang'); // 'sekarang' | 'jadwal'
  const [jadwalAt, setJadwalAt] = useState('');
  const [hargaBarangDigits, setHargaBarangDigits] = useState('30000');
  const [ongkirDigits, setOngkirDigits] = useState('8000');
  const [catatan, setCatatan] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Gunakan daftar spot yang sama dengan form AnJem.
  // Customer tetap dapat mengetik lokasi bebas jika spot tidak tersedia.
  useEffect(() => {
    let active = true;

    const loadSpots = async () => {
      setSpotsLoading(true);
      try {
        const response = await api.get('/spots');
        const rows = Array.isArray(response.data?.data) ? response.data.data : [];
        const normalized = rows
          .map((spot) => ({
            id: spot.id ?? spot.nama_lokasi,
            name: String(spot.nama_lokasi || '').trim(),
            category: String(spot.kategori || '').trim(),
            address: String(spot.alamat || '').trim(),
          }))
          .filter((spot) => spot.name);

        if (active) setSpotOptions(normalized);
      } catch (loadError) {
        if (active) setSpotOptions([]);
      } finally {
        if (active) setSpotsLoading(false);
      }
    };

    loadSpots();
    return () => {
      active = false;
    };
  }, []);

  const filteredSpotOptions = useMemo(() => {
    const query = titikJemput.trim().toLocaleLowerCase('id-ID');
    if (!query) return spotOptions;
    return spotOptions.filter((spot) =>
      `${spot.name} ${spot.category} ${spot.address}`
        .toLocaleLowerCase('id-ID')
        .includes(query)
    );
  }, [spotOptions, titikJemput]);

  const selectSpot = (spot) => {
    setTitikJemput(spot.name);
    setSpotDropdownOpen(false);
    if (error) setError('');
  };

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

    let jadwalIso = null;
    if (waktuBerangkat === 'jadwal') {
      const picked = new Date(jadwalAt);
      if (
        !jadwalAt ||
        Number.isNaN(picked.getTime()) ||
        picked.getTime() < Date.now()
      ) {
        setError(
          'Pilih tanggal dan jam yang valid (tidak di masa lalu).'
        );
        return;
      }
      jadwalIso = picked.toISOString();
    }

    setSubmitting(true);
    try {
      const payload = {
        jenis_layanan: 'jastip',
        nama_barang: cleanBarang,
        titik_jemput: cleanBeli,
        titik_antar: cleanAntar,
        waktu_berangkat: waktuBerangkat,
        jadwal_at: jadwalIso,
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

          <div style={{ position: 'relative', width: '100%' }}>
            <Input
              label="Beli / ambil di"
              placeholder="Pilih spot atau ketik lokasi manual"
              value={titikJemput}
              autoComplete="off"
              role="combobox"
              aria-label="Beli / ambil di"
              aria-autocomplete="list"
              aria-expanded={spotDropdownOpen}
              aria-controls="spot-jastip-options"
              onFocus={() => setSpotDropdownOpen(true)}
              onClick={() => setSpotDropdownOpen(true)}
              onChange={(e) => {
                setTitikJemput(e.target.value);
                setSpotDropdownOpen(true);
                if (error) setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSpotDropdownOpen(false);
                if (e.key === 'Enter' && spotDropdownOpen && filteredSpotOptions.length) {
                  e.preventDefault();
                  selectSpot(filteredSpotOptions[0]);
                }
              }}
            />
            {spotDropdownOpen && (
              <div
                id="spot-jastip-options"
                role="listbox"
                aria-label="Daftar spot lokasi beli atau ambil"
                style={{
                  position: 'absolute',
                  zIndex: 30,
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  maxHeight: '190px',
                  overflowY: 'auto',
                  background: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(15,23,42,.14)',
                }}
              >
                {spotsLoading ? (
                  <div style={{ padding: '11px 12px', color: '#64748B', fontSize: '12px' }}>
                    Memuat daftar spot...
                  </div>
                ) : filteredSpotOptions.length ? (
                  filteredSpotOptions.map((spot) => (
                    <button
                      key={String(spot.id)}
                      type="button"
                      role="option"
                      aria-selected={titikJemput === spot.name}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSpot(spot)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 12px',
                        border: 0,
                        borderBottom: '1px solid #F1F5F9',
                        background: titikJemput === spot.name ? '#F0FDFA' : '#fff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: '#0F172A',
                      }}
                    >
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 700 }}>
                        {spot.name}
                      </span>
                      {(spot.category || spot.address) && (
                        <span style={{ display: 'block', marginTop: '2px', color: '#64748B', fontSize: '10px' }}>
                          {[spot.category, spot.address].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div style={{ padding: '11px 12px', color: '#64748B', fontSize: '12px' }}>
                    {spotOptions.length
                      ? 'Spot tidak ditemukan. Lokasi yang kamu ketik tetap bisa digunakan.'
                      : 'Daftar spot belum tersedia. Silakan ketik lokasi secara manual.'}
                  </div>
                )}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setSpotDropdownOpen(false)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: 0,
                    background: '#F8FAFC',
                    color: '#0F766E',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Gunakan lokasi yang diketik
                </button>
              </div>
            )}
          </div>

          <Input
            label="Antar ke"
            placeholder="Antar ke mana? (contoh: Gedung Teknik Komputer)"
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

          {waktuBerangkat === 'jadwal' && (
            <Input
              label="Tanggal & jam"
              type="datetime-local"
              value={jadwalAt}
              onChange={(e) => {
                setJadwalAt(e.target.value);
                if (error) setError('');
              }}
            />
          )}
        </Card>

        {/* Kartu Harga Barang & Upah Driver */}
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
              flexWrap: 'wrap',
              gap: '12px',
              width: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
            <label style={{ flex: '1 1 180px', minWidth: 0, maxWidth: '100%' }}>
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
                  width: '100%',
                  minWidth: 0,
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ color: '#5B6678', fontWeight: 700, flex: 'none' }}>Rp</span>
                <input
                  aria-label="Perkiraan harga barang"
                  value={formatRibuan(hargaBarangDigits)}
                  onChange={handleHargaBarangChange}
                  inputMode="numeric"
                  style={{
                    flex: '1 1 0%',
                    width: '100%',
                    minWidth: 0,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    border: 0,
                    outline: 0,
                    background: 'transparent',
                    font: "800 15px 'Plus Jakarta Sans',system-ui,sans-serif",
                    color: '#0F172A',
                  }}
                />
              </div>
            </label>

            <label style={{ flex: '1 1 180px', minWidth: 0, maxWidth: '100%' }}>
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
                  width: '100%',
                  minWidth: 0,
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ color: '#5B6678', fontWeight: 700, flex: 'none' }}>Rp</span>
                <input
                  aria-label="Upah driver (tawaran)"
                  value={formatRibuan(ongkirDigits)}
                  onChange={handleOngkirChange}
                  inputMode="numeric"
                  style={{
                    flex: '1 1 0%',
                    width: '100%',
                    minWidth: 0,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
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