import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, Bike, Check, CheckCheck, Clock3, PackageCheck, ShoppingBag, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const POLL_MS = 12000;
const MAX_ITEMS = 50;
const statusCopy = {
  accepted: ['Driver menerima pesanan', 'Pesananmu sudah diambil driver.', 'driver'],
  on_progress: ['Pesanan sedang diproses', 'Pesananmu sedang dikerjakan driver.', 'package'],
  on_the_way: ['Driver sedang menuju lokasi', 'Driver sedang dalam perjalanan.', 'driver'],
  in_progress: ['Pesanan sedang diantar', 'Pesananmu sedang dalam perjalanan ke tujuan.', 'package'],
  completed: ['Pesanan selesai', 'Pesanan berhasil diselesaikan. Terima kasih!', 'check'],
  cancelled: ['Pesanan dibatalkan', 'Pesanan ini telah dibatalkan.', 'cancel'],
};

const keyFor = (id) => `anjemdips_notif_${id}`;
const snapshotFor = (id) => `anjemdips_notif_snapshot_${id}`;
const readStorage = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const timeLabel = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
};

function IconFor({ type }) {
  if (type === 'driver') return <Bike size={17} />;
  if (type === 'package') return <PackageCheck size={17} />;
  if (type === 'check') return <Check size={17} />;
  if (type === 'cancel') return <X size={17} />;
  return <ShoppingBag size={17} />;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [panelStyle, setPanelStyle] = useState({ top: 72, right: 16 });
  const snapshot = useRef(null);
  const buttonRef = useRef(null);
  const isDriver = user?.role === 'driver';

  const unread = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const store = useCallback((next) => {
    const limited = next.slice(0, MAX_ITEMS);
    setItems(limited);
    if (user?.id) localStorage.setItem(keyFor(user.id), JSON.stringify(limited));
  }, [user?.id]);

  const refresh = useCallback(async (showLoading = false) => {
    if (!user?.id) return;
    if (showLoading) setLoading(true);
    try {
      const response = await api.get('/orders');
      const orders = Array.isArray(response.data?.data) ? response.data.data : [];
      const current = {};
      const created = [];

      orders.forEach((order) => {
        const id = String(order.id);
        const belongsToUser = isDriver
          ? String(order.driver_id || '') === String(user.id) || order.status === 'pending'
          : String(order.customer_id || '') === String(user.id);
        if (!belongsToUser) return;
        current[id] = { status: order.status, driver_id: order.driver_id || null };
        const before = snapshot.current?.[id];
        const service = order.jenis_layanan === 'jastip' ? 'Jastip' : 'Anjem';
        if (!before) {
          if (snapshot.current !== null && isDriver && order.status === 'pending') {
            created.push({ title: 'Ada pesanan baru', message: `${service} baru menunggu driver. Buka daftar pesanan untuk melihat detail.`, type: 'new', orderId: order.id });
          } else if (snapshot.current !== null && !isDriver) {
            created.push({ title: 'Pesanan berhasil dibuat', message: `${service} kamu sudah tercatat dan sedang menunggu proses berikutnya.`, type: 'package', orderId: order.id });
          }
          return;
        }
        if (before.status !== order.status && statusCopy[order.status]) {
          const [title, message, type] = statusCopy[order.status];
          created.push({ title, message: `${service} · ${message}`, type, orderId: order.id });
        }
      });

      if (snapshot.current === null) {
        snapshot.current = current;
      } else if (created.length) {
        const stamped = created.map((item) => ({
          ...item,
          id: `${item.orderId}-${item.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
          read: false,
        }));
        setItems((previous) => {
          const next = [...stamped, ...previous].slice(0, MAX_ITEMS);
          localStorage.setItem(keyFor(user.id), JSON.stringify(next));
          return next;
        });
        if (!isDriver && created.some((item) => item.type === 'cancel')) {
          // status batal juga tetap muncul sebagai notifikasi riwayat
        }
        snapshot.current = current;
      } else {
        snapshot.current = current;
      }
      localStorage.setItem(snapshotFor(user.id), JSON.stringify(current));
    } catch {
      // Jangan menghapus notifikasi ketika koneksi/server sedang bermasalah.
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user?.id, isDriver]);

  useEffect(() => {
    if (!user?.id) return undefined;
    setItems(readStorage(keyFor(user.id), []));
    snapshot.current = readStorage(snapshotFor(user.id), null);
    refresh(true);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh(false);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [user?.id, refresh]);

  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelStyle({ top: Math.min(rect.bottom + 10, window.innerHeight - 380), right: Math.max(12, window.innerWidth - rect.right) });
    }
    setOpen((value) => !value);
  };

  const markAllRead = () => store(items.map((item) => ({ ...item, read: true })));
  const clearAll = () => store([]);
  const openItem = (item) => {
    store(items.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry));
    setOpen(false);
    navigate(isDriver ? '/driver/pesanan' : '/customer/pesanan');
  };

  if (!user) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={`Buka notifikasi${unread ? `, ${unread} belum dibaca` : ''}`}
        aria-expanded={open}
        title="Notifikasi"
        style={{ position: 'relative', width: 44, height: 44, border: '1px solid #E2E8F0', borderRadius: 14, background: '#fff', color: '#0F172A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none', zIndex: 2, pointerEvents: 'auto' }}
      >
        <Bell size={19} strokeWidth={2} />
        {unread > 0 && <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 19, height: 19, padding: '0 4px', borderRadius: 99, background: '#FBBF24', color: '#111827', border: '2px solid white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && createPortal(
        <>
          <button type="button" aria-label="Tutup panel notifikasi" onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998, border: 0, background: 'transparent', cursor: 'default' }} />
          <section role="dialog" aria-label="Notifikasi" style={{ position: 'fixed', top: Math.max(12, panelStyle.top), right: panelStyle.right, zIndex: 9999, width: 'min(360px, calc(100vw - 24px))', maxHeight: 'min(520px, calc(100dvh - 90px))', background: '#fff', borderRadius: 18, boxShadow: '0 18px 55px rgba(15,23,42,.22)', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#0F172A' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #E2E8F0' }}>
              <div><strong style={{ fontSize: 14 }}>Notifikasi</strong><div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{unread ? `${unread} belum dibaca` : 'Tidak ada notifikasi baru'}</div></div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" title="Tandai semua dibaca" onClick={markAllRead} disabled={!unread} style={{ width: 32, height: 32, border: 0, borderRadius: 8, background: '#E6F4F2', color: '#0F766E', cursor: unread ? 'pointer' : 'not-allowed', opacity: unread ? 1 : .4 }}><CheckCheck size={16} /></button>
                <button type="button" title="Tutup" onClick={() => setOpen(false)} style={{ width: 32, height: 32, border: 0, borderRadius: 8, background: '#F1F5F9', color: '#475569', cursor: 'pointer' }}><X size={16} /></button>
              </div>
            </div>
            <div style={{ overflowY: 'auto', minHeight: 80 }}>
              {loading && !items.length ? <div style={{ padding: 28, textAlign: 'center', color: '#64748B', fontSize: 12 }}><Clock3 size={18} style={{ margin: '0 auto 8px' }} />Memeriksa notifikasi...</div> : items.length ? items.map((item) => (
                <button key={item.id} type="button" onClick={() => openItem(item)} style={{ width: '100%', display: 'flex', gap: 11, padding: '13px 15px', border: 0, borderBottom: '1px solid #F1F5F9', textAlign: 'left', background: item.read ? '#fff' : '#F0F9F8', cursor: 'pointer' }}>
                  <span style={{ width: 36, height: 36, borderRadius: 11, flex: 'none', display: 'grid', placeItems: 'center', background: item.read ? '#F1F5F9' : '#DDF3EF', color: '#0F766E' }}><IconFor type={item.type} /></span>
                  <span style={{ minWidth: 0, flex: 1 }}><span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, fontWeight: 800 }}>{item.title}{!item.read && <i style={{ width: 7, height: 7, borderRadius: 9, background: '#0F766E', marginTop: 4, flex: 'none' }} />}</span><span style={{ display: 'block', marginTop: 4, color: '#64748B', fontSize: 11, lineHeight: 1.5 }}>{item.message}</span><span style={{ display: 'block', marginTop: 6, color: '#94A3B8', fontSize: 10 }}>{timeLabel(item.createdAt)}</span></span>
                </button>
              )) : <div style={{ padding: '28px 22px', textAlign: 'center' }}><div style={{ width: 44, height: 44, margin: '0 auto 10px', borderRadius: 14, background: '#E6F4F2', color: '#0F766E', display: 'grid', placeItems: 'center' }}><Bell size={20} /></div><strong style={{ fontSize: 12 }}>Belum ada notifikasi</strong><p style={{ margin: '5px 0 12px', color: '#64748B', fontSize: 11, lineHeight: 1.5 }}>{isDriver ? 'Info pesanan baru dan perubahan tugas akan muncul di sini.' : 'Update status pesananmu akan muncul di sini.'}</p><button type="button" onClick={() => refresh(true)} style={{ border: 0, borderRadius: 99, padding: '8px 13px', background: '#E6F4F2', color: '#0F766E', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Periksa sekarang</button></div>}
            </div>
            {items.length > 0 && <div style={{ padding: '9px 14px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#94A3B8', fontSize: 10 }}>Pembaruan otomatis setiap 12 detik</span><button type="button" onClick={clearAll} style={{ border: 0, background: 'transparent', color: '#B91C1C', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Hapus semua</button></div>}
          </section>
        </>, document.body
      )}
    </>
  );
}
