import supabase from '../config/supabase.js';

const ORDER_SELECT_QUERY = `
  *,
  customer:users!customer_id(id, nama, nim, no_wa),
  driver:users!driver_id(id, nama, nim, no_wa, jenis_kendaraan, plat_nomor, kapasitas_penumpang, is_online)
`;

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
      [titik_jemput, titik_antar].some(
        (v) => typeof v !== 'string' || v.trim() === ''
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Jenis layanan, titik jemput, dan titik antar wajib diisi.',
      });
    }

    if (!jenis_layanan) {
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

    // Validasi kolom tambahan opsional (aman untuk payload lama)
    let cleanJenisKendaraan = null;
    if (
      jenis_kendaraan !== undefined &&
      jenis_kendaraan !== null &&
      String(jenis_kendaraan).trim() !== ''
    ) {
      const normalizedVehicle = String(jenis_kendaraan).trim().toLowerCase();
      if (!['motor', 'mobil'].includes(normalizedVehicle)) {
        return res.status(400).json({
          success: false,
          message: 'Jenis kendaraan harus berupa "motor" atau "mobil".',
        });
      }
      cleanJenisKendaraan = normalizedVehicle;
    }

    let cleanJumlahPenumpang = null;
    if (
      jumlah_penumpang !== undefined &&
      jumlah_penumpang !== null &&
      jumlah_penumpang !== ''
    )
    
    if (cleanJenisKendaraan === 'motor' && (cleanJumlahPenumpang || 1) > 1) {
    return res.status(400).json({
    success: false,
    message: 'Motor hanya dapat mengangkut 1 penumpang.',
    });
}
    
    {
      const parsedPenumpang = Number(jumlah_penumpang);
      if (!Number.isInteger(parsedPenumpang) || parsedPenumpang < 1) {
        return res.status(400).json({
          success: false,
          message: 'Jumlah penumpang harus berupa angka minimal 1.',
        });
      }
      cleanJumlahPenumpang = parsedPenumpang;
    }

    let cleanWaktuBerangkat = null;
    if (
      waktu_berangkat !== undefined &&
      waktu_berangkat !== null &&
      String(waktu_berangkat).trim() !== ''
    ) {
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
    if (
      jadwal_at !== undefined &&
      jadwal_at !== null &&
      String(jadwal_at).trim() !== ''
    ) {
      const parsedDate = Date.parse(jadwal_at);
      if (Number.isNaN(parsedDate)) {
        return res.status(400).json({
          success: false,
          message: 'Format waktu jadwal_at tidak valid.',
        });
      }
      cleanJadwalAt = new Date(parsedDate).toISOString();
    }

    const cleanNamaBarang =
      nama_barang !== undefined &&
      nama_barang !== null &&
      String(nama_barang).trim() !== ''
        ? String(nama_barang).trim()
        : null;

    let cleanPerkiraanHargaBarang = null;
    if (
      perkiraan_harga_barang !== undefined &&
      perkiraan_harga_barang !== null &&
      perkiraan_harga_barang !== ''
    ) {
      const parsedHargaBarang = Number(perkiraan_harga_barang);
      if (Number.isNaN(parsedHargaBarang) || parsedHargaBarang < 0) {
        return res.status(400).json({
          success: false,
          message: 'Perkiraan harga barang tidak valid.',
        });
      }
      cleanPerkiraanHargaBarang = parsedHargaBarang;
    }

    const parsedOngkir = Number(ongkir) > 0 ? Number(ongkir) : 5000;

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
      data,
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

    // Update bersyarat: hanya berhasil bila order MASIH pending & belum punya driver.
    // Ini mencegah race condition ketika dua driver menekan "Ambil" bersamaan.
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

    // Alur status yang sah (status akhir tidak boleh diubah lagi)
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

    // Validasi hak akses berdasarkan role
    if (status === 'cancelled') {
      const isOwnerCustomer = order.customer_id === req.user.id && order.status === 'pending';
      const isAssignedDriver = order.driver_id === req.user.id;

      if (!isOwnerCustomer && !isAssignedDriver) {
        return res.status(403).json({
          success: false,
          message: 'Pesanan tidak dapat dibatalkan pada tahap ini.',
        });
      }
    } else if (order.driver_id !== req.user.id) {
      // on_progress & completed hanya boleh dilakukan driver yang mengambil order
      return res.status(403).json({
        success: false,
        message: 'Anda bukan driver yang bertugas untuk pesanan ini.',
      });
    }

    // Update bersyarat: status harus masih sama seperti saat dibaca di atas
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

