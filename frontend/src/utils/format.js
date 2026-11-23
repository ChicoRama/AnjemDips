// Helper format bersama untuk halaman pemesan & driver.

export const MAX_PENUMPANG_MOBIL = 8;

export function formatRibuan(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('id-ID');
}

export function formatWaUrl(phone, text) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = `62${cleaned.slice(1)}`;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

// Contoh hasil: "Sen, 24 Nov · 19:30"
export function formatJadwal(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const tanggal = date.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const jam = date
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace('.', ':');

  return `${tanggal} · ${jam}`;
}

// "Sekarang" atau "Jadwal Sen, 24 Nov · 19:30"
export function waktuLabel(order) {
  if (order?.waktu_berangkat === 'jadwal') {
    const jadwal = formatJadwal(order.jadwal_at);
    return jadwal ? `Jadwal ${jadwal}` : 'Jadwal';
  }
  return 'Sekarang';
}
