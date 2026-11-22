import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Bike,
  ShoppingBag,
  RefreshCw,
  MessageCircle,
  CheckCircle2,
  Navigation,
  Clock,
  User,
} from 'lucide-react';

const STATUS_MAP = {
  pending: {
    label: 'Menunggu Driver',
    className: 'bg-[#FEF3C7] text-[#92400E]',
  },
  accepted: {
    label: 'Menuju Lokasi',
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

export default function DriverDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'tasks'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAcceptOrder = async (orderId) => {
    setFeedbackError('');
    setFeedbackSuccess('');
    setActionId(orderId);

    try {
      const res = await api.patch(`/orders/${orderId}/accept`);
      setFeedbackSuccess(
        res.data?.message || 'Orderan berhasil diambil! Segera hubungi pemesan.'
      );
      await fetchOrders();
      setActiveTab('tasks');
    } catch (err) {
      setFeedbackError(
        err.response?.data?.message ||
          'Gagal mengambil orderan. Mungkin sudah diambil driver lain.'
      );
    } finally {
      setActionId(null);
    }
  };

  const handleUpdateStatus = async (orderId, nextStatus) => {
    setFeedbackError('');
    setFeedbackSuccess('');
    setActionId(orderId);

    try {
      const res = await api.patch(`/orders/${orderId}/status`, {
        status: nextStatus,
      });
      setFeedbackSuccess(
        res.data?.message ||
          (nextStatus === 'completed'
            ? 'Pengantaran selesai!'
            : 'Status pengantaran diperbarui.')
      );
      await fetchOrders();
    } catch (err) {
      setFeedbackError(
        err.response?.data?.message || 'Gagal memperbarui status orderan.'
      );
    } finally {
      setActionId(null);
    }
  };

  const incomingOrders = orders.filter((o) => o.status === 'pending');

  const myOrders = orders.filter(
    (o) =>
      (o.driver_id && o.driver_id === user?.id) ||
      (o.driver?.id && o.driver.id === user?.id)
  );

  const activeTasksCount = myOrders.filter((o) =>
    ['accepted', 'on_the_way', 'in_progress'].includes(o.status)
  ).length;

  const completedOrders = myOrders.filter((o) => o.status === 'completed');
  const totalEarnings = completedOrders.reduce(
    (sum, item) => sum + (Number(item.ongkir) || 0),
    0
  );

  return (
    <div className="pwa-shell flex flex-col bg-[#F5F6F8] font-sans">
      <Navbar />

      <main className="flex flex-1 flex-col gap-4 p-5">
        {/* Ringkasan Singkat Driver */}
        <section className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[16px] bg-white p-3.5 shadow-[inset_0_0_0_1.5px_#E2E6EB]">
            <span className="block text-[11px] font-semibold text-[#5B6678]">
              Order Selesai
            </span>
            <div className="mt-1 text-[18px] font-extrabold tracking-[-0.02em] text-[#0F172A]">
              {completedOrders.length}{' '}
              <span className="text-[12px] font-semibold text-[#5B6678]">
                order
              </span>
            </div>
          </div>

          <div className="rounded-[16px] bg-white p-3.5 shadow-[inset_0_0_0_1.5px_#E2E6EB]">
            <span className="block text-[11px] font-semibold text-[#5B6678]">
              Total Pendapatan
            </span>
            <div className="mt-1 text-[18px] font-extrabold tracking-[-0.02em] text-[#0F766E]">
              {formatRupiah(totalEarnings)}
            </div>
          </div>
        </section>

        {/* Segmented Control */}
        <div className="grid grid-cols-2 gap-1.5 rounded-[14px] bg-white p-1.5 shadow-[inset_0_0_0_1.5px_#E2E6EB]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('incoming');
              setFeedbackError('');
            }}
            className={`flex h-[38px] cursor-pointer items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-bold transition ${
              activeTab === 'incoming'
                ? 'bg-[#0F766E] text-white'
                : 'text-[#5B6678] hover:text-[#0F172A]'
            }`}
          >
            <span>Orderan Masuk</span>
            {incomingOrders.length > 0 && (
              <span
                className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[99px] px-1.5 text-[10px] font-extrabold ${
                  activeTab === 'incoming'
                    ? 'bg-[#FBBF24] text-[#0F172A]'
                    : 'bg-[#E6F4F2] text-[#0F766E]'
                }`}
              >
                {incomingOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('tasks');
              setFeedbackError('');
            }}
            className={`flex h-[38px] cursor-pointer items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-bold transition ${
              activeTab === 'tasks'
                ? 'bg-[#0F766E] text-white'
                : 'text-[#5B6678] hover:text-[#0F172A]'
            }`}
          >
            <span>Tugas Saya</span>
            {activeTasksCount > 0 && (
              <span
                className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[99px] px-1.5 text-[10px] font-extrabold ${
                  activeTab === 'tasks'
                    ? 'bg-[#FBBF24] text-[#0F172A]'
                    : 'bg-[#E6F4F2] text-[#0F766E]'
                }`}
              >
                {activeTasksCount}
              </span>
            )}
          </button>
        </div>

        {/* Header List + Tombol Refresh */}
        <div className="flex items-center justify-between">
          <h1 className="text-[15px] font-extrabold tracking-[-0.01em] text-[#0F172A]">
            {activeTab === 'incoming'
              ? 'Orderan Menunggu Driver'
              : 'Daftar Tugas Pengantaran'}
          </h1>
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[99px] bg-white px-3 py-1.5 text-[11px] font-bold text-[#0F766E] shadow-[inset_0_0_0_1.5px_#E2E6EB] transition hover:bg-[#F0F7F6]"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* Notifikasi Error / Sukses */}
        {feedbackError && (
          <p
            role="alert"
            className="rounded-[12px] bg-[#FEF2F2] px-3.5 py-2.5 text-[12px] font-medium text-[#B91C1C]"
          >
            {feedbackError}
          </p>
        )}

        {feedbackSuccess && (
          <div className="rounded-[12px] bg-[#DDF3E4] px-3.5 py-2.5 text-[12px] font-semibold text-[#14532D]">
            {feedbackSuccess}
          </div>
        )}

        {/* TAB 1: ORDERAN MASUK (PENDING) */}
        {activeTab === 'incoming' && (
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="rounded-[16px] bg-white p-6 text-center text-[12px] text-[#5B6678] shadow-[inset_0_0_0_1.5px_#E2E6EB]">
                Memuat orderan masuk...
              </div>
            ) : incomingOrders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-[16px] bg-white p-6 text-center shadow-[inset_0_0_0_1.5px_#E2E6EB]">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#F0F7F6] text-[#0F766E]">
                  <Clock className="h-5 w-5" />
                </div>
                <p className="text-[13px] font-bold text-[#0F172A]">
                  Belum ada orderan baru
                </p>
                <p className="text-[12px] text-[#5B6678]">
                  Tekan Muat Ulang secara berkala untuk mengecek pesanan mahasiswa.
                </p>
              </div>
            ) : (
              incomingOrders.map((order) => {
                const isJastip = order.jenis_layanan === 'jastip';
                const isProcessing = actionId === order.id;

                return (
                  <article
                    key={order.id}
                    className="flex flex-col gap-3 rounded-[16px] bg-white p-4 shadow-[inset_0_0_0_1.5px_#E2E6EB]"
                  >
                    {/* Header Card: Jenis Layanan & Ongkir */}
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

                      <span className="text-[15px] font-extrabold text-[#0F172A]">
                        {formatRupiah(order.ongkir)}
                      </span>
                    </div>

                    {/* Rute */}
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

                    {/* Info Pemesan & Tombol Ambil */}
                    <div className="flex items-center justify-between gap-2 border-t border-[#E2E6EB] pt-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[99px] bg-[#F5F6F8] text-[#475569]">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[12px] font-bold text-[#0F172A]">
                            {order.customer?.nama || 'Mahasiswa'}
                          </div>
                          {order.customer?.nim && (
                            <div className="text-[10px] font-medium text-[#5B6678]">
                              {order.customer.nim}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleAcceptOrder(order.id)}
                        className="h-[38px] shrink-0 cursor-pointer rounded-[12px] bg-[#0F766E] px-4 text-[12px] font-bold text-white transition hover:bg-[#0B4F4A] disabled:opacity-60"
                      >
                        {isProcessing ? 'Mengambil...' : 'Ambil Order'}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: TUGAS SAYA */}
        {activeTab === 'tasks' && (
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="rounded-[16px] bg-white p-6 text-center text-[12px] text-[#5B6678] shadow-[inset_0_0_0_1.5px_#E2E6EB]">
                Memuat daftar tugas...
              </div>
            ) : myOrders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-[16px] bg-white p-6 text-center shadow-[inset_0_0_0_1.5px_#E2E6EB]">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#F0F7F6] text-[#0F766E]">
                  <Bike className="h-5 w-5" />
                </div>
                <p className="text-[13px] font-bold text-[#0F172A]">
                  Belum ada tugas aktif
                </p>
                <p className="text-[12px] text-[#5B6678]">
                  Orderan yang kamu ambil dari tab Orderan Masuk akan tampil di sini.
                </p>
              </div>
            ) : (
              myOrders.map((order) => {
                const statusInfo = STATUS_MAP[order.status] || {
                  label: order.status,
                  className: 'bg-[#F5F6F8] text-[#475569]',
                };
                const isJastip = order.jenis_layanan === 'jastip';
                const isProcessing = actionId === order.id;
                const isActive = ['accepted', 'on_the_way', 'in_progress'].includes(
                  order.status
                );
                const customerWa = formatWaUrl(
                  order.customer?.no_wa,
                  `Halo kak ${order.customer?.nama || ''}, saya driver AnjemDips yang mengambil pesananmu.`
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

                    {/* Rute */}
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

                    {/* Info Pemesan & Ongkir */}
                    <div className="flex items-center justify-between gap-2 border-t border-[#E2E6EB] pt-2.5">
                      <div>
                        <span className="block text-[10px] font-semibold text-[#5B6678]">
                          Pemesan ({order.customer?.nama || 'Mahasiswa'})
                        </span>
                        <span className="text-[14px] font-extrabold text-[#0F172A]">
                          {formatRupiah(order.ongkir)}
                        </span>
                      </div>

                      {isActive && customerWa && (
                        <a
                          href={customerWa}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#E6F4F2] px-3 py-1.5 text-[11px] font-bold text-[#0F766E] no-underline transition hover:bg-[#D5ECE8]"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>Chat WA</span>
                        </a>
                      )}
                    </div>

                    {/* Kontrol Status Pengantaran */}
                    {order.status === 'accepted' && (
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handleUpdateStatus(order.id, 'on_the_way')
                          }
                          className="inline-flex h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-[12px] bg-[#F0F7F6] px-3 text-[12px] font-bold text-[#0F766E] shadow-[inset_0_0_0_1.5px_#0F766E] transition hover:bg-[#E6F4F2] disabled:opacity-60"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          <span>Mulai Antar</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handleUpdateStatus(order.id, 'completed')
                          }
                          className="inline-flex h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-[12px] bg-[#0F766E] px-3 text-[12px] font-bold text-white transition hover:bg-[#0B4F4A] disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Selesai</span>
                        </button>
                      </div>
                    )}

                    {['on_the_way', 'in_progress'].includes(order.status) && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() =>
                          handleUpdateStatus(order.id, 'completed')
                        }
                        className="inline-flex h-[42px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-[12px] bg-[#0F766E] px-4 text-[13px] font-bold text-white transition hover:bg-[#0B4F4A] disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {isProcessing
                            ? 'Menyelesaikan...'
                            : 'Selesaikan Pengantaran'}
                        </span>
                      </button>
                    )}
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