import supabase from '../config/supabase.js';

const USER_PUBLIC_FIELDS =
  'id, nama, nim, email, no_wa, role, jenis_kendaraan, plat_nomor, kapasitas_penumpang, is_online, created_at';

// PATCH /api/driver/status
export const updateDriverStatus = async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Hanya akun Driver yang dapat mengubah status online.',
      });
    }

    const { is_online } = req.body;
    if (typeof is_online !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Field is_online harus berupa boolean (true/false).',
      });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ is_online })
      .eq('id', req.user.id)
      .select(USER_PUBLIC_FIELDS)
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: is_online ? 'Status driver aktif (ON).' : 'Status driver nonaktif (OFF).',
      user: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah status driver.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// PATCH /api/driver/vehicle
export const updateDriverVehicle = async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Hanya akun Driver yang dapat memperbarui data kendaraan.',
      });
    }

    const { jenis_kendaraan, plat_nomor, kapasitas_penumpang } = req.body;

    const normalizedVehicle = String(jenis_kendaraan || '').trim().toLowerCase();
    if (!['motor', 'mobil'].includes(normalizedVehicle)) {
      return res.status(400).json({
        success: false,
        message: 'Jenis kendaraan harus berupa "motor" atau "mobil".',
      });
    }

    const cleanPlat = String(plat_nomor || '').trim().toUpperCase();
    if (!cleanPlat) {
      return res.status(400).json({
        success: false,
        message: 'Plat nomor wajib diisi.',
      });
    }

    let cleanKapasitas = 1;
    if (normalizedVehicle === 'mobil') {
      const parsed = Number(kapasitas_penumpang);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
        return res.status(400).json({
          success: false,
          message: 'Kapasitas penumpang mobil harus antara 1 hingga 10 orang.',
        });
      }
      cleanKapasitas = parsed;
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        jenis_kendaraan: normalizedVehicle,
        plat_nomor: cleanPlat,
        kapasitas_penumpang: cleanKapasitas,
      })
      .eq('id', req.user.id)
      .select(USER_PUBLIC_FIELDS)
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Data kendaraan driver berhasil diperbarui.',
      user: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data kendaraan.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

