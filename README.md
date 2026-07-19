# BiteSeyo — Aplikasi Web Pelanggan & Owner

Aplikasi Next.js 14 (App Router) + Supabase (PostgreSQL) + Tailwind CSS.
Tema: doodle Korea, responsif untuk HP/tablet/desktop.

## Struktur

- **Website Pelanggan** (`/`, `/pesan`, `/lacak`) — tanpa login, katalog produk,
  keranjang, form pemesanan dengan validasi, cek status pesanan.
- **Dashboard Owner** (`/owner/*`) — login staff, CRUD penuh untuk semua
  modul (produk+foto+resep, bahan baku, stok, pesanan, konsinyasi, keuangan,
  pengaturan).

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com) (gratis).
2. Buka **SQL Editor**, jalankan berurutan:
   1. `schema_final_kuliner.sql` (struktur tabel, function, trigger)
   2. `supabase_setup_addendum.sql` (RLS, akses anon, fungsi lacak pesanan)
3. Buat **Storage bucket**: Storage → New bucket → nama `produk-foto` →
   aktifkan **Public bucket**. Baru lanjut jalankan bagian 7 di
   `supabase_setup_addendum.sql` kalau belum otomatis jalan.
4. Buat user staff pertama: Authentication → Users → Add user (isi email +
   password). Salin **User UID** yang muncul.
5. Di SQL Editor, jalankan:
   ```sql
   insert into staff (auth_user_id, nama, role)
   values ('TEMPEL-UID-DI-SINI', 'Nama Owner', 'owner');
   ```
6. Ambil kredensial project: Project Settings → API → salin **Project URL**
   dan **anon public key**.

## 2. Setup Aplikasi

```bash
npm install
cp .env.example .env.local
# isi .env.local dengan Project URL & anon key dari Supabase
npm run dev
```

Buka `http://localhost:3000` untuk website pelanggan, dan
`http://localhost:3000/owner/login` untuk login dashboard owner.

## 3. Catatan Penting

- **Guest checkout**: pelanggan tidak pernah punya akun. Semua insert
  pesanan lewat function database `sp_buat_transaksi_retail` (dipanggil via
  `supabase.rpc(...)`), bukan insert langsung ke tabel — supaya validasi &
  perhitungan HPP/ongkir konsisten di sisi server, bukan bisa dimanipulasi
  dari browser.
- **Upload foto produk**: disimpan di Supabase Storage bucket `produk-foto`,
  hanya staff aktif yang login yang bisa upload/edit/hapus (lihat policy
  storage di addendum SQL). Maksimal 2MB, format JPG/PNG/WEBP (divalidasi di
  `lib/validation.ts`).
- **Validasi form pemesanan**: nama (huruf saja, 3-60 karakter), nomor WA
  (format Indonesia `08xx`/`+62`/`62`), alamat wajib kalau pilih diantar,
  titik COD wajib dipilih kalau pilih COD, metode bayar wajib. Semua
  divalidasi di sisi client SEBELUM submit, tapi constraint di database
  (schema_final_kuliner.sql) tetap jadi lapisan pertahanan kedua.
- **Ongkir**: dihitung otomatis dari lokasi browser pelanggan (izin
  geolocation) lewat function `fn_hitung_ongkir`, berdasarkan parameter di
  tabel `pengaturan_sistem` — bisa diubah kapan saja lewat halaman
  `/owner/pengaturan` tanpa deploy ulang aplikasi.
- **Konfirmasi pesanan memotong stok otomatis**: saat status diubah ke
  "Diproses" di `/owner/pesanan`, aplikasi memanggil
  `sp_konfirmasi_transaksi` yang otomatis mencatat pemakaian bahan baku
  sesuai resep tiap produk.

## 4. Yang Masih Perlu Anda Sesuaikan

- Data menu awal (produk, kategori, bahan baku, resep) — tambahkan lewat
  dashboard owner setelah login, atau insert manual lewat SQL Editor.
- Kategori pengeluaran untuk bagi hasil kantin di `sp_settlement_titipan_kantin`
  masih mengarah ke kategori "Marketing" (lihat catatan di
  `dokumentasi_modul_dan_arsitektur.md`) — sebaiknya buat kategori khusus.
- Mekanisme anti-spam untuk form pemesanan (rate limit / verifikasi WA)
  belum diimplementasikan — pertimbangkan menambahkan sebelum go-live ramai.
- Deploy: paling gampang lewat [Vercel](https://vercel.com) (hubungkan repo,
  isi environment variables yang sama seperti `.env.local`, deploy).

## 5. Struktur Folder Singkat

```
app/
  page.tsx              -> beranda + katalog (publik)
  pesan/page.tsx         -> form pemesanan + keranjang
  lacak/[kode]/page.tsx  -> cek status pesanan
  owner/login/           -> login staff
  owner/(dashboard)/     -> semua halaman admin (butuh login, dilindungi middleware.ts)
components/
  CrudTable.tsx           -> CRUD generik untuk tabel master data sederhana
  MenuGrid.tsx, CartProvider.tsx, Sidebar.tsx, ui/*
lib/
  supabase/client.ts, server.ts  -> koneksi Supabase
  types.ts                -> tipe data sesuai schema
  validation.ts            -> semua aturan validasi form
```
