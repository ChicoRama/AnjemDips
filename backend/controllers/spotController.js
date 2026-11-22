import supabase from '../config/supabase.js';

// GET /api/spots
export const getAllSpots = async (req, res) => {
  try {
    const { kategori } = req.query;

    let query = supabase
      .from('spots')
      .select('*')
      .order('kategori', { ascending: true })
      .order('nama_lokasi', { ascending: true });

    if (kategori) {
      query = query.eq('kategori', kategori);
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
      message: 'Gagal mengambil data lokasi spots.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

