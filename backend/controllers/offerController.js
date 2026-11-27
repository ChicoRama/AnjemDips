import supabase from '../config/supabase.js';
import { checkDriverEligibility } from '../utils/driverEligibility.js';

const OFFER_SELECT_QUERY = `
  *,
  driver:users!driver_id(id, nama, nim, no_wa, jenis_kendaraan, plat_nomor, kapasitas_penumpang, is_online)
`;

const ORDER_SELECT_QUERY = `
  *,
  customer:users!customer_id(id, nama, nim, no_wa),
  driver:users!driver_id(id, nama, nim, no_wa, jenis_kendaraan, plat_nomor, kapasitas_penumpang, is_online)
`;

const MIN_PRICE = 2000;
const MAX_PRICE = 1000000;
const MAX_PENUMPANG = 8;
const MAX_NOTE_LENGTH = 200;

const ORDER_FOR_OFFER_FIELDS =
  'id, customer_id, status, jenis_layanan, jenis_kendaraan, jumlah_penumpang';

// Kontak driver baru terlihat setelah tawaran disepakati
// (sama seperti kontak pemesan yang disembunyikan dari driver sebelum order diterima)
const sanitizeOffer = (offer) => {
  if (!offer || !offer.driver || offer.status === 'accepted') return offer;
  return {
    ...offer,
    driver: { ...offer.driver, nim: null, no_wa: null },
  };
};

// GET /api/orders/:id/offers
export const getOrderOffers = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, customer_id, driver_id, status')
      .eq('id', id)
      .maybeSingle();

    if (orderError) throw orderError;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan.',
      });
    }

    if (
      req.user.role === 'customer' &&
      order.customer_id !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak berhak melihat tawaran untuk pesanan ini.',
      });
    }

    let query = supabase
      .from('offers')
      .select(OFFER_SELECT_QUERY)
      .eq('order_id', id)
      .order('created_at', { ascending: false });

    if (req.user.role === 'driver') {
      query = query.eq('driver_id', req.user.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: (data || []).map(sanitizeOffer),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar tawaran.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// POST /api/orders/:id/offers
export const createOrderOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { offered_price, driver_id, adjusted_passengers, note } = req.body;

    const parsedPrice = Number(offered_price);
    if (
      !Number.isInteger(parsedPrice) ||
      parsedPrice < MIN_PRICE ||
      parsedPrice > MAX_PRICE
    ) {
      return res.status(400).json({
        success: false,
        message: `Nominal tawaran harus berupa angka bulat antara Rp ${MIN_PRICE.toLocaleString('id-ID')} dan Rp ${MAX_PRICE.toLocaleString('id-ID')}.`,
      });
    }

    const cleanNote = note ? String(note).trim() : '';
    if (cleanNote.length > MAX_NOTE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Catatan maksimal ${MAX_NOTE_LENGTH} karakter.`,
      });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(ORDER_FOR_OFFER_FIELDS)
      .eq('id', id)
      .maybeSingle();

    if (orderError) throw orderError;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan.',
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Negosiasi hanya dapat dilakukan pada pesanan yang masih menunggu driver.',
      });
    }

    const isDriver = req.user.role === 'driver';
    const offeredBy = isDriver ? 'driver' : 'customer';
    let targetDriverId = null;
    let cleanPassengers = null;

    // Penyesuaian jumlah penumpang hanya boleh dari pemesan, dan hanya untuk AnJem
    if (
      !isDriver &&
      order.jenis_layanan === 'anjem' &&
      adjusted_passengers !== undefined &&
      adjusted_passengers !== null &&
      adjusted_passengers !== ''
    ) {
      const parsedPax = Number(adjusted_passengers);
      if (
        !Number.isInteger(parsedPax) ||
        parsedPax < 1 ||
        parsedPax > MAX_PENUMPANG
      ) {
        return res.status(400).json({
          success: false,
          message: `Jumlah penumpang harus antara 1 hingga ${MAX_PENUMPANG} orang.`,
        });
      }
      cleanPassengers = parsedPax;
    }

    if (isDriver) {
      targetDriverId = req.user.id;

      // Driver wajib ON, punya data kendaraan, dan kendaraannya cocok.
      // Kapasitas & trip aktif baru dicek saat tawaran disepakati.
      const eligibility = await checkDriverEligibility(targetDriverId, order, {
        skipCapacity: true,
        skipActiveTrip: true,
      });
      if (!eligibility.ok) {
        return res.status(eligibility.status).json({
          success: false,
          message: eligibility.message,
        });
      }
    } else {
      if (order.customer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Anda bukan pembuat pesanan ini.',
        });
      }

      targetDriverId = driver_id;
      if (!targetDriverId || typeof targetDriverId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'driver_id wajib disertakan saat pemesan menawar balik.',
        });
      }

      // Pemesan hanya boleh menawar balik ke driver yang sudah menawar lebih dulu
      const { data: driverOffer, error: driverOfferError } = await supabase
        .from('offers')
        .select('id')
        .eq('order_id', id)
        .eq('driver_id', targetDriverId)
        .eq('offered_by', 'driver')
        .limit(1);

      if (driverOfferError) throw driverOfferError;

      if (!driverOffer || driverOffer.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Driver ini belum mengirim tawaran untuk pesananmu.',
        });
      }

      const eligibility = await checkDriverEligibility(targetDriverId, order, {
        passengers: cleanPassengers ?? order.jumlah_penumpang,
        skipActiveTrip: true,
      });
      if (!eligibility.ok) {
        return res.status(eligibility.status).json({
          success: false,
          message: eligibility.message,
        });
      }
    }

    const { data: createdOffer, error: insertError } = await supabase
      .from('offers')
      .insert([
        {
          order_id: id,
          driver_id: targetDriverId,
          offered_by: offeredBy,
          offered_price: parsedPrice,
          adjusted_passengers: cleanPassengers,
          note: cleanNote || null,
          status: 'pending',
        },
      ])
      .select(OFFER_SELECT_QUERY)
      .single();

    if (insertError) throw insertError;

    // Tandai tawaran pending sebelumnya (selain yang baru) sebagai superseded
    await supabase
      .from('offers')
      .update({
        status: 'superseded',
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', id)
      .eq('driver_id', targetDriverId)
      .eq('status', 'pending')
      .neq('id', createdOffer.id);

    // Catatan: tabel orders TIDAK diubah saat tawar-menawar.
    // Harga & jumlah penumpang final baru diterapkan ketika tawaran disepakati (accept).

    return res.status(201).json({
      success: true,
      message: 'Penawaran harga berhasil dikirim.',
      data: sanitizeOffer(createdOffer),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengirim penawaran harga.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// PATCH /api/orders/:id/offers/:offerId/accept
export const acceptOrderOffer = async (req, res) => {
  try {
    const { id, offerId } = req.params;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(ORDER_FOR_OFFER_FIELDS)
      .eq('id', id)
      .maybeSingle();

    if (orderError) throw orderError;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan.',
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Pesanan ini sudah diproses atau tidak lagi tersedia.',
      });
    }

    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .eq('order_id', id)
      .maybeSingle();

    if (offerError) throw offerError;

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Tawaran tidak ditemukan.',
      });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Tawaran ini sudah tidak berlaku (sudah diproses atau digantikan).',
      });
    }

    // Validasi: pihak yang menyetujui harus lawan dari pembuat tawaran
    if (offer.offered_by === 'driver' && order.customer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Hanya pemesan yang dapat menyetujui tawaran driver.',
      });
    }

    if (offer.offered_by === 'customer' && offer.driver_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Hanya driver terkait yang dapat menyetujui tawaran pemesan.',
      });
    }

    const finalPassengers =
      order.jenis_layanan === 'anjem'
        ? offer.adjusted_passengers || order.jumlah_penumpang
        : order.jumlah_penumpang;

    // Driver harus masih memenuhi syarat: ON, kendaraan cocok & muat, tidak ada trip aktif
    const eligibility = await checkDriverEligibility(offer.driver_id, order, {
      passengers: finalPassengers,
    });
    if (!eligibility.ok) {
      const isDriverSelf = req.user.id === offer.driver_id;
      return res.status(eligibility.status).json({
        success: false,
        message: isDriverSelf
          ? eligibility.message
          : 'Driver ini sedang tidak dapat menerima order (offline, kendaraan tidak sesuai, atau sedang menjalankan trip lain). Coba tawaran lain.',
      });
    }

    // Proses penerimaan dijalankan dalam satu transaksi PostgreSQL melalui RPC.
    // RPC mengunci baris order dan memperbarui order + seluruh status offer secara atomik.
    const { data: acceptance, error: acceptanceError } = await supabase.rpc(
      'accept_order_offer_atomic',
      {
        p_order_id: id,
        p_offer_id: offerId,
        p_actor_id: req.user.id,
      }
    );

    if (acceptanceError) throw acceptanceError;

    if (!acceptance?.success) {
      return res.status(acceptance?.status || 409).json({
        success: false,
        message: acceptance?.message || 'Pesanan atau tawaran sudah berubah. Muat ulang lalu coba lagi.',
      });
    }

    // Ambil ulang relasi customer/driver agar bentuk respons tetap sama seperti API sebelumnya.
    const { data: updatedOrder, error: fetchUpdatedOrderError } = await supabase
      .from('orders')
      .select(ORDER_SELECT_QUERY)
      .eq('id', id)
      .single();

    if (fetchUpdatedOrderError) throw fetchUpdatedOrderError;

    return res.status(200).json({
      success: true,
      message: 'Tawaran disepakati! Pesanan kini aktif.',
      data: updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal menyetujui tawaran.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// PATCH /api/orders/:id/offers/:offerId/reject
export const rejectOrderOffer = async (req, res) => {
  try {
    const { id, offerId } = req.params;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, customer_id, status')
      .eq('id', id)
      .maybeSingle();

    if (orderError) throw orderError;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan.',
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Pesanan ini sudah diproses atau tidak lagi tersedia.',
      });
    }

    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('id, order_id, driver_id, offered_by, status')
      .eq('id', offerId)
      .eq('order_id', id)
      .maybeSingle();

    if (offerError) throw offerError;

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Tawaran tidak ditemukan.',
      });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Tawaran ini sudah tidak berlaku (sudah diproses atau digantikan).',
      });
    }

    // Yang boleh menolak adalah lawan dari pembuat tawaran
    const isAllowed =
      (offer.offered_by === 'driver' && order.customer_id === req.user.id) ||
      (offer.offered_by === 'customer' && offer.driver_id === req.user.id);

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak berhak menolak tawaran ini.',
      });
    }

    const { data: rejected, error: rejectError } = await supabase
      .from('offers')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', offerId)
      .eq('status', 'pending')
      .select(OFFER_SELECT_QUERY)
      .maybeSingle();

    if (rejectError) throw rejectError;

    if (!rejected) {
      return res.status(409).json({
        success: false,
        message: 'Tawaran ini baru saja berubah. Muat ulang lalu coba lagi.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Tawaran ditolak.',
      data: sanitizeOffer(rejected),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal menolak tawaran.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};
