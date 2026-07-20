'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import { FieldWrap, TextInput, TextArea, Select } from '@/components/ui/Input';
import { rupiah, validateNama, validateNoWa, validateAlamat, validateRequiredSelect } from '@/lib/validation';
import { CartItem, LokasiCod, MetodeBayar, MetodePengiriman, Produk, SumberTransaksi } from '@/lib/types';

// Modal "Tambah Pesanan Manual" untuk staff/owner mencatat pesanan yang masuk
// lewat WA, walk-in, atau marketplace lain. Dipakai bersama sp_buat_transaksi_retail
// yang sama dengan alur checkout pelanggan di /pesan, supaya no_transaksi, kode_lacak,
// hpp, dan potong resep tetap dihitung konsisten oleh database -- bukan insert manual.

type Props = { open: boolean; onClose: () => void; onCreated: () => void };

export default function TambahPesananModal({ open, onClose, onCreated }: Props) {
  const supabase = createClient();

  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [lokasiCodList, setLokasiCodList] = useState<LokasiCod[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  const [nama, setNama] = useState('');
  const [noWa, setNoWa] = useState('');
  const [sumber, setSumber] = useState<SumberTransaksi>('walk_in');
  const [metode, setMetode] = useState<MetodePengiriman>('ambil_sendiri');
  const [alamat, setAlamat] = useState('');
  const [alamatLat, setAlamatLat] = useState('');
  const [alamatLng, setAlamatLng] = useState('');
  const [lokasiCodId, setLokasiCodId] = useState('');
  const [bayar, setBayar] = useState<MetodeBayar | ''>('');
  const [catatan, setCatatan] = useState('');

  const [items, setItems] = useState<CartItem[]>([]);
  const [pilihProdukId, setPilihProdukId] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    // reset form tiap kali modal dibuka
    setNama(''); setNoWa(''); setSumber('walk_in'); setMetode('ambil_sendiri');
    setAlamat(''); setAlamatLat(''); setAlamatLng(''); setLokasiCodId('');
    setBayar(''); setCatatan(''); setItems([]); setPilihProdukId(''); setErrors({});

    setLoadingMaster(true);
    Promise.all([
      supabase.from('produk').select('*').eq('aktif', true).eq('tersedia', true).order('urutan'),
      supabase.from('lokasi_cod').select('*').eq('aktif', true),
    ]).then(([{ data: p }, { data: l }]) => {
      setProdukList((p as any) || []);
      setLokasiCodList((l as any) || []);
      setLoadingMaster(false);
    });
  }, [open]);

  function tambahItem() {
    if (!pilihProdukId) return;
    const p = produkList.find((p) => p.id === Number(pilihProdukId));
    if (!p) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.produk_id === p.id);
      if (existing) return prev.map((i) => (i.produk_id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { produk_id: p.id, nama: p.nama, harga: p.harga_jual, qty: 1, foto_url: p.foto_url }];
    });
  }
  function ubahQty(produk_id: number, qty: number) {
    setItems((prev) => (qty <= 0 ? prev.filter((i) => i.produk_id !== produk_id) : prev.map((i) => (i.produk_id === produk_id ? { ...i, qty } : i))));
  }
  function hapusItem(produk_id: number) {
    setItems((prev) => prev.filter((i) => i.produk_id !== produk_id));
  }

  const subtotal = items.reduce((s, i) => s + i.harga * i.qty, 0);

  function validateAll(): boolean {
    const errs: Record<string, string> = {};
    const eNama = validateNama(nama); if (eNama) errs.nama = eNama;
    const eWa = validateNoWa(noWa); if (eWa) errs.wa = eWa;
    if (metode === 'diantar') {
      const eAlamat = validateAlamat(alamat, true); if (eAlamat) errs.alamat = eAlamat;
    }
    if (metode === 'cod_titik_temu') {
      const eLokasi = validateRequiredSelect(lokasiCodId, 'Titik COD'); if (eLokasi) errs.lokasiCod = eLokasi;
    }
    const eBayar = validateRequiredSelect(bayar, 'Metode pembayaran'); if (eBayar) errs.bayar = eBayar;
    if (items.length === 0) errs.items = 'Tambahkan minimal 1 produk';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function simpan() {
    if (!validateAll()) return;
    setSubmitting(true);
    const payloadItems = items.map((i) => ({ produk_id: i.produk_id, qty: i.qty, harga_satuan: i.harga }));

    const { data, error } = await supabase.rpc('sp_buat_transaksi_retail', {
      p_nama_pelanggan: nama.trim(),
      p_no_wa: noWa.trim(),
      p_alamat_text: metode === 'diantar' ? alamat.trim() : null,
      p_alamat_lat: metode === 'diantar' && alamatLat ? Number(alamatLat) : null,
      p_alamat_lng: metode === 'diantar' && alamatLng ? Number(alamatLng) : null,
      p_metode_pengiriman: metode,
      p_metode_bayar: bayar,
      p_sumber: sumber,
      p_items: payloadItems,
      p_catatan: catatan.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      alert('Gagal simpan pesanan: ' + error.message);
      return;
    }

    onCreated();
    onClose();
  }

  return (
    <div className="text-sm">
      {errors.items && <p className="text-red font-pen text-base mb-2">✗ {errors.items}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <FieldWrap label="Nama Pelanggan" error={errors.nama}>
          <TextInput value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap" error={errors.nama} />
        </FieldWrap>
        <FieldWrap label="Nomor WhatsApp" error={errors.wa}>
          <TextInput value={noWa} onChange={(e) => setNoWa(e.target.value)} placeholder="081234567890" error={errors.wa} />
        </FieldWrap>
      </div>

      <FieldWrap label="Sumber Pesanan">
        <Select value={sumber} onChange={(e) => setSumber(e.target.value as SumberTransaksi)}>
          <option value="walk_in">Walk-in / Datang Langsung</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="marketplace">Marketplace</option>
          <option value="lainnya">Lainnya</option>
        </Select>
      </FieldWrap>

      <FieldWrap label="Cara Ambil Pesanan">
        <div className="flex flex-wrap gap-2">
          {[
            { v: 'ambil_sendiri', l: 'Ambil Sendiri' },
            { v: 'diantar', l: 'Diantar' },
            { v: 'cod_titik_temu', l: 'COD Titik Temu' },
          ].map((opt) => (
            <label key={opt.v} className={`border-2 border-ink rounded-full px-4 py-2 text-xs font-semibold cursor-pointer ${metode === opt.v ? 'bg-mint' : 'bg-cream'}`}>
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
          <div className="grid grid-cols-2 gap-x-4">
            <FieldWrap label="Latitude (opsional)" hint="Isi dari share lokasi pelanggan supaya ongkir otomatis dihitung">
              <TextInput type="number" step="any" value={alamatLat} onChange={(e) => setAlamatLat(e.target.value)} placeholder="-6.200000" />
            </FieldWrap>
            <FieldWrap label="Longitude (opsional)">
              <TextInput type="number" step="any" value={alamatLng} onChange={(e) => setAlamatLng(e.target.value)} placeholder="106.816666" />
            </FieldWrap>
          </div>
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
          <option value="tunai">Tunai</option>
          <option value="cod">COD</option>
        </Select>
      </FieldWrap>

      <FieldWrap label="Catatan (opsional)">
        <TextArea rows={2} maxLength={200} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Contoh: pedasnya dikurangin ya kak~" />
      </FieldWrap>

      <div className="border-t-2 border-dashed border-ink pt-3 mb-1">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold">Item Pesanan</span>
        </div>
        <div className="flex gap-2 mb-3">
          <Select value={pilihProdukId} onChange={(e) => setPilihProdukId(e.target.value)} className="flex-1 !text-xs" disabled={loadingMaster}>
            <option value="">{loadingMaster ? 'Memuat produk...' : '-- pilih produk --'}</option>
            {produkList.map((p) => (
              <option key={p.id} value={p.id}>{p.nama} — {rupiah(p.harga_jual)}</option>
            ))}
          </Select>
          <Button type="button" variant="secondary" onClick={tambahItem} disabled={!pilihProdukId} className="!py-1.5 !px-4 !text-xs">+ Tambah</Button>
        </div>

        {items.length === 0 && <p className="text-xs text-inkSoft italic mb-2">Belum ada produk ditambahkan.</p>}
        {items.map((i) => (
          <div key={i.produk_id} className="flex items-center justify-between py-1.5 border-b border-ink/10 last:border-none">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{i.nama}</p>
              <p className="text-xs text-inkSoft">{rupiah(i.harga)} x {i.qty} = {rupiah(i.harga * i.qty)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => ubahQty(i.produk_id, i.qty - 1)} className="w-6 h-6 border-2 border-ink rounded-full font-bold text-xs">−</button>
              <span className="text-sm w-4 text-center">{i.qty}</span>
              <button type="button" onClick={() => ubahQty(i.produk_id, i.qty + 1)} className="w-6 h-6 border-2 border-ink rounded-full font-bold text-xs">+</button>
              <button type="button" onClick={() => hapusItem(i.produk_id)} className="text-red text-xs ml-1">Hapus</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow/15 border-2 border-dashed border-ink rounded-xl p-4 my-4">
        <div className="flex justify-between font-doodle text-xl font-bold"><span>Subtotal</span><span>{rupiah(subtotal)}</span></div>
        <p className="text-xs text-inkSoft mt-1">Ongkir & grand total dihitung otomatis oleh sistem saat disimpan.</p>
      </div>

      <Button onClick={simpan} disabled={submitting} className="w-full !text-base !py-3">
        {submitting ? 'Menyimpan...' : 'Simpan Pesanan'}
      </Button>
    </div>
  );
}
