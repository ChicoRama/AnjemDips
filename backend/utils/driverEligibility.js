import supabase from '../config/supabase.js';

const BUSY_STATUSES = ['accepted', 'on_progress'];

const fail = (status, message) => ({ ok: false, status, message });

/**
 * Cek apakah driver boleh mengambil/menawar sebuah order.
 * options:
 *  - passengers: jumlah penumpang final (default: order.jumlah_penumpang)
 *  - skipCapacity: lewati cek kapasitas (dipakai saat driver baru menawar)
 *  - skipActiveTrip: lewati cek trip aktif (dipakai saat driver baru menawar)
 */
export async function checkDriverEligibility(driverId, order, options = {}) {
  const { passengers, skipCapacity = false, skipActiveTrip = false } = options;

  const { data: driver, error } = await supabase
    .from('users')
    .select('id, role, is_online, jenis_kendaraan, plat_nomor, kapasitas_penumpang')
    .eq('id', driverId)
    .maybeSingle();

  if (error) throw error;

  if (!driver || driver.role !== 'driver') {
    return fail(404, 'Driver tidak ditemukan.');
  }

  if (!driver.is_online) {
    return fail(400, 'Aktifkan status ON terlebih dahulu sebelum menerima atau menawar order.');
  }

  if (!driver.jenis_kendaraan || !driver.plat_nomor) {
    return fail(400, 'Lengkapi data kendaraan di halaman Profil sebelum menerima order.');
  }

  if (order.jenis_layanan === 'anjem') {
    if (order.jenis_kendaraan && order.jenis_kendaraan !== driver.jenis_kendaraan) {
      return fail(
        400,
        `Order ini meminta ${order.jenis_kendaraan}, sedangkan kendaraanmu ${driver.jenis_kendaraan}.`
      );
    }

    if (!skipCapacity) {
      const capacity =
        driver.jenis_kendaraan === 'mobil'
          ? Number(driver.kapasitas_penumpang) || 4
          : 1;
      const pax = Number(passengers ?? order.jumlah_penumpang) || 1;
      if (pax > capacity) {
        return fail(
          400,
          `Jumlah penumpang (${pax}) melebihi kapasitas kendaraan (${capacity}).`
        );
      }
    }
  }

  if (!skipActiveTrip) {
    const { data: busy, error: busyError } = await supabase
      .from('orders')
      .select('id')
      .eq('driver_id', driverId)
      .in('status', BUSY_STATUSES)
      .limit(1);

    if (busyError) throw busyError;

    if (busy && busy.length > 0) {
      return fail(400, 'Selesaikan pesanan yang sedang berjalan sebelum mengambil order baru.');
    }
  }

  return { ok: true, driver };
}