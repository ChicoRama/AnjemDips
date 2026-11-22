import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Bike } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nama: '',
    nim: '',
    no_wa: '',
    password: '',
    role: 'customer',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === 'nim' || name === 'no_wa') {
      nextValue = value.replace(/\D/g, '');
    }

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    if (error) setError('');
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanNama = formData.nama.trim();
    const cleanNim = formData.nim.trim();
    const cleanWa = formData.no_wa.trim();

    if (!cleanNama || !cleanNim || !cleanWa || !formData.password) {
      setError('Semua kolom wajib diisi.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      // Mapping internal NIM ke format email backend agar sinkron dengan LoginPage
      const payload = {
        nama: cleanNama,
        nim: cleanNim,
        email: `${cleanNim}@anjemdips.local`,
        no_wa: cleanWa,
        password: formData.password,
        role: formData.role,
      };

      const newUser = await register(payload);
      navigate(newUser.role === 'driver' ? '/driver' : '/customer');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Pendaftaran gagal. Periksa kembali datamu.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pwa-shell flex flex-col bg-[#0B4F4A] font-sans">
      {/* Header Kompak Atas */}
      <header className="relative flex h-[108px] w-full shrink-0 items-center justify-between overflow-hidden bg-[#0B4F4A] px-6">
        <svg
          viewBox="0 0 390 108"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path
            d="M 190 -18 C 228 36, 294 58, 408 42"
            stroke="#14857C"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 190 -18 C 228 36, 294 58, 408 42"
            stroke="#0B4F4A"
            strokeWidth="2.5"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
          <circle cx="312" cy="48" r="7.5" fill="#FBBF24" />
          <circle cx="312" cy="48" r="3" fill="#0B4F4A" />
        </svg>

        <div className="relative z-10 flex items-center gap-3">
          <Link
            to="/login"
            aria-label="Kembali ke halaman masuk"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-white/12 text-white transition hover:bg-white/20"
          >
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </Link>
          <div>
            <div className="text-[16px] font-extrabold leading-[1.2] tracking-[-0.02em] text-white">
              AnjemDips
            </div>
            <p className="text-[11px] font-medium text-[#B7E3DE]">
              Pendaftaran akun baru
            </p>
          </div>
        </div>
      </header>

      {/* Sheet Putih Bawah */}
      <main className="flex flex-1 flex-col gap-[16px] rounded-t-[28px] bg-white px-[24px] pt-[24px] pb-[24px]">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#0F172A]">
            Daftar
          </h1>
          <p className="mt-1 text-[13px] leading-[1.4] text-[#5B6678]">
            Pilih peran dan lengkapi data mahasiswamu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]" noValidate>
          {/* Pemilih Peran: Pemesan / Driver */}
          <div>
            <span className="input-label">Daftar sebagai</span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                aria-pressed={formData.role === 'customer'}
                onClick={() => handleRoleSelect('customer')}
                className={`flex flex-col items-start rounded-[14px] p-3 text-left transition cursor-pointer ${
                  formData.role === 'customer'
                    ? 'bg-[#E6F4F2] shadow-[inset_0_0_0_1.5px_#0F766E]'
                    : 'bg-white shadow-[inset_0_0_0_1.5px_#E2E6EB]'
                }`}
              >
                <div
                  className={`mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] ${
                    formData.role === 'customer'
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-[#F5F6F8] text-[#475569]'
                  }`}
                >
                  <User className="h-4 w-4" strokeWidth={2.2} />
                </div>
                <span className="text-[13px] font-bold text-[#0F172A]">Pemesan</span>
                <span className="mt-0.5 text-[11px] leading-[1.3] text-[#5B6678]">
                  Pesan anjem &amp; titip
                </span>
              </button>

              <button
                type="button"
                aria-pressed={formData.role === 'driver'}
                onClick={() => handleRoleSelect('driver')}
                className={`flex flex-col items-start rounded-[14px] p-3 text-left transition cursor-pointer ${
                  formData.role === 'driver'
                    ? 'bg-[#E6F4F2] shadow-[inset_0_0_0_1.5px_#0F766E]'
                    : 'bg-white shadow-[inset_0_0_0_1.5px_#E2E6EB]'
                }`}
              >
                <div
                  className={`mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] ${
                    formData.role === 'driver'
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-[#F5F6F8] text-[#475569]'
                  }`}
                >
                  <Bike className="h-4 w-4" strokeWidth={2.2} />
                </div>
                <span className="text-[13px] font-bold text-[#0F172A]">Driver</span>
                <span className="mt-0.5 text-[11px] leading-[1.3] text-[#5B6678]">
                  Ambil orderan &amp; antar
                </span>
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-[#5B6678]">
              Peran tidak dapat diubah setelah akun dibuat.
            </p>
          </div>

          <div>
            <label htmlFor="nama" className="input-label">
              Nama lengkap
            </label>
            <input
              id="nama"
              name="nama"
              type="text"
              autoComplete="name"
              placeholder="Masukkan nama lengkap"
              value={formData.nama}
              onChange={handleChange}
              className="input-field"
            />
          </div>

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
              value={formData.nim}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="no_wa" className="input-label">
              Nomor WhatsApp
            </label>
            <input
              id="no_wa"
              name="no_wa"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Contoh: 081234567890"
              value={formData.no_wa}
              onChange={handleChange}
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
              autoComplete="new-password"
              placeholder="Minimal 6 karakter"
              value={formData.password}
              onChange={handleChange}
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

          <button type="submit" disabled={submitting} className="btn-primary mt-1">
            {submitting ? 'Mendaftarkan...' : 'Daftar'}
          </button>
        </form>

        <p className="mt-auto pt-1 text-center text-[13px] leading-[1.4] text-[#5B6678]">
          Sudah punya akun?{' '}
          <Link
            to="/login"
            className="font-bold text-[#0F766E] no-underline hover:no-underline"
          >
            Masuk
          </Link>
        </p>
      </main>
    </div>
  );
}

