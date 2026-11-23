import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';

const USER_PUBLIC_FIELDS =
  'id, nama, nim, email, no_wa, role, jenis_kendaraan, plat_nomor, kapasitas_penumpang, is_online, created_at';

const ACTIVE_ORDER_STATUSES = ['pending', 'accepted', 'on_progress'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      nama: user.nama,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const {
      nama,
      nim,
      email,
      password,
      no_wa,
      role,
      jenis_kendaraan,
      plat_nomor,
      kapasitas_penumpang,
    } = req.body;

    if (!nama || !email || !password || !no_wa) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, password, dan nomor WhatsApp wajib diisi.',
      });
    }

    if (
      [nama, email, password, no_wa].some((v) => typeof v !== 'string') ||
      (nim !== undefined && nim !== null && typeof nim !== 'string')
    ) {
      return res.status(400).json({
        success: false,
        message: 'Format data registrasi tidak valid.',
      });
    }

    const cleanNimInput = nim ? nim.trim() : '';
    if (cleanNimInput && !/^\d{8,20}$/.test(cleanNimInput)) {
      return res.status(400).json({
        success: false,
        message: 'NIM harus berupa angka 8–20 digit.',
      });
    }

    if (!/^(\+?62|0)8\d{7,12}$/.test(no_wa.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Format nomor WhatsApp tidak valid (contoh: 081234567890).',
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal terdiri dari 6 karakter.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const validRole = role === 'driver' ? 'driver' : 'customer';

    let cleanJenisKendaraan = null;
    let cleanPlatNomor = null;
    let cleanKapasitas = null;

    if (validRole === 'driver') {
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

      if (
        plat_nomor !== undefined &&
        plat_nomor !== null &&
        String(plat_nomor).trim() !== ''
      ) {
        cleanPlatNomor = String(plat_nomor).trim().toUpperCase();
      }

      if (
        cleanJenisKendaraan === 'mobil' &&
        kapasitas_penumpang !== undefined &&
        kapasitas_penumpang !== null &&
        kapasitas_penumpang !== ''
      ) {
        const parsedKapasitas = Number(kapasitas_penumpang);
        if (!Number.isInteger(parsedKapasitas) || parsedKapasitas < 1) {
          return res.status(400).json({
            success: false,
            message: 'Kapasitas penumpang harus berupa angka minimal 1.',
          });
        }
        cleanKapasitas = parsedKapasitas;
      }

      // Motor selalu berkapasitas 1 (konsisten dengan updateDriverVehicle)
      if (cleanJenisKendaraan === 'motor') {
        cleanKapasitas = 1;
      }
    }

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'NIM sudah terdaftar. Silakan login.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          nama: nama.trim(),
          nim: cleanNimInput || null,
          email: normalizedEmail,
          password: hashedPassword,
          no_wa: no_wa.trim(),
          role: validRole,
          jenis_kendaraan: cleanJenisKendaraan,
          plat_nomor: cleanPlatNomor,
          kapasitas_penumpang: cleanKapasitas,
          is_online: false,
        },
      ])
      .select(USER_PUBLIC_FIELDS)
      .single();

    if (insertError) {
      // 23505 = unique_violation (dua registrasi bersamaan dengan NIM sama)
      if (insertError.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'NIM sudah terdaftar. Silakan login.',
        });
      }
      throw insertError;
    }

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Registrasi akun berhasil!',
      token,
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat registrasi.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi.',
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Format email atau password tidak valid.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    return res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(USER_PUBLIC_FIELDS)
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Data pengguna tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil profil pengguna.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// DELETE /api/auth/me
export const deleteMe = async (req, res) => {
  try {
    const { nim } = req.body || {};

    const { data: user, error: findUserError } = await supabase
      .from('users')
      .select('id, nim, email')
      .eq('id', req.user.id)
      .maybeSingle();

    if (findUserError) throw findUserError;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Akun pengguna tidak ditemukan.',
      });
    }

    const expected = (user.nim || user.email || '').trim().toLowerCase();
    const provided = String(nim || '').trim().toLowerCase();

    if (!expected || provided !== expected) {
      return res.status(400).json({
        success: false,
        message: 'Konfirmasi NIM/Email tidak sesuai dengan data akun.',
      });
    }

    // Pastikan tidak ada order aktif yang terikat pada akun ini
    const { data: activeOrders, error: activeError } = await supabase
      .from('orders')
      .select('id')
      .or(`customer_id.eq.${req.user.id},driver_id.eq.${req.user.id}`)
      .in('status', ACTIVE_ORDER_STATUSES)
      .limit(1);

    if (activeError) throw activeError;

    if (activeOrders && activeOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Tidak dapat menghapus akun karena masih ada pesanan yang sedang berjalan.',
      });
    }

    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', req.user.id);

    if (deleteError) throw deleteError;

    return res.status(200).json({
      success: true,
      message: 'Akun berhasil dihapus secara permanen.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus akun.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};