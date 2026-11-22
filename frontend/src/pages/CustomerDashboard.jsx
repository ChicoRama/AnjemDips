import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import {
  Bike,
  ShoppingBag,
  RefreshCw,
  MessageCircle,
  XCircle,
  Clock,
} from 'lucide-react';

const ONGKIR_PRESETS = [5000, 8000, 10000, 15000];

const STATUS_MAP = {
  pending: {
    label: 'Menunggu Driver',
    className: 'bg-[#FEF3C7] text-[#92400E]',
  },
  accepted: {
    label: 'Driver Menuju Lokasi',
    className: 'bg-[#E6F4F2] text-[#0F766E]',
  },
  on_the_way: {
    label: 'Sedang Diantar',
    className: 'bg-[#E6F4F2] text-[#0F766E]',
  },
  in_progress: {
    label: 'Sedang Diantar',
    className: 'bg-[#E6F4F2] text-[#0F766E]',
  },
  completed: {
    label: 'Selesai',
    className: 'bg-[#DDF3E4] text-[#14532D]',
  },
  cancelled: {
    label: 'Dibatalkan',
    className: 'bg-[#FEF2F2] text-[#B91C1C]',
  },
};

function formatRupiah(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

function formatWaUrl(phone, text) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = `62${cleaned.slice(1)}`;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('order'); // 'order' | 'history'
  const [jenisLayanan, setJenisLayanan] = useState('anjem'); // 'anjem' | 'jastip'
  const [titikJemput, setTitikJemput] = useState('');
  const [titikAntar, setTitikAntar] = useState('');
  const [catatan, setCatatan] = useState('');
  const [ongkir, setOngkir] = useState('5000');

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/orders');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOngkirChange = (e) => {
    const numeric = e.target.value.replace(/\D/g, '');
    setOngkir(numeric);
    if (formError) setFormError('');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const cleanJemput = titikJemput.trim();
    const cleanAntar = titikAntar.trim();
    const numericOngkir = Number(ongkir);

    if (!cleanJemput || !cleanAntar) {
      setFormError('Titik jemput dan titik antar wajib diisi.');
      return;
    }

    if (!numericOngkir || numericOngkir < 2000) {
      setFormError('Minimal ongkir adalah Rp 2.000.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        jenis_layanan: jenisLayanan,
        titik_jemput: cleanJemput,
        titik_antar: cleanAntar,
        catatan: catatan.trim(),
        ongkir: numericOngkir,
      });

      setTitikJemput('');
      setTitikAntar('');
      setCatatan('');
      setFormSuccess(
        res.data?.message ||
          'Pesanan berhasil dibuat! Menunggu driver mengambil order.'
      );
      await fetchOrders();
      setActiveTab('history');
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Gagal membuat pesanan. Coba lagi.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      await fetchOrders();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Gagal membatalkan pesanan.'
      );
    } finally {
      setCancellingId(null);
    }
  };

  const activeOrderCount = orders.filter((o) =>
    ['pending', 'accepted', 'on_the_way', 'in_progress'].includes(o.status)
  ).length;

  return (
    <div className="pwa-shell flex flex-col bg-[#F5F6F8] font-sans">
      <Navbar />

      <main className="flex flex-1 flex-col gap-4 p-5">
        {/* Segmented Control */}
        <div className="grid grid-cols-2 gap-1.5 rounded-[14px] bg-white p-1.5 shadow-[inset_0_0_0_1.5px_#E2E6EB]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('order');
              setFormSuccess('');
            }}
            className={`h-[38px] cursor-pointer rounded-[10px] text-[13px] font-bold transition ${
              activeTab === 'order'
                ? 'bg-[#0F766E] text-white'
                : 'text-[#5B6678] hover:text-[#0F172A]'
            }`}
          >
            Pesan Layanan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex h-[38px] cursor-pointer items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-bold transition ${
              activeTab === 'history'
                ? 'bg-[#0F766E] text-white'
                : 'text-[#5B6678] hover:text-[#0F172A]'
            }`}
          >
            <span>Pesanan Saya</span>
            {activeOrderCount > 0 && (
              <span
                className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[99px] px-1.5 text-[10px] font-extrabold ${
                  activeTab === 'history'
                    ? 'bg-[#FBBF24] text-[#0F172A]'
                    : 'bg-[#E6F4F2] text-[#0F766E]'
                }`}
              >
                {activeOrderCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: FORM PEMESANAN */}
        {activeTab === 'order' && (
          <form
            onSubmit={handleSubmitOrder}
            className="flex flex-col gap-4 rounded-[16px] bg-white p-4 shadow-[inset_0_0_0_1.5px_#E2E6EB]"
            noValidate
          >
            <div>
              <h1 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#0F172A]">
                Mau ke mana atau titip apa?
              </h1>
              <p className="mt-0.5 text-[12px] text-[#5B6678]">
                Pilih layanan dan tentukan titik lokasi di sekitar kampus.
              </p>
            </div>

            {/* Pilihan Layanan: Anjem / Jastip */}
            <div>
              <span className="input-label">Jenis layanan</span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  aria-pressed={jenisLayanan === 'anjem'}
                  onClick={() => setJenisLayanan('anjem')}
                  className={`flex cursor-pointer flex-col items-start rounded-[14px] p-3 text-left transition ${
                    jenisLayanan === 'anjem'
                      ? 'bg-[#E6F4F2] shadow-[inset_0_0_0_1.5px_#0F766E]'
                      : 'bg-white shadow-[inset_0_0_0_1.5px_#E2E6EB]'
                  }`}
                >
                  <div
                    className={`mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] ${
                      jenisLayanan === 'anjem'
                        ? 'bg-[#0F766E] text-white'
                        : 'bg-[#F5F6F8] text-[#475569]'
                    }`}
                  >
                    <Bike className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                  <span className="text-[13px] font-bold text-[#0F172A]">
                    Anjem
                  </span>
                  <span className="mt-0.5 text-[11px] leading-[1.3] text-[#5B6678]">
                    Antar-jemput kampus &amp; kos
                  </span>
                </button>

                <button
                  type="button"
                  aria-pressed={jenisLayanan === 'jastip'}
                  onClick={() => setJenisLayanan('jastip')}
                  className={`flex cursor-pointer flex-col items-start rounded-[14px] p-3 text-left transition ${
                    jenisLayanan === 'jastip'
                      ? 'bg-[#E6F4F2] shadow-[inset_0_0_0_1.5px_#0F766E]'
                      : 'bg-white shadow-[inset_0_0_0_1.5px_#E2E6EB]'
                  }`}
                >
                  <div
                    className={`mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] ${
                      jenisLayanan === 'jastip'
                        ? 'bg-[#0F766E] text-white'
                        : 'bg-[#F5F6F8] text-[#475569]'
                    }`}
                  >
                    <ShoppingBag className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                  <span className="text-[13px] font-bold text-[#0F172A]">
                    Jastip
                  </span>
                  <span className="mt-0.5 text-[11px] leading-[1.3] text-[#5B6678]">
                    Titip beli makan &amp; barang
                  </span>
                </button>
              </div>
            </div>

            {/* Titik Jemput / Beli */}
            <div>
              <label htmlFor="titik_jemput" className="input-label">
                {jenisLayanan === 'anjem'
                  ? 'Titik jemput'
                  : 'Lokasi beli / warung'}
              </label>
              <input
                id="titik_jemput"
                type="text"
                placeholder={
                  jenisLayanan === 'anjem'
                    ? 'Contoh: Area Kos Jl. Sirojudin'
                    : 'Contoh: Burjo Borneo Sirojudin'
                }
                value={titikJemput}
                onChange={(e) => {
                  setTitikJemput(e.target.value);
                  if (formError) setFormError('');
                }}
                className="input-field"
              />
            </div>

            {/* Titik Antar */}
            <div>
              <label htmlFor="titik_antar" className="input-label">
                Titik antar
              </label>
              <input
                id="titik_antar"
                type="text"
                placeholder="Contoh: Gedung Departemen Teknik Komputer UNDIP"
                value={titikAntar}
                onChange={(e) => {
                  setTitikAntar(e.target.value);
                  if (formError) setFormError('');
                }}
                className="input-field"
              />
            </div>

            {/* Catatan */}
            <div>
              <label htmlFor="catatan" className="input-label">
                {jenisLayanan === 'anjem'
                  ? 'Catatan untuk driver (opsional)'
                  : 'Detail barang titipan & catatan'}
              </label>
              <textarea
                id="catatan"
                rows={2}
                placeholder={
                  jenisLayanan === 'anjem'
                    ? 'Contoh: Pakai jaket hitam depan indomaret'
                    : 'Contoh: Magelangan pedas 1, es teh manis 1'
                }
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full resize-none rounded-[12px] bg-white px-[14px] py-2.5 text-[13px] font-medium text-[#0F172A] shadow-[inset_0_0_0_1.5px_#E2E6EB] outline-none transition placeholder:font-normal placeholder:text-[#5B6678] focus:shadow-[inset_0_0_0_1.5px_#0F766E]"
              />
            </div>

            {/* Ongkir */}
            <div>
              <label htmlFor="ongkir" className="input-label">
                Tawaran ongkir (Rp)
              </label>
              <input
                id="ongkir"
                type="text"
                inputMode="numeric"
                placeholder="5000"
                value={ongkir}
                onChange={handleOngkirChange}
                className="input-field"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ONGKIR_PRESETS.map((preset) => {
                  const isSelected = Number(ongkir) === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setOngkir(String(preset));
                        if (formError) setFormError('');
                      }}
                      className={`cursor-pointer rounded-[99px] px-3 py-1 text-[11px] font-bold transition ${
                        isSelected
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-[#F0F7F6] text-[#0F766E] hover:bg-[#E6F4F2]'
                      }`}
                    >
                      {formatRupiah(preset)}
                    </button>
                  );
                })}
              </div>
            </div>

            {formError && (
              <p
                role="alert"
                className="rounded-[12px] bg-[#FEF2F2] px-3 py-2 text-[12px] font-medium text-[#B91C1C]"
              >
                {formError}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting
                ? 'Membuat Pesanan...'
                : jenisLayanan === 'anjem'
                  ? 'Pesan Anjem Sekarang'
                  : 'Pesan Jastip Sekarang'}
            </button>
          </form>
        )}

        {/* TAB 2: DAFTAR PESANAN SAYA */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold text-[#0F172A]">
                Daftar Pesanan
              </h2>
              <button
                type="button"
                onClick={fetchOrders}
                disabled={loadingOrders}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[99px] bg-white px-3 py-1.5 text-[11px] font-bold text-[#0F766E] shadow-[inset_0_0_0_1.5px_#E2E6EB] transition hover:bg-[#F0F7F6]"
              >
                <RefreshCw
                  className={`h-3 w-3 ${loadingOrders ? 'animate-spin' : ''}`}
                />
                <span>Muat Ulang</span>
              </button>
            </div>

            {formSuccess && (
              <div className="rounded-[12px] bg-[#DDF3E4] px-3.5 py-2.5 text-[12px] font-semibold text-[#14532D]">
                {formSuccess}
              </div>
            )}

            {loadingOrders ? (
              <div className="rounded-[16px] bg-white p-6 text-center text-[12px] text-[#5B6678] shadow-[inset_0_0_0_1.5px_#E2E6EB]">
                Memuat daftar pesanan...
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-[16px] bg-white p-6 text-center shadow-[inset_0_0_0_1.5px_#E2E6EB]">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#F0F7F6] text-[#0F766E]">
                  <Clock className="h-5 w-5" />
                </div>
                <p className="text-[13px] font-bold text-[#0F172A]">
                  Belum ada pesanan
                </p>
                <p className="text-[12px] text-[#5B6678]">
                  Pesanan Anjem atau Jastip yang kamu buat akan muncul di sini.
                </p>
              </div>
            ) : (
              orders.map((order) => {
                const statusInfo = STATUS_MAP[order.status] || {
                  label: order.status || 'Menunggu',
                  className: 'bg-[#F5F6F8] text-[#475569]',
                };
                const isJastip = order.jenis_layanan === 'jastip';
                const driverWa = formatWaUrl(
                  order.driver?.no_wa,
                  `Halo kak ${order.driver?.nama || 'Driver'}, saya pemesan AnjemDips.`
                );

                return (
                  <article
                    key={order.id}
                    className="flex flex-col gap-3 rounded-[16px] bg-white p-4 shadow-[inset_0_0_0_1.5px_#E2E6EB]"
                  >
                    {/* Header Card */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-[99px] bg-[#E6F4F2] px-2.5 py-1 text-[11px] font-bold text-[#0F766E]">
                        {isJastip ? (
                          <>
                            <ShoppingBag className="h-3 w-3" />
                            <span>Jastip</span>
                          </>
                        ) : (
                          <>
                            <Bike className="h-3 w-3" />
                            <span>Anjem</span>
                          </>
                        )}
                      </span>

                      <span
                        className={`rounded-[99px] px-2.5 py-1 text-[11px] font-bold ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Rute Jemput -> Antar */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#FBBF24]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#0B4F4A]" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.03em] text-[#5B6678]">
                            {isJastip ? 'Lokasi beli' : 'Titik jemput'}
                          </div>
                          <div className="text-[13px] font-semibold text-[#0F172A]">
                            {order.titik_jemput}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#0F766E]">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.03em] text-[#5B6678]">
                            Titik antar
                          </div>
                          <div className="text-[13px] font-semibold text-[#0F172A]">
                            {order.titik_antar}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Catatan */}
                    {order.catatan && (
                      <div className="rounded-[12px] bg-[#F0F7F6] px-3 py-2 text-[12px] text-[#475569]">
                        <span className="font-semibold text-[#0F172A]">
                          Catatan:{' '}
                        </span>
                        {order.catatan}
                      </div>
                    )}

                    {/* Footer: Ongkir & Aksi */}
                    <div className="flex items-center justify-between border-t border-[#E2E6EB] pt-2.5">
                      <div>
                        <span className="block text-[10px] font-semibold text-[#5B6678]">
                          Ongkir
                        </span>
                        <span className="text-[14px] font-extrabold text-[#0F172A]">
                          {formatRupiah(order.ongkir)}
                        </span>
                      </div>

                      {order.status === 'pending' && (
                        <button
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() => handleCancelOrder(order.id)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-[10px] bg-[#FEF2F2] px-3 py-1.5 text-[11px] font-bold text-[#B91C1C] transition hover:bg-[#FEE2E2] disabled:opacity-60"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>
                            {cancellingId === order.id
                              ? 'Membatalkan...'
                              : 'Batalkan'}
                          </span>
                        </button>
                      )}

                      {['accepted', 'on_the_way', 'in_progress'].includes(
                        order.status
                      ) &&
                        driverWa && (
                          <a
                            href={driverWa}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#0F766E] px-3 py-1.5 text-[11px] font-bold text-white no-underline transition hover:bg-[#0B4F4A]"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>
                              Chat {order.driver?.nama?.split(' ')[0] || 'Driver'}
                            </span>
                          </a>
                        )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}