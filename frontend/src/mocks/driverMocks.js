// Helper tampilan untuk driver. Status online, update kendaraan, tawaran harga,
// dan hapus akun kini memakai API backend langsung (lihat halaman terkait).

export const DRIVER_NEGO_INCREMENTS = [2000, 3000, 5000];

// Profil kendaraan diambil apa adanya dari data user (backend).
// Jika belum diisi, nilainya null dan `lengkap` bernilai false (tidak ada data palsu).
export function getDriverVehicleProfile(user) {
  const jenis = user?.jenis_kendaraan || null;
  const plat = user?.plat_nomor || null;

  let kapasitas = null;
  if (jenis === 'mobil') {
    kapasitas = Number(user?.kapasitas_penumpang) || 4;
  } else if (jenis === 'motor') {
    kapasitas = 1;
  }

  return {
    jenis_kendaraan: jenis,
    plat_nomor: plat,
    kapasitas_penumpang: kapasitas,
    lengkap: Boolean(jenis && plat),
  };
}
