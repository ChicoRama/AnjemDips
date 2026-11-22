// TODO-BACKEND: Ganti seluruh mock di file ini setelah endpoint Langkah 3 tersedia
// (tabel offers + endpoint nego & DELETE /api/auth/me)

export const MOCK_DRIVER_OFFER = {
  id: 'mock-offer-1',
  driver: {
    id: 'mock-driver-1',
    nama: 'Rizky Pratama',
    jenis_kendaraan: 'mobil',
    plat_nomor: 'H 1482 UY',
    kapasitas_penumpang: 4,
    is_online: true,
    no_wa: '081234567890',
  },
  jarak_jemput: '600 m dari titik jemput',
  selisih_tawaran: 3000,
};

export const MOCK_OVER_CAPACITY_OFFER = {
  id: 'mock-offer-over-1',
  driver: {
    id: 'mock-driver-2',
    nama: 'Dimas Saputra',
    jenis_kendaraan: 'mobil',
    plat_nomor: 'H 1729 WX',
    kapasitas_penumpang: 4,
    is_online: true,
    no_wa: '081298765432',
  },
  jarak_jemput: '850 m dari titik jemput',
  jumlah_penumpang_contoh: 6,
};

export const EXTRA_PRICE_OPTIONS = [3000, 5000, 8000];
