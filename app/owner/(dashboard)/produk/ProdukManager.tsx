'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { FieldWrap, TextInput, TextArea, Select } from '@/components/ui/Input';
import { rupiah, validateHarga, validateTeksWajib, validateFotoProduk, validateQty } from '@/lib/validation';
import { BahanBaku, KategoriProduk, Produk, Resep } from '@/lib/types';

export default function ProdukManager() {
  const supabase = createClient();
  const [produk, setProduk] = useState<Produk[]>([]);
  const [kategori, setKategori] = useState<KategoriProduk[]>([]);
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Produk | null>(null);
  const [form, setForm] = useState<any>({});
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [resepModalProduk, setResepModalProduk] = useState<Produk | null>(null);
  const [resepList, setResepList] = useState<Resep[]>([]);
  const [newBahanId, setNewBahanId] = useState('');
  const [newQty, setNewQty] = useState('');

  async function loadAll() {
    setLoading(true);
    const [{ data: p }, { data: k }, { data: b }] = await Promise.all([
      supabase.from('produk').select('*, kategori_produk(*)').order('urutan'),
      supabase.from('kategori_produk').select('*').order('nama'),
      supabase.from('bahan_baku').select('*').order('nama'),
    ]);
    setProduk(p || []); setKategori(k || []); setBahanBaku(b || []);
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, []);

  function openAdd() {
    setForm({ nama: '', kategori_id: '', harga_jual: '', satuan: 'pcs', deskripsi: '', aktif: true, tersedia: true, urutan: 0 });
    setFotoFile(null); setFotoPreview(null); setEditing(null); setErrors({}); setModalOpen(true);
  }
  function openEdit(p: Produk) {
    setForm({ ...p, kategori_id: p.kategori_id ?? '' });
    setFotoFile(null); setFotoPreview(p.foto_url); setEditing(p); setErrors({}); setModalOpen(true);
  }

  function onFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    const err = validateFotoProduk(file);
    setErrors((prev) => ({ ...prev, foto: err || '' }));
    if (file && !err) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  }

  function validateAll(): boolean {
    const errs: Record<string, string> = {};
    const eNama = validateTeksWajib(form.nama, 'Nama produk', 3, 80); if (eNama) errs.nama = eNama;
    const eHarga = validateHarga(Number(form.harga_jual)); if (eHarga) errs.harga_jual = eHarga;
    const eSatuan = validateTeksWajib(form.satuan, 'Satuan', 1, 20); if (eSatuan) errs.satuan = eSatuan;
    if (!form.kategori_id) errs.kategori_id = 'Kategori wajib dipilih';
    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  }

  async function save() {
    if (!validateAll()) return;
    setSaving(true);

    let foto_url = editing?.foto_url ?? null;
    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop();
      const path = `produk/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('produk-foto').upload(path, fotoFile, { upsert: true });
      if (uploadError) {
        alert('Gagal upload foto: ' + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: pub } = supabase.storage.from('produk-foto').getPublicUrl(path);
      foto_url = pub.publicUrl;
    }

    const payload = {
      nama: form.nama.trim(),
      kategori_id: Number(form.kategori_id),
      harga_jual: Number(form.harga_jual),
      satuan: form.satuan.trim(),
      deskripsi: form.deskripsi?.trim() || null,
      aktif: !!form.aktif,
      tersedia: !!form.tersedia,
      urutan: Number(form.urutan) || 0,
      foto_url,
    };

    if (editing) {
      await supabase.from('produk').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('produk').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    loadAll();
  }

  async function remove(p: Produk) {
    if (!confirm(`Hapus produk "${p.nama}"? Resep terkait juga akan terhapus.`)) return;
    const { error } = await supabase.from('produk').delete().eq('id', p.id);
    if (error) alert('Gagal hapus: ' + error.message + ' (produk mungkin masih punya riwayat transaksi)');
    loadAll();
  }

  async function openResep(p: Produk) {
    setResepModalProduk(p);
    const { data } = await supabase.from('resep').select('*, bahan_baku(*)').eq('produk_id', p.id);
    setResepList(data || []);
    setNewBahanId(''); setNewQty('');
  }

  async function tambahResep() {
    if (!resepModalProduk) return;
    const errQty = validateQty(Number(newQty));
    if (!newBahanId) { alert('Pilih bahan baku dulu'); return; }
    if (errQty) { alert(errQty); return; }
    const { error } = await supabase.from('resep').insert({
      produk_id: resepModalProduk.id,
      bahan_baku_id: Number(newBahanId),
      qty_per_unit: Number(newQty),
    });
    if (error) { alert('Gagal tambah bahan: ' + error.message + ' (mungkin bahan ini sudah ada di resep)'); return; }
    openResep(resepModalProduk);
  }

  async function hapusResep(id: number) {
    await supabase.from('resep').delete().eq('id', id);
    if (resepModalProduk) openResep(resepModalProduk);
  }

  const hppEstimasi = (p: Produk) => {
    // dihitung ulang di sisi client hanya untuk estimasi tampilan;
    // angka final tetap snapshot dari trigger fn_detail_transaksi_set_hpp saat transaksi terjadi.
    return null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-doodle text-3xl">Produk & Resep</h1>
          <p className="text-inkSoft text-sm">Kelola menu, harga, foto, dan resep bahan baku</p>
        </div>
        <Button onClick={openAdd}>+ Tambah Produk</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <p className="text-inkSoft">Memuat...</p>}
        {!loading && produk.length === 0 && <p className="text-inkSoft">Belum ada produk</p>}
        {produk.map((p) => (
          <div key={p.id} className="bg-paper border-2 border-ink rounded-2xl p-4 shadow-doodle-sm">
            <div className="w-full aspect-video rounded-lg border-2 border-ink bg-cream flex items-center justify-center overflow-hidden mb-3">
              {p.foto_url ? <img src={p.foto_url} className="w-full h-full object-cover" alt={p.nama} /> : <span className="text-4xl">🍡</span>}
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold">{p.nama}</h3>
              <Badge tone={p.aktif ? 'ok' : 'danger'}>{p.aktif ? 'Aktif' : 'Nonaktif'}</Badge>
            </div>
            <p className="text-xs text-inkSoft mb-2">{(p as any).kategori_produk?.nama ?? 'Tanpa kategori'}</p>
            <p className="font-doodle text-lg text-pinkDeep font-bold mb-3">{rupiah(p.harga_jual)}</p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" className="!text-xs !px-3 !py-1.5" onClick={() => openEdit(p)}>Edit</Button>
              <Button variant="secondary" className="!text-xs !px-3 !py-1.5" onClick={() => openResep(p)}>Kelola Resep</Button>
              <Button variant="danger" className="!text-xs !px-3 !py-1.5" onClick={() => remove(p)}>Hapus</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah/Edit Produk */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Produk' : 'Tambah Produk'}>
        <FieldWrap label="Foto Produk" error={errors.foto} hint="JPG/PNG/WEBP, maksimal 2MB">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 rounded-lg border-2 border-ink bg-cream flex items-center justify-center overflow-hidden shrink-0">
              {fotoPreview ? <img src={fotoPreview} className="w-full h-full object-cover" /> : <span className="text-2xl">🍡</span>}
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFotoChange} className="text-xs" />
          </div>
        </FieldWrap>
        <FieldWrap label="Nama Produk" error={errors.nama}>
          <TextInput value={form.nama ?? ''} error={errors.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
        </FieldWrap>
        <FieldWrap label="Kategori" error={errors.kategori_id}>
          <Select value={form.kategori_id ?? ''} error={errors.kategori_id} onChange={(e) => setForm({ ...form, kategori_id: e.target.value })}>
            <option value="">-- pilih kategori --</option>
            {kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </Select>
        </FieldWrap>
        <div className="grid grid-cols-2 gap-3">
          <FieldWrap label="Harga Jual" error={errors.harga_jual}>
            <TextInput type="number" value={form.harga_jual ?? ''} error={errors.harga_jual} onChange={(e) => setForm({ ...form, harga_jual: e.target.value })} />
          </FieldWrap>
          <FieldWrap label="Satuan" error={errors.satuan}>
            <TextInput value={form.satuan ?? ''} error={errors.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} placeholder="pcs, porsi, gelas" />
          </FieldWrap>
        </div>
        <FieldWrap label="Deskripsi">
          <TextArea rows={2} value={form.deskripsi ?? ''} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
        </FieldWrap>
        <div className="grid grid-cols-2 gap-3">
          <FieldWrap label="Status Aktif">
            <Select value={form.aktif ? 'true' : 'false'} onChange={(e) => setForm({ ...form, aktif: e.target.value === 'true' })}>
              <option value="true">Aktif</option><option value="false">Nonaktif</option>
            </Select>
          </FieldWrap>
          <FieldWrap label="Tersedia (stok ready)">
            <Select value={form.tersedia ? 'true' : 'false'} onChange={(e) => setForm({ ...form, tersedia: e.target.value === 'true' })}>
              <option value="true">Ya</option><option value="false">Habis</option>
            </Select>
          </FieldWrap>
        </div>
        <Button onClick={save} disabled={saving} className="w-full mt-2">{saving ? 'Menyimpan...' : 'Simpan Produk'}</Button>
      </Modal>

      {/* Modal Resep */}
      <Modal open={!!resepModalProduk} onClose={() => setResepModalProduk(null)} title={`Resep: ${resepModalProduk?.nama ?? ''}`}>
        <p className="text-xs text-inkSoft mb-3">Resep dipakai sistem untuk hitung HPP otomatis & potong stok bahan baku saat pesanan dikonfirmasi.</p>
        <div className="space-y-2 mb-4">
          {resepList.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-cream border-2 border-ink rounded-lg px-3 py-2 text-sm">
              <span>{r.bahan_baku?.nama} — {r.qty_per_unit} {r.bahan_baku?.satuan}/produk</span>
              <button onClick={() => hapusResep(r.id)} className="text-red text-xs font-bold">Hapus</button>
            </div>
          ))}
          {resepList.length === 0 && <p className="text-inkSoft text-sm">Belum ada bahan baku di resep ini</p>}
        </div>
        <div className="space-y-2">
          <Select value={newBahanId} onChange={(e) => setNewBahanId(e.target.value)} className="w-full">
            <option value="">-- pilih bahan --</option>
            {bahanBaku.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}
          </Select>
          <div className="flex gap-2">
            <TextInput type="number" placeholder="qty" value={newQty} onChange={(e) => setNewQty(e.target.value)} className="flex-1 min-w-0" />
            <Button onClick={tambahResep} className="shrink-0">+ Tambah</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
