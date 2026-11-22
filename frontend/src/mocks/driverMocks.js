// Helper tampilan untuk driver. Status online, update kendaraan, tawaran harga,
// dan hapus akun kini memakai API backend langsung (lihat halaman terkait).

export const DRIVER_NEGO_INCREMENTS = [2000, 3000, 5000];

// Profil kendaraan diambil dari data user (backend); fallback hanya untuk tampilan awal.
export function getDriverVehicleProfile(user) {
  const jenis = user?.jenis_kendaraan || 'motor';
  return {
    jenis_kendaraan: jenis,
    plat_nomor: user?.plat_nomor || 'H 1234 AB',
    kapasitas_penumpang:
      user?.kapasitas_penumpang ?? (jenis === 'mobil' ? 4 : 1),
  };
}
