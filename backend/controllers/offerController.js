import supabase from '../config/supabase.js';

const OFFER_SELECT_QUERY = `
  *,
  driver:users!driver_id(id, nama, nim, no_wa, jenis_kendaraan, plat_nomor, kapasitas_penumpang, is_online)
`;

const ORDER_SELECT_QUERY = `
  *,
  customer:users!customer_id(id, nama, nim, no_wa),
  driver:users!driver_id(id, nama, nim, no_wa, jenis_kendaraan, plat_nomor, kapasitas_penumpang, is_online)
`;

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
      data: data || [],
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
    if (!parsedPrice || parsedPrice < 2000) {
      return res.status(400).json({
        success: false,
        message: 'Nominal tawaran minimal Rp 2.000.',
      });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, customer_id, status, jumlah_penumpang')
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

    let targetDriverId = null;
    let offeredBy = req.user.role === 'driver' ? 'driver' : 'customer';

    if (req.user.role === 'driver') {
      targetDriverId = req.user.id;
    } else {
      if (order.customer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Anda bukan pembuat pesanan ini.',
        });
      }
      targetDriverId = driver_id;
      if (!targetDriverId) {
        return res.status(400).json({
          success: false,
          message: 'driver_id wajib disertakan saat pemesan menawar balik.',
        });
      }

      // Pastikan driver tujuan benar-benar ada dan berperan sebagai driver
      const { data: targetDriver, error: targetDriverError } = await supabase
        .from('users')
        .select('id')
        .eq('id', targetDriverId)
        .eq('role', 'driver')
        .maybeSingle();

      if (targetDriverError) throw targetDriverError;

      if (!targetDriver) {
        return res.status(404).json({
          success: false,
          message: 'Driver tujuan tidak ditemukan.',
        });
      }
    }

    let cleanPassengers = null;
    if (
      adjusted_passengers !== undefined &&
      adjusted_passengers !== null &&
      adjusted_passengers !== ''
    ) {
      const parsedPax = Number(adjusted_passengers);
      if (!Number.isInteger(parsedPax) || parsedPax < 1) {
        return res.status(400).json({
          success: false,
          message: 'Jumlah penumpang tidak valid.',
        });
      }
      cleanPassengers = parsedPax;
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
          note: note ? String(note).trim() : null,
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

    // Jika pemesan menawar balik sekaligus menyesuaikan penumpang, perbarui juga order
    if (offeredBy === 'customer') {
      const orderPatch = {
        ongkir: parsedPrice,
        updated_at: new Date().toISOString(),
      };
      if (cleanPassengers !== null) {
        orderPatch.jumlah_penumpang = cleanPassengers;
      }
      await supabase.from('orders').update(orderPatch).eq('id', id);
    }

    return res.status(201).json({
      success: true,
      message: 'Penawaran harga berhasil dikirim.',
      data: createdOffer,
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
      .select('id, customer_id, status, jumlah_penumpang')
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

    const now = new Date().toISOString();

    // 1) Kunci order lebih dulu dengan update bersyarat (hanya jika masih pending).
    //    Bila gagal/kalah balapan, tawaran tidak ikut berubah.
    const { data: updatedOrder, error: updateOrderError } = await supabase
      .from('orders')
      .update({
        driver_id: offer.driver_id,
        ongkir: offer.offered_price,
        jumlah_penumpang:
          offer.adjusted_passengers || order.jumlah_penumpang,
        status: 'accepted',
        updated_at: now,
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select(ORDER_SELECT_QUERY)
      .maybeSingle();

    if (updateOrderError) throw updateOrderError;

    if (!updatedOrder) {
      return res.status(409).json({
        success: false,
        message: 'Pesanan ini sudah diproses atau tidak lagi tersedia.',
      });
    }

    // 2) Setujui tawaran terpilih
    const { error: acceptError } = await supabase
      .from('offers')
      .update({ status: 'accepted', updated_at: now })
      .eq('id', offerId);

    if (acceptError) throw acceptError;

    // 3) Tolak tawaran lain pada pesanan yang sama
    const { error: rejectError } = await supabase
      .from('offers')
      .update({ status: 'rejected', updated_at: now })
      .eq('order_id', id)
      .neq('id', offerId)
      .eq('status', 'pending');

    if (rejectError) throw rejectError;

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

