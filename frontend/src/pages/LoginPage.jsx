import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Info } from 'lucide-react';

export default function LoginPage() {
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleNimChange = (e) => {
    const numericOnly = e.target.value.replace(/\D/g, '');
    setNim(numericOnly);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanNim = nim.trim();
    if (!cleanNim || !password) {
      setError('NIM dan kata sandi wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      // Mapping internal NIM ke format email backend tanpa ditampilkan ke user
      const internalEmail = `${cleanNim}@anjemdips.local`;
      const loggedInUser = await login(internalEmail, password);
      navigate(loggedInUser.role === 'driver' ? '/driver' : '/customer');
    } catch (err) {
      setError(
        err.response?.data?.message || 'NIM atau kata sandi tidak sesuai.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pwa-shell flex flex-col bg-[#0B4F4A] font-sans">
      {/* Header Atas (270px) */}
      <header className="relative h-[270px] w-full shrink-0 overflow-hidden bg-[#0B4F4A]">
        {/* SVG Dekoratif Rute */}
        <svg
          viewBox="0 0 390 270"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {/* Path 1: stroke #14857C tebal 14 */}
          <path
            d="M -20 148 C 68 148, 92 64, 188 64 C 284 64, 306 138, 412 122"
            stroke="#14857C"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Path 2: stroke #14857C tebal 8 */}
          <path
            d="M 48 -14 C 66 56, 128 96, 148 168 C 160 212, 134 246, 114 282"
            stroke="#14857C"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Path 3: stroke #14857C tebal 8 */}
          <path
            d="M 252 -12 C 234 48, 266 106, 336 126 C 366 135, 386 154, 405 178"
            stroke="#14857C"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Path 4: putus-putus #0B4F4A di atas jalur rute utama */}
          <path
            d="M -20 148 C 68 148, 92 64, 188 64 C 284 64, 306 138, 412 122"
            stroke="#0B4F4A"
            strokeWidth="2.5"
            strokeDasharray="7 7"
            strokeLinecap="round"
          />

          {/* Titik 1: Kuning #FBBF24 dengan titik tengah #0B4F4A */}
          <circle cx="112" cy="96" r="9" fill="#FBBF24" />
          <circle cx="112" cy="96" r="3.5" fill="#0B4F4A" />

          {/* Titik 2: Putih #FFFFFF dengan titik tengah #0B4F4A */}
          <circle cx="284" cy="92" r="9" fill="#FFFFFF" />
          <circle cx="284" cy="92" r="3.5" fill="#0B4F4A" />
        </svg>

        {/* Kiri Bawah Header: Logo Box + Brand Title */}
        <div className="absolute bottom-6 left-6 right-6 z-10 flex items-center gap-3">
          <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px] bg-white">
            <MapPin className="h-[22px] w-[22px] text-[#0F766E]" strokeWidth={2.25} />
          </div>

          <div className="min-w-0">
            <div className="text-[19px] font-extrabold leading-[1.2] tracking-[-0.02em] text-white">
              AnjemDips
            </div>
            <p className="mt-0.5 text-[12px] font-medium leading-[1.35] text-[#B7E3DE]">
              Antar-jemput &amp; titip khusus mahasiswa
            </p>
          </div>
        </div>
      </header>

      {/* Sheet Putih Bawah */}
      <main className="flex flex-1 flex-col gap-[16px] rounded-t-[28px] bg-white px-[24px] pt-[28px] pb-[24px]">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#0F172A]">
            Masuk
          </h1>
          <p className="mt-1 text-[13px] leading-[1.4] text-[#5B6678]">
            Pakai NIM dan kata sandi akunmu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]" noValidate>
          <div>
            <label htmlFor="nim" className="input-label">
              NIM
            </label>
            <input
              id="nim"
              name="nim"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              placeholder="Contoh: 24060122140000"
              value={nim}
              onChange={handleNimChange}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="password" className="input-label">
              Kata sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              className="input-field"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-[12px] bg-[#FEF2F2] px-3 py-2 text-[12px] font-medium text-[#B91C1C]"
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-[13px] leading-[1.4] text-[#5B6678]">
          Belum punya akun?{' '}
          <Link
            to="/register"
            className="font-bold text-[#0F766E] no-underline hover:no-underline"
          >
            Daftar
          </Link>
        </p>

        {/* Info Box Paling Bawah */}
        <div className="mt-auto flex items-start gap-2.5 rounded-[14px] bg-[#F0F7F6] p-3.5">
          <Info
            className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#0F766E]"
            strokeWidth={2.1}
          />
          <p className="text-[12px] leading-[1.4] text-[#475569]">
            Peran (Pemesan atau Driver) dipilih saat mendaftar dan tidak bisa diubah setelahnya.
          </p>
        </div>
      </main>
    </div>
  );
}

