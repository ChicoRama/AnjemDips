import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, CheckCheck, Clock3, Bike, PackageCheck,
  X, Trash2, BellRing, ShoppingBag, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const POLL_INTERVAL = 15000;
const MAX_NOTIFICATIONS = 60;

const statusMessages = {
  accepted: {
    title: 'Driver menerima pesanan',
    message: 'Pesananmu sudah diambil driver. Bersiap untuk dijemput, ya!',
    icon: 'driver',
  },
  on_the_way: {
    title: 'Driver sedang menuju lokasi',
    message: 'Driver sedang dalam perjalanan menuju titik jemput.',
    icon: 'driver',
  },
  on_progress: {
    title: 'Pesanan sedang diproses',
    message: 'Pesananmu sedang dikerjakan oleh driver.',
    icon: 'package',
  },
  in_progress: {
    title: 'Pesanan sedang diantar',
    message: 'Pesananmu sedang dalam perjalanan ke tujuan.',
    icon: 'package',
  },
  completed: {
    title: 'Pesanan selesai',
    message: 'Pesanan berhasil diselesaikan. Terima kasih sudah menggunakan AnjemDips!',
    icon: 'check',
  },
  cancelled: {
    title: 'Pesanan dibatalkan',
    message: 'Pesanan ini telah dibatalkan atau kedaluwarsa.',
    icon: 'x',
  },
};

const storageKey = (userId) => `anjemdips_notifications_${userId}`;
const snapshotKey = (userId) => `anjemdips_order_snapshot_${userId}`;

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function makeNotification({ title, message, orderId, type, createdAt }) {
  return {
    id: `${type}-${orderId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    message,
    orderId,
    type,
    createdAt: createdAt || new Date().toISOString(),
    read: false,
  };
}

function getOrderLabel(order) {
  return order?.jenis_layanan === 'jastip' ? 'Jastip' : 'Anjem';
}

function getOrderDescription(order) {
  const route = [order?.titik_jemput, order?.titik_antar].filter(Boolean).join(' → ');
  return `${getOrderLabel(order)}${route ? ` · ${route}` : ''}`;
}

function NotificationIcon({ type }) {
  const className = 'h-4 w-4';
  if (type === 'new-order') return <ShoppingBag className={className} />;
  if (type === 'driver') return <Bike className={className} />;
  if (type === 'package') return <PackageCheck className={className} />;
  if (type === 'check') return <Check className={className} />;
  if (type === 'x') return <X className={className} />;
  return <BellRing className={className} />;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const previousOrders = useRef(null);
  const isMounted = useRef(true);

  const isDriver = user?.role === 'driver';
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const saveNotifications = useCallback((next) => {
    if (!user?.id) return;
    const limited = next.slice(0, MAX_NOTIFICATIONS);
    setNotifications(limited);
    localStorage.setItem(storageKey(user.id), JSON.stringify(limited));
  }, [user?.id]);

  const addNotifications = useCallback((created) => {
    if (!created.length) return;
    setNotifications((current) => {
      const next = [...created, ...current].slice(0, MAX_NOTIFICATIONS);
      if (user?.id) localStorage.setItem(storageKey(user.id), JSON.stringify(next));
      return next;
    });
  }, [user?.id]);

  const processOrders = useCallback((orders) => {
    if (!user?.id) return;

    const currentMap = {};
    orders.forEach((order) => {
      currentMap[String(order.id)] = {
        status: order.status,
        driver_id: order.driver_id || null,
        customer_id: order.customer_id || null,
        jenis_layanan: order.jenis_layanan,
        titik_jemput: order.titik_jemput,
        titik_antar: order.titik_antar,
      };
    });

    // Snapshot pertama hanya menjadi baseline agar tidak membanjiri notifikasi
    // dengan pesanan lama setiap kali pengguna login atau membuka aplikasi.
    if (previousOrders.current === null) {
      previousOrders.current = currentMap;
      localStorage.setItem(snapshotKey(user.id), JSON.stringify(currentMap));
      return;
    }

    const previous = previousOrders.current;
    const generated = [];

    for (const order of orders) {
      const id = String(order.id);
      const before = previous[id];
      const description = getOrderDescription(order);

      if (!before) {
        if (isDriver && order.status === 'pending') {
          generated.push(makeNotification({
            title: 'Ada orderan baru!',
            message: `${description}. Cek detailnya dan ambil order jika cocok.`,
            orderId: order.id,
            type: 'new-order',
          }));
        } else if (!isDriver && String(order.customer_id) === String(user.id)) {
          generated.push(makeNotification({
            title: 'Pesanan berhasil dibuat',
            message: `${description}. Pesananmu sedang menunggu driver.`,
            orderId: order.id,
            type: 'package',
          }));
        }
        continue;
      }

      if (before.status !== order.status) {
        if (isDriver && String(order.driver_id) === String(user.id)) {
          const info = statusMessages[order.status];
          if (info) {
            generated.push(makeNotification({
              title: `Status pesanan: ${info.title}`,
              message: `${description}. ${info.message}`,
              orderId: order.id,
              type: info.icon,
            }));
          }
        } else if (!isDriver && String(order.customer_id) === String(user.id)) {
          const info = statusMessages[order.status];
          if (info) {
            generated.push(makeNotification({
              title: info.title,
              message: `${description}. ${info.message}`,
              orderId: order.id,
              type: info.icon,
            }));
          }
        }
      }

      if (isDriver && !before.driver_id && order.driver_id && String(order.driver_id) === String(user.id)) {
        generated.push(makeNotification({
          title: 'Order berhasil kamu ambil',
          message: `${description}. Detail pesanan sudah masuk ke Tugas Saya.`,
          orderId: order.id,
          type: 'check',
        }));
      }
    }

    previousOrders.current = currentMap;
    localStorage.setItem(snapshotKey(user.id), JSON.stringify(currentMap));
    addNotifications(generated);
  }, [user?.id, isDriver, addNotifications]);

  const fetchLatest = useCallback(async (showLoader = false) => {
    if (!user?.id) return;
    if (showLoader) setLoading(true);
    try {
      const response = await api.get('/orders');
      if (!isMounted.current) return;
      const orders = Array.isArray(response.data?.data) ? response.data.data : [];
      processOrders(orders);
    } catch {
      // Kegagalan jaringan tidak menghapus notifikasi atau snapshot sebelumnya.
    } finally {
      if (isMounted.current && showLoader) setLoading(false);
    }
  }, [user?.id, processOrders]);

  useEffect(() => {
    isMounted.current = true;
    previousOrders.current = null;
    if (!user?.id) return undefined;

    setNotifications(readJson(storageKey(user.id), []));
    // Gunakan snapshot tersimpan agar perubahan yang terjadi ketika tab ditutup
    // tetap dapat dideteksi saat aplikasi dibuka kembali.
    previousOrders.current = readJson(snapshotKey(user.id), null);

    fetchLatest(true);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchLatest(false);
    }, POLL_INTERVAL);

    const onFocus = () => fetchLatest(false);
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted.current = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.id, fetchLatest]);

  const markRead = (id) => {
    saveNotifications(notifications.map((item) =>
      item.id === id ? { ...item, read: true } : item
    ));
  };

  const markAllRead = () => {
    saveNotifications(notifications.map((item) => ({ ...item, read: true })));
  };

  const clearAll = () => saveNotifications([]);

  const openNotification = (item) => {
    markRead(item.id);
    setOpen(false);
    navigate(isDriver ? '/driver/pesanan' : '/customer/pesanan');
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifikasi${unreadCount ? `, ${unreadCount} belum dibaca` : ''}`}
        aria-expanded={open}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/12 text-white transition hover:bg-white/20 active:scale-95"
      >
        <Bell className="h-[19px] w-[19px]" strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-[#0B4F4A] bg-[#FBBF24] px-1 text-[10px] font-extrabold leading-none text-[#0F172A]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Tutup notifikasi"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <section className="absolute right-0 top-[calc(100%+12px)] z-40 flex max-h-[min(560px,75vh)] w-[min(360px,calc(100vw-32px))] flex-col overflow-hidden rounded-[18px] bg-white text-[#0F172A] shadow-[0_18px_55px_rgba(15,23,42,0.22)] ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-[#E2E6EB] px-4 py-3.5">
              <div>
                <h2 className="text-[14px] font-extrabold">Notifikasi</h2>
                <p className="mt-0.5 text-[11px] text-[#64748B]">
                  {unreadCount ? `${unreadCount} belum dibaca` : 'Kamu sudah mengetahui semuanya'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={!unreadCount}
                  title="Tandai semua dibaca"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#0F766E] hover:bg-[#E6F4F2] disabled:opacity-30"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={!notifications.length}
                  title="Hapus semua notifikasi"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading && !notifications.length ? (
                <div className="flex items-center justify-center gap-2 px-4 py-10 text-[12px] text-[#64748B]">
                  <Clock3 className="h-4 w-4 animate-pulse" />
                  Memeriksa aktivitas terbaru...
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-10 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F4F2] text-[#0F766E]">
                    <BellRing className="h-5 w-5" />
                  </div>
                  <p className="text-[13px] font-bold">Belum ada notifikasi</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#64748B]">
                    {isDriver
                      ? 'Info orderan baru dan perubahan tugas akan muncul di sini.'
                      : 'Update pesanan, driver, dan status pengantaran akan muncul di sini.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fetchLatest(true)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#E6F4F2] px-3 py-2 text-[11px] font-bold text-[#0F766E] hover:bg-[#D5ECE8]"
                  >
                    Periksa sekarang <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#F1F5F9]">
                  {notifications.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => openNotification(item)}
                      className={`flex w-full gap-3 px-4 py-3.5 text-left transition hover:bg-[#F8FAFC] ${
                        item.read ? 'bg-white' : 'bg-[#F0F9F8]'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        item.read ? 'bg-[#F1F5F9] text-[#64748B]' : 'bg-[#DDF3EF] text-[#0F766E]'
                      }`}>
                        <NotificationIcon type={item.type} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-[12px] font-extrabold leading-snug">{item.title}</span>
                          {!item.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#0F766E]" />}
                        </span>
                        <span className="mt-1 block text-[11px] leading-relaxed text-[#64748B]">{item.message}</span>
                        <span className="mt-2 block text-[10px] font-medium text-[#94A3B8]">{formatTime(item.createdAt)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[#E2E6EB] px-4 py-2.5">
              <p className="text-center text-[10px] text-[#94A3B8]">
                Update otomatis setiap 15 detik selama aplikasi aktif
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}