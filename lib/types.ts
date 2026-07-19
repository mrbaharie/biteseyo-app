// Tipe data TypeScript yang mengikuti schema_final_kuliner.sql

export type StatusTransaksi = 'pending' | 'dikonfirmasi' | 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';
export type MetodeBayar = 'transfer' | 'qris' | 'tunai' | 'cod';
export type SumberTransaksi = 'whatsapp' | 'website' | 'walk_in' | 'marketplace' | 'lainnya';
export type MetodePengiriman = 'ambil_sendiri' | 'diantar' | 'cod_titik_temu';
export type JenisMutasiStok = 'pembelian' | 'pemakaian_produksi' | 'retur_masuk' | 'retur_keluar' | 'penyesuaian' | 'settlement_konsinyasi';
export type JenisRiwayatModal = 'setor' | 'tarik' | 'penyesuaian';

export interface KategoriProduk {
  id: number;
  nama: string;
  created_at: string;
}

export interface Produk {
  id: number;
  nama: string;
  kategori_id: number | null;
  harga_jual: number;
  satuan: string;
  aktif: boolean;
  tersedia: boolean;
  urutan: number;
  foto_url: string | null;
  deskripsi: string | null;
  created_at: string;
  updated_at: string;
  kategori_produk?: KategoriProduk | null;
}

export interface BahanBaku {
  id: number;
  nama: string;
  satuan: string;
  stok_saat_ini: number;
  stok_minimum: number;
  harga_beli_terakhir: number;
  harga_rata_rata: number;
  created_at: string;
  updated_at: string;
}

export interface Resep {
  id: number;
  produk_id: number;
  bahan_baku_id: number;
  qty_per_unit: number;
  bahan_baku?: BahanBaku;
}

export interface Pelanggan {
  id: number;
  nama: string;
  no_wa: string | null;
  alamat: string | null;
  created_at: string;
}

export interface Transaksi {
  id: number;
  no_transaksi: string;
  kode_lacak: string;
  tanggal: string;
  pelanggan_id: number | null;
  status: StatusTransaksi;
  metode_bayar: MetodeBayar | null;
  lunas: boolean;
  bukti_bayar_url: string | null;
  sumber: SumberTransaksi;
  metode_pengiriman: MetodePengiriman;
  jarak_km: number | null;
  ongkir: number;
  lokasi_cod_id: number | null;
  alamat_lat: number | null;
  alamat_lng: number | null;
  alamat_text: string | null;
  catatan: string | null;
  subtotal_produk: number;
  grand_total: number;
  hpp: number;
  laba_kotor: number;
  created_at: string;
  pelanggan?: Pelanggan | null;
  detail_transaksi?: DetailTransaksi[];
}

export interface DetailTransaksi {
  id: number;
  transaksi_id: number;
  produk_id: number;
  qty: number;
  harga_satuan: number;
  diskon_satuan: number;
  subtotal: number;
  hpp_satuan: number;
  produk?: Produk;
}

export interface MutasiStok {
  id: number;
  bahan_baku_id: number;
  tanggal: string;
  jenis: JenisMutasiStok;
  qty: number;
  harga_per_satuan: number | null;
  harga_total: number | null;
  supplier: string | null;
  keterangan: string | null;
  bahan_baku?: BahanBaku;
}

export interface Kantin {
  id: number;
  nama: string;
  alamat: string | null;
  kontak: string | null;
  persen_bagi_hasil: number;
  aktif: boolean;
}

export interface LokasiCod {
  id: number;
  nama_lokasi: string;
  alamat: string | null;
  aktif: boolean;
}

export interface TitipanKantin {
  id: number;
  kantin_id: number;
  tanggal_kirim: string;
  catatan: string | null;
  settled: boolean;
  kantin?: Kantin;
  titipan_kantin_detail?: TitipanKantinDetail[];
}

export interface TitipanKantinDetail {
  id: number;
  titipan_id: number;
  produk_id: number;
  qty_dititipkan: number;
  harga_jual_satuan: number;
  qty_terjual: number | null;
  qty_sisa: number | null;
  tanggal_settlement: string | null;
  produk?: Produk;
}

export interface KategoriPengeluaran {
  id: number;
  nama: string;
  aktif: boolean;
}

export interface Pengeluaran {
  id: number;
  tanggal: string;
  kategori_id: number;
  jumlah: number;
  keterangan: string | null;
  kategori_pengeluaran?: KategoriPengeluaran;
}

export interface ModalUsaha {
  id: number;
  saldo: number;
  updated_at: string;
}

export interface RiwayatModal {
  id: number;
  tanggal: string;
  jenis: JenisRiwayatModal;
  nominal: number;
  saldo_awal: number | null;
  saldo_akhir: number | null;
  keterangan: string | null;
}

export interface PengaturanSistem {
  kunci: string;
  nilai: any;
  kategori: string;
  deskripsi: string | null;
}

export interface CartItem {
  produk_id: number;
  nama: string;
  harga: number;
  qty: number;
  foto_url: string | null;
}
