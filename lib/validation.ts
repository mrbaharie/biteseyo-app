// Kumpulan fungsi validasi dipakai di form pelanggan & form owner.
// Semua fungsi mengembalikan string pesan error (bahasa Indonesia santai)
// atau null kalau valid -- supaya gampang ditampilkan langsung ke UI.

export function validateNama(v: string): string | null {
  const val = v.trim();
  if (val.length === 0) return 'Nama wajib diisi';
  if (val.length < 3) return 'Nama minimal 3 huruf';
  if (val.length > 60) return 'Nama kepanjangan, maksimal 60 karakter';
  if (!/^[A-Za-zÀ-ÿ\s.']+$/.test(val)) return 'Nama tidak boleh mengandung angka atau simbol aneh';
  return null;
}

export function validateNoWa(v: string): string | null {
  const val = v.trim();
  if (val.length === 0) return 'Nomor WhatsApp wajib diisi';
  if (!/^(\+62|62|0)8[0-9]{8,13}$/.test(val)) return 'Format nomor salah, contoh: 081234567890';
  return null;
}

export function validateAlamat(v: string, wajib: boolean): string | null {
  const val = v.trim();
  if (!wajib) return null;
  if (val.length === 0) return 'Alamat wajib diisi untuk pengiriman antar';
  if (val.length < 8) return 'Alamat terlalu singkat, tolong lengkapi';
  return null;
}

export function validateRequiredSelect(v: string, label: string): string | null {
  if (!v || v.trim().length === 0) return `${label} wajib dipilih`;
  return null;
}

export function validateHarga(v: number): string | null {
  if (v === null || v === undefined || isNaN(v)) return 'Harga wajib diisi';
  if (v < 0) return 'Harga tidak boleh negatif';
  return null;
}

export function validateQty(v: number): string | null {
  if (v === null || v === undefined || isNaN(v)) return 'Jumlah wajib diisi';
  if (v <= 0) return 'Jumlah harus lebih dari 0';
  return null;
}

export function validateTeksWajib(v: string, label: string, min = 1, max = 200): string | null {
  const val = (v || '').trim();
  if (val.length < min) return `${label} wajib diisi`;
  if (val.length > max) return `${label} maksimal ${max} karakter`;
  return null;
}

export function validatePersen(v: number): string | null {
  if (v === null || v === undefined || isNaN(v)) return 'Persentase wajib diisi';
  if (v < 0 || v > 100) return 'Persentase harus di antara 0-100';
  return null;
}

// Mengubah nomor WA pelanggan (0812xxx / +62812xxx / 62812xxx) ke format
// internasional tanpa simbol, siap dipakai di link wa.me/<nomor>
export function formatNoWaLink(v: string | null | undefined): string | null {
  if (!v) return null;
  const digits = v.trim().replace(/[^0-9]/g, '');
  if (digits.length === 0) return null;
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return '62' + digits;
}

export function validateFotoProduk(file: File | null): string | null {
  if (!file) return null; // foto opsional
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) return 'Foto harus format JPG, PNG, atau WEBP';
  if (file.size > 2 * 1024 * 1024) return 'Ukuran foto maksimal 2MB';
  return null;
}

export function rupiah(n: number): string {
  return 'Rp' + Math.round(n).toLocaleString('id-ID');
}
