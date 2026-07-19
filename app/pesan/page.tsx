'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { createClient } from '@/lib/supabase/client';
import { FieldWrap, TextInput, TextArea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { rupiah, validateNama, validateNoWa, validateAlamat, validateRequiredSelect } from '@/lib/validation';
import { LokasiCod, MetodePengiriman, MetodeBayar } from '@/lib/types';
type KonfirmasiTransaksi = {
  kode_lacak: string;
  grand_total: number;
};

export default function PesanPage() {
  const { items, setQty, remove, subtotal, clear } = useCart();
  const supabase = createClient();
  const router = useRouter();

  const [nama, setNama] = useState('');
  const [noWa, setNoWa] = useState('');
  const [metode, setMetode] = useState<MetodePengiriman>('ambil_sendiri');
  const [alamat, setAlamat] = useState('');
  const [koordinat, setKoordinat] = useState<{ lat: number; lng: number } | null>(null);
  const [lokasiCodId, setLokasiCodId] = useState('');
  const [lokasiCodList, setLokasiCodList] = useState<LokasiCod[]>([]);
  const [bayar, setBayar] = useState<MetodeBayar | ''>('');
  const [catatan, setCatatan] = useState('');

  const [ongkir, setOngkir] = useState(0);
  const [jarakKm, setJarakKm] = useState<number | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ kode: string; total: number } | null>(null);

  useEffect(() => {
    supabase.from('lokasi_cod').select('*').eq('aktif', true).then(({ data }) => setLokasiCodList(data || []));
  }, []);

  useEffect(() => {
    if (metode === 'diantar' && koordinat) {
      supabase.rpc('fn_hitung_ongkir', { p_lat: koordinat.lat, p_lng: koordinat.lng }).then(({ data, error }) => {
        if (error) { setLocError('Lokasi di luar jangkauan pengiriman, coba pilih ambil sendiri / COD.'); setOngkir(0); setJarakKm(null); return; }
        const row = Array.isArray(data) ? data[0] : data;
        if (row) { setOngkir(row.ongkir); setJarakKm(row.jarak_km); setLocError(null); }
      });
    } else {
      setOngkir(0); setJarakKm(null);
    }
  }, [metode, koordinat]);

  function ambilLokasi() {
    setLocLoading(true); setLocError(null);
    if (!navigator.geolocation) { setLocError('Browser tidak mendukung deteksi lokasi'); setLocLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setKoordinat({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); },
      () => { setLocError('Gagal mengambil lokasi. Izinkan akses lokasi di browser ya~'); setLocLoading(false); }
    );
  }

  function validateAll(): boolean {
    const errs: Record<string, string> = {};
    const eNama = validateNama(nama); if (eNama) errs.nama = eNama;
    const eWa = validateNoWa(noWa); if (eWa) errs.wa = eWa;

    if (metode === 'diantar') {
      const eAlamat = validateAlamat(alamat, true); if (eAlamat) errs.alamat = eAlamat;
      if (!koordinat) errs.lokasi = 'Wajib bagikan lokasi supaya ongkir bisa dihitung';
    }
    if (metode === 'cod_titik_temu') {
      const eLokasi = validateRequiredSelect(lokasiCodId, 'Titik COD'); if (eLokasi) errs.lokasiCod = eLokasi;
    }
    const eBayar = validateRequiredSelect(bayar, 'Metode pembayaran'); if (eBayar) errs.bayar = eBayar;
    if (items.length === 0) errs.cart = 'Keranjang masih kosong';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit() {
    if (!validateAll()) return;
    setSubmitting(true);
    const payloadItems = items.map((i) => ({ produk_id: i.produk_id, qty: i.qty, harga_satuan: i.harga }));

    const { data, error } = await supabase.rpc('sp_buat_transaksi_retail', {
      p_nama_pelanggan: nama.trim(),
      p_no_wa: noWa.trim(),
      p_alamat_text: metode === 'diantar' ? alamat.trim() : null,
      p_alamat_lat: koordinat?.lat ?? null,
      p_alamat_lng: koordinat?.lng ?? null,
      p_metode_pengiriman: metode,
      p_metode_bayar: bayar,
      p_sumber: 'website',
      p_items: payloadItems,
      p_catatan: catatan.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      alert('Gagal mengirim pesanan: ' + error.message);
      return;
    }

    // ambil kode_lacak transaksi yang baru dibuat (pakai RPC biar bypass RLS anon)
    const { data: trxRaw, error: trxError } = await supabase
      .rpc('fn_get_konfirmasi_transaksi', { p_id: data })
      .maybeSingle();

    const trx = trxRaw as KonfirmasiTransaksi | null;

    if (trxError || !trx) {
      alert('Pesanan berhasil dibuat, tapi gagal memuat konfirmasi. Silakan cek halaman Lacak Pesanan.');
      clear();
      return;
    }

    setReceipt({ kode: trx.kode_lacak, total: trx.grand_total });
    clear();
  }

  if (receipt) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-[#FFFDF6] max-w-xs w-full p-7 -rotate-2 shadow-2xl relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-mint/75 -rotate-3 border border-ink/20" />
          <h3 className="font-doodle text-2xl text-center mt-1">Pesanan Diterima!</h3>
          <div className="text-center font-doodle text-pinkDeep border-2 border-pinkDeep inline-block px-4 py-1 rounded-lg -rotate-6 mx-auto mt-2 mb-2 block w-fit">✓ disetujui!</div>
          <div className="font-pen text-3xl text-center my-2">{receipt.kode}</div>
          <div className="border-t-2 border-dashed border-ink my-3" />
          <div className="flex justify-between font-bold"><span>Total</span><span>{rupiah(receipt.total)}</span></div>
          <p className="font-pen text-center text-lg mt-3">simpan kode ini buat lacak pesananmu ya~</p>
          <div className="flex gap-2 mt-4">
            <Link href={`/lacak/${receipt.kode}`} className="flex-1"><Button className="w-full">Lacak Pesanan</Button></Link>
            <Link href="/" className="flex-1"><Button variant="secondary" className="w-full">Pesan Lagi</Button></Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <Link href="/" className="text-sm font-semibold">← kembali ke menu</Link>
      <h1 className="font-doodle text-3xl md:text-4xl mt-2 mb-6">Form Pemesanan</h1>

      <div className="bg-paper border-2 border-ink rounded-2xl p-4 md:p-6 mb-6 shadow-doodle-sm">
        <h2 className="font-bold mb-3">Keranjang Kamu</h2>
        {items.length === 0 && <p className="text-inkSoft text-sm">Keranjang masih kosong, <Link href="/#menu" className="text-pinkDeep font-bold">pilih menu dulu yuk</Link>.</p>}
        {items.map((i) => (
          <div key={i.produk_id} className="flex items-center justify-between py-2 border-b border-ink/10 last:border-none">
            <div>
              <p className="font-semibold text-sm">{i.nama}</p>
              <p className="text-xs text-inkSoft">{rupiah(i.harga)} x {i.qty}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(i.produk_id, i.qty - 1)} className="w-6 h-6 border-2 border-ink rounded-full font-bold text-xs">−</button>
              <span className="text-sm w-4 text-center">{i.qty}</span>
              <button onClick={() => setQty(i.produk_id, i.qty + 1)} className="w-6 h-6 border-2 border-ink rounded-full font-bold text-xs">+</button>
              <button onClick={() => remove(i.produk_id)} className="text-red text-xs ml-1">Hapus</button>
            </div>
          </div>
        ))}
        {errors.cart && <p className="text-red font-pen text-base mt-2">✗ {errors.cart}</p>}
      </div>

      <div className="bg-paper border-2 border-ink rounded-2xl p-4 md:p-6 shadow-doodle-sm">
        <FieldWrap label="Nama Kamu" error={errors.nama}>
          <TextInput value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap" error={errors.nama} />
        </FieldWrap>

        <FieldWrap label="Nomor WhatsApp" error={errors.wa} hint="Dipakai untuk konfirmasi pesanan">
          <TextInput value={noWa} onChange={(e) => setNoWa(e.target.value)} placeholder="081234567890" error={errors.wa} />
        </FieldWrap>

        <FieldWrap label="Cara Ambil Pesanan">
          <div className="flex flex-wrap gap-2">
            {[
              { v: 'ambil_sendiri', l: 'Ambil Sendiri' },
              { v: 'diantar', l: 'Diantar' },
              { v: 'cod_titik_temu', l: 'COD Titik Temu' },
            ].map((opt) => (
              <label key={opt.v} className={`border-2 border-ink rounded-full px-4 py-2 text-sm font-semibold cursor-pointer ${metode === opt.v ? 'bg-mint' : 'bg-cream'}`}>
                <input type="radio" className="hidden" checked={metode === opt.v} onChange={() => setMetode(opt.v as MetodePengiriman)} />
                {opt.l}
              </label>
            ))}
          </div>
        </FieldWrap>

        {metode === 'diantar' && (
          <>
            <FieldWrap label="Alamat Lengkap" error={errors.alamat}>
              <TextInput value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Nama jalan, no rumah, patokan..." error={errors.alamat} />
            </FieldWrap>
            <FieldWrap label="Lokasi untuk Hitung Ongkir" error={errors.lokasi}>
              <Button type="button" variant="secondary" onClick={ambilLokasi} disabled={locLoading}>
                {locLoading ? 'Mengambil lokasi...' : koordinat ? '📍 Lokasi didapat ✓' : '📍 Gunakan Lokasi Saat Ini'}
              </Button>
              {jarakKm !== null && <p className="text-xs text-inkSoft mt-1">Jarak ± {jarakKm} km, ongkir {rupiah(ongkir)}</p>}
              {locError && <p className="text-red font-pen text-base mt-1">✗ {locError}</p>}
            </FieldWrap>
          </>
        )}

        {metode === 'cod_titik_temu' && (
          <FieldWrap label="Pilih Titik COD" error={errors.lokasiCod}>
            <Select value={lokasiCodId} onChange={(e) => setLokasiCodId(e.target.value)} error={errors.lokasiCod}>
              <option value="">-- pilih lokasi --</option>
              {lokasiCodList.map((l) => <option key={l.id} value={l.id}>{l.nama_lokasi}</option>)}
            </Select>
          </FieldWrap>
        )}

        <FieldWrap label="Metode Pembayaran" error={errors.bayar}>
          <Select value={bayar} onChange={(e) => setBayar(e.target.value as MetodeBayar)} error={errors.bayar}>
            <option value="">-- pilih metode bayar --</option>
            <option value="transfer">Transfer Bank</option>
            <option value="qris">QRIS</option>
            <option value="tunai">Tunai (COD)</option>
          </Select>
        </FieldWrap>

        <FieldWrap label="Catatan (opsional)">
          <TextArea rows={2} maxLength={200} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Contoh: pedasnya dikurangin ya kak~" />
        </FieldWrap>

        <div className="bg-yellow/15 border-2 border-dashed border-ink rounded-xl p-4 mb-4">
          <div className="flex justify-between text-sm mb-1"><span>Subtotal</span><span>{rupiah(subtotal)}</span></div>
          <div className="flex justify-between text-sm mb-1"><span>Ongkir</span><span>{ongkir === 0 ? 'Gratis' : rupiah(ongkir)}</span></div>
          <div className="flex justify-between font-doodle text-xl font-bold border-t-2 border-ink pt-2 mt-2"><span>Total</span><span>{rupiah(subtotal + ongkir)}</span></div>
        </div>

        <Button onClick={submit} disabled={submitting} className="w-full !text-lg !py-3.5">
          {submitting ? 'Mengirim...' : 'Kirim Pesanan 🎀'}
        </Button>
      </div>
    </main>
  );
}
