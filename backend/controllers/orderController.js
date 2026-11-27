import supabase from '../config/supabase.js';
import { checkDriverEligibility } from '../utils/driverEligibility.js';
import {
  CUSTOMER_CANCELLABLE_STATUSES,
  canCustomerCancelOrder,
} from '../utils/orderCancellation.js';

const ORDER_SELECT_QUERY = `
  *,
  customer:users!customer_id(id, nama, nim, no_wa),
  driver:users!driver_id(id, nama, nim, no_wa, jenis_kendaraan, plat_nomor, kapasitas_penumpang, is_online)
`;

const MAX_ACTIVE_ORDERS_PER_CUSTOMER = 3;
const PENDING_EXPIRE_MINUTES = 30;
const JADWAL_EXPIRE_MINUTES = 30;
const MAX_PENUMPANG = 8;
const MIN_ONGKIR = 2000;
const MAX_ONGKIR = 1000000;
const ACTIVE_STATUSES = ['pending', 'accepted', 'on_progress'];

const hasValue = (v) => v !== undefined && v !== null && String(v).trim() !== '';

// Driver tidak boleh melihat kontak pemesan sebelum order diterima
const hideCustomerContact = (order, user) => {
  if (user.role === 'driver' && order.status === 'pending' && order.customer) {
    return {
      ...order,
      customer: { ...order.customer, nim: null, no_wa: null },
    };
  }
  return order;
};

// POST /api/orders (Customer membuat pesanan baru)
export const createOrder = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Hanya akun dengan role Customer yang dapat membuat pesanan.',
      });
    }

    const {
      jenis_layanan,
      titik_jemput,
      titik_antar,
      catatan,
      ongkir,
      jenis_kendaraan,
      jumlah_penumpang,
      waktu_berangkat,
      jadwal_at,
      nama_barang,
      perkiraan_harga_barang,
    } = req.body;

    if (
      !jenis_layanan ||
      typeof titik_jemput !== 'string' ||
      typeof titik_antar !== 'string' ||
      titik_jemput.trim() === '' ||
      titik_antar.trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        message: 'Jenis layanan, titik jemput, dan titik antar wajib diisi.',
      });
    }

    if (!['anjem', 'jastip'].includes(jenis_layanan)) {
      return res.status(400).json({
        success: false,
        message: 'Jenis layanan harus berupa "anjem" atau "jastip".',
      });
    }

    if (titik_jemput.trim().length > 200 || titik_antar.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Titik jemput/antar maksimal 200 karakter.',
      });
    }

    if (typeof catatan === 'string' && catatan.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Catatan maksimal 500 karakter.',
      });
    }

    // Jenis kendaraan (opsional)
    let cleanJenisKendaraan = null;
    if (hasValue(jenis_kendaraan)) {
      const normalizedVehicle = String(jenis_kendaraan).trim().toLowerCase();
      if (!['motor', 'mobil'].includes(normalizedVehicle)) {
        return res.status(400).json({
          success: false,
          message: 'Jenis kendaraan harus berupa "motor" atau "mobil".',
        });
      }
      cleanJenisKendaraan = normalizedVehicle;
    }

    // Jumlah penumpang: hanya relevan untuk AnJem (JasTip tidak mengirimnya)
    let cleanJumlahPenumpang = null;
    if (jenis_layanan === 'anjem') {
      if (hasValue(jumlah_penumpang)) {
        const parsedPenumpang = Number(jumlah_penumpang);
        if (!Number.isInteger(parsedPenumpang) || parsedPenumpang < 1) {
          return res.status(400).json({
            success: false,
            message: 'Jumlah penumpang harus berupa angka minimal 1.',
          });
        }
        cleanJumlahPenumpang = parsedPenumpang;
      } else {
        cleanJumlahPenumpang = 1;
      }

      if (cleanJenisKendaraan === 'motor' && cleanJumlahPenumpang > 1) {
        return res.status(400).json({
          success: false,
          message: 'Motor hanya dapat mengangkut 1 penumpang.',
        });
      }

      if (cleanJumlahPenumpang > MAX_PENUMPANG) {
        return res.status(400).json({
          success: false,
          message: `Jumlah penumpang maksimal ${MAX_PENUMPANG} orang.`,
        });
      }
    }

    // Waktu berangkat
    let cleanWaktuBerangkat = null;
    if (hasValue(waktu_berangkat)) {
      const normalizedWaktu = String(waktu_berangkat).trim().toLowerCase();
      if (!['sekarang', 'jadwal'].includes(normalizedWaktu)) {
        return res.status(400).json({
          success: false,
          message: 'Waktu berangkat harus berupa "sekarang" atau "jadwal".',
        });
      }
      cleanWaktuBerangkat = normalizedWaktu;
    }

    let cleanJadwalAt = null;
    if (hasValue(jadwal_at)) {
      const parsedDate = Date.parse(jadwal_at);
      if (Number.isNaN(parsedDate)) {
        return res.status(400).json({
          success: false,
          message: 'Format waktu jadwal_at tidak valid.',
        });
      }
      cleanJadwalAt = new Date(parsedDate).toISOString();
    }

    if (cleanWaktuBerangkat === 'jadwal') {
      if (!cleanJadwalAt || Date.parse(cleanJadwalAt) < Date.now() - 60 * 1000) {
        return res.status(400).json({
          success: false,
          message: 'Waktu jadwal harus diisi dan tidak boleh di masa lalu.',
        });
      }
    }

    const cleanNamaBarang = hasValue(nama_barang) ? String(nama_barang).trim() : null;

    let cleanPerkiraanHargaBarang = null;
    if (hasValue(perkiraan_harga_barang)) {
      const parsedHargaBarang = Number(perkiraan_harga_barang);
      if (Number.isNaN(parsedHargaBarang) || parsedHargaBarang < 0) {
        return res.status(400).json({
          success: false,
          message: 'Perkiraan harga barang tidak valid.',
        });
      }
      cleanPerkiraanHargaBarang = parsedHargaBarang;
    }

    // Ongkir wajib valid (tidak lagi diam-diam jadi 5000)
    const parsedOngkir = Number(ongkir);
    if (
      !Number.isInteger(parsedOngkir) ||
      parsedOngkir < MIN_ONGKIR ||
      parsedOngkir > MAX_ONGKIR
    ) {
      return res.status(400).json({
        success: false,
        message: `Ongkir harus berupa angka bulat antara Rp ${MIN_ONGKIR.toLocaleString('id-ID')} dan Rp ${MAX_ONGKIR.toLocaleString('id-ID')}.`,
      });
    }

    // Batasi jumlah order aktif per pemesan (anti spam)
    const { count: activeCount, error: countError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', req.user.id)
      .in('status', ACTIVE_STATUSES);

    if (countError) throw countError;

    if ((activeCount || 0) >= MAX_ACTIVE_ORDERS_PER_CUSTOMER) {
      return res.status(400).json({
        success: false,
        message: `Maksimal ${MAX_ACTIVE_ORDERS_PER_CUSTOMER} pesanan aktif sekaligus. Selesaikan atau batalkan pesanan lain dulu.`,
      });
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          customer_id: req.user.id,
          jenis_layanan,
          titik_jemput: titik_jemput.trim(),
          titik_antar: titik_antar.trim(),
          catatan: typeof catatan === 'string' ? catatan.trim() : '',
          ongkir: parsedOngkir,
          status: 'pending',
          jenis_kendaraan: cleanJenisKendaraan,
          jumlah_penumpang: cleanJumlahPenumpang,
          waktu_berangkat: cleanWaktuBerangkat,
          jadwal_at: cleanJadwalAt,
          nama_barang: cleanNamaBarang,
          perkiraan_harga_barang: cleanPerkiraanHargaBarang,
        },
      ])
      .select(ORDER_SELECT_QUERY)
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat! Menunggu driver mengambil order.',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat pesanan.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// GET /api/orders (Customer melihat pesanannya; Driver melihat order pending + order miliknya)
export const getOrders = async (req, res) => {
  try {
    // Order pending "Sekarang" yang tidak diambil siapa pun otomatis kedaluwarsa
    try {
      const cutoff = new Date(
        Date.now() - PENDING_EXPIRE_MINUTES * 60 * 1000
      ).toISOString();
      await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('status', 'pending')
        .lt('created_at', cutoff)
        .or('waktu_berangkat.is.null,waktu_berangkat.neq.jadwal');

      // Order "Jadwal" kedaluwarsa bila waktunya sudah lewat > 30 menit dan belum diambil
      const jadwalCutoff = new Date(
        Date.now() - JADWAL_EXPIRE_MINUTES * 60 * 1000
      ).toISOString();
      await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('status', 'pending')
        .eq('waktu_berangkat', 'jadwal')
        .lt('jadwal_at', jadwalCutoff);
    } catch {
      // Kegagalan housekeeping tidak boleh menggagalkan daftar order
    }

    let query = supabase
      .from('orders')
      .select(ORDER_SELECT_QUERY)
      .order('created_at', { ascending: false });

    if (req.user.role === 'customer') {
      query = query.eq('customer_id', req.user.id);
    } else if (req.user.role === 'driver') {
      query = query.or(`status.eq.pending,driver_id.eq.${req.user.id}`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: (data || []).map((order) => hideCustomerContact(order, req.user)),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar pesanan.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// PATCH /api/orders/:id/accept (Driver mengambil pesanan pending)
export const acceptOrder = async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Hanya akun dengan role Driver yang dapat mengambil pesanan.',
      });
    }

    const { id } = req.params;

    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('id, status, driver_id, jenis_layanan, jenis_kendaraan, jumlah_penumpang')
      .eq('id', id)
      .maybeSingle();

    if (findError) throw findError;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan.',
      });
    }

    if (order.status !== 'pending' || order.driver_id) {
      return res.status(409).json({
        success: false,
        message: 'Pesanan ini sudah diambil oleh driver lain atau tidak lagi tersedia.',
      });
    }

    // Validasi: online, kendaraan lengkap & cocok, kapasitas cukup, tidak ada trip aktif
    const eligibility = await checkDriverEligibility(req.user.id, order);
    if (!eligibility.ok) {
      return res.status(eligibility.status).json({
        success: false,
        message: eligibility.message,
      });
    }

    // Update bersyarat untuk mencegah race condition antar driver
    const { data, error } = await supabase
      .from('orders')
      .update({
        driver_id: req.user.id,
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending')
      .is('driver_id', null)
      .select(ORDER_SELECT_QUERY)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(409).json({
        success: false,
        message: 'Pesanan ini sudah diambil oleh driver lain atau tidak lagi tersedia.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Pesanan berhasil diambil! Segera hubungi customer via WhatsApp.',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil pesanan.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};


// POST /api/orders/:id/cancel (Customer membatalkan pesanan miliknya)
// Pembatalan sepihak hanya diizinkan sebelum perjalanan dimulai: pending / accepted.
export const cancelOrder = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Hanya customer pemilik pesanan yang dapat menggunakan pembatalan ini.',
      });
    }

    const { id } = req.params;
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('customer_id', req.user.id)
      .in('status', CUSTOMER_CANCELLABLE_STATUSES)
      .select(ORDER_SELECT_QUERY)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const { data: existingOrder, error: lookupError } = await supabase
        .from('orders')
        .select('id, customer_id, status')
        .eq('id', id)
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (!existingOrder || existingOrder.customer_id !== req.user.id) {
        return res.status(404).json({
          success: false,
          message: 'Pesanan tidak ditemukan.',
        });
      }

      const canStillCancel = canCustomerCancelOrder(req.user, existingOrder);
      return res.status(409).json({
        success: false,
        message: existingOrder.status === 'cancelled'
          ? 'Pesanan ini sudah dibatalkan.'
          : canStillCancel
            ? 'Status pesanan berubah. Muat ulang lalu coba lagi.'
            : 'Pesanan tidak dapat dibatalkan karena perjalanan sudah dimulai atau pesanan sudah selesai.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Pesanan berhasil dibatalkan. Driver akan melihat perubahan status pesanan.',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal membatalkan pesanan.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// PATCH /api/orders/:id/status (Update status perjalanan / pembatalan)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['on_progress', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid. Pilihan: on_progress, completed, cancelled.',
      });
    }

    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findError) throw findError;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan.',
      });
    }

    const ALLOWED_TRANSITIONS = {
      accepted: ['on_progress', 'cancelled'],
      on_progress: ['completed', 'cancelled'],
      pending: ['cancelled'],
    };

    if (!(ALLOWED_TRANSITIONS[order.status] || []).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Pesanan berstatus "${order.status}" tidak dapat diubah menjadi "${status}".`,
      });
    }

    if (status === 'cancelled') {
      // Pembatalan dari customer wajib melalui endpoint khusus yang mengunci customer_id.
      const isAssignedDriver =
        req.user.role === 'driver' && order.driver_id === req.user.id;

      if (!isAssignedDriver) {
        return res.status(403).json({
          success: false,
          message: 'Customer harus menggunakan alur pembatalan pesanan. Driver hanya dapat membatalkan pesanan yang ditugaskan kepadanya.',
        });
      }
    } else if (req.user.role !== 'driver' || order.driver_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda bukan driver yang bertugas untuk pesanan ini.',
      });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', order.status)
      .select(ORDER_SELECT_QUERY)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(409).json({
        success: false,
        message: 'Status pesanan baru saja berubah. Muat ulang lalu coba lagi.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Status pesanan diperbarui menjadi "${status}".`,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status pesanan.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// DELETE /api/orders/:id (Customer menghapus riwayat pesanan yang pending/cancelled)
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('id, customer_id, status')
      .eq('id', id)
      .maybeSingle();

    if (findError) throw findError;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan.',
      });
    }

    if (order.customer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak berhak menghapus pesanan ini.',
      });
    }

    if (!['pending', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Pesanan yang sedang berjalan atau sudah selesai tidak dapat dihapus.',
      });
    }

    const { error } = await supabase.from('orders').delete().eq('id', id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Pesanan berhasil dihapus.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus pesanan.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};