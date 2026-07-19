'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { FieldWrap, TextInput, Select, TextArea } from '@/components/ui/Input';
import { rupiah, validateQty, validateRequiredSelect } from '@/lib/validation';
import { BahanBaku, JenisMutasiStok, MutasiStok } from '@/lib/types';

const JENIS_OPTIONS: { value: JenisMutasiStok; label: string }[] = [
  { value: 'pembelian', label: 'Pembelian' },
  { value: 'retur_masuk', label: 'Retur Masuk' },
  { value: 'pemakaian_produksi', label: 'Pemakaian Produksi (manual)' },
  { value: 'retur_keluar', label: 'Retur Keluar' },
];

export default function StokPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<MutasiStok[]>([]);
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [bahanId, setBahanId] = useState('');
  const [jenis, setJenis] = useState<JenisMutasiStok>('pembelian');
  const [qty, setQty] = useState('');
  const [harga, setHarga] = useState('');
  const [supplier, setSupplier] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: m }, { data: b }] = await Promise.all([
      supabase.from('mutasi_stok').select('*, bahan_baku(*)').order('tanggal', { ascending: false }).limit(50),
      supabase.from('bahan_baku').select('*').order('nama'),
    ]);
    setRows(m || []); setBahanBaku(b || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openModal() {
    setBahanId(''); setJenis('pembelian'); setQty(''); setHarga(''); setSupplier(''); setKeterangan(''); setErrors({});
    setModalOpen(true);
  }

  function validateAll() {
    const errs: Record<string, string> = {};
    const eBahan = validateRequiredSelect(bahanId, 'Bahan baku'); if (eBahan) errs.bahan = eBahan;
    const eQty = validateQty(Number(qty)); if (eQty) errs.qty = eQty;
    if (jenis === 'pembelian' && (harga === '' || Number(harga) <= 0)) errs.harga = 'Harga beli per satuan wajib diisi untuk pembelian';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function save() {
    if (!validateAll()) return;
    setSaving(true);
    const { error } = await supabase.from('mutasi_stok').insert({
      bahan_baku_id: Number(bahanId),
      jenis,
      qty: Number(qty),
      harga_per_satuan: harga ? Number(harga) : null,
      supplier: supplier.trim() || null,
      keterangan: keterangan.trim() || null,
    });
    setSaving(false);
    if (error) { alert('Gagal simpan: ' + error.message); return; }
    setModalOpen(false);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-doodle text-3xl">Mutasi Stok</h1>
          <p className="text-inkSoft text-sm">Catat pembelian bahan baku — stok & harga rata-rata terupdate otomatis</p>
        </div>
        <Button onClick={openModal}>+ Catat Mutasi</Button>
      </div>

      <div className="overflow-x-auto bg-paper border-2 border-ink rounded-2xl shadow-doodle-sm">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-xs uppercase text-inkSoft border-b-2 border-ink">
              <th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Bahan</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Harga/satuan</th><th className="px-4 py-3">Supplier</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-8 text-inkSoft">Memuat...</td></tr>}
            {rows.map((m) => (
              <tr key={m.id} className="border-b border-ink/10 last:border-none">
                <td className="px-4 py-3">{new Date(m.tanggal).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3">{m.bahan_baku?.nama}</td>
                <td className="px-4 py-3 capitalize">{m.jenis.replace('_', ' ')}</td>
                <td className="px-4 py-3">{m.qty}</td>
                <td className="px-4 py-3">{m.harga_per_satuan ? rupiah(m.harga_per_satuan) : '-'}</td>
                <td className="px-4 py-3">{m.supplier ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Catat Mutasi Stok">
        <FieldWrap label="Bahan Baku" error={errors.bahan}>
          <Select value={bahanId} error={errors.bahan} onChange={(e) => setBahanId(e.target.value)}>
            <option value="">-- pilih bahan --</option>
            {bahanBaku.map((b) => <option key={b.id} value={b.id}>{b.nama} (stok: {b.stok_saat_ini} {b.satuan})</option>)}
          </Select>
        </FieldWrap>
        <FieldWrap label="Jenis Mutasi">
          <Select value={jenis} onChange={(e) => setJenis(e.target.value as JenisMutasiStok)}>
            {JENIS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </FieldWrap>
        <div className="grid grid-cols-2 gap-3">
          <FieldWrap label="Jumlah (Qty)" error={errors.qty}>
            <TextInput type="number" value={qty} error={errors.qty} onChange={(e) => setQty(e.target.value)} />
          </FieldWrap>
          <FieldWrap label="Harga per Satuan" error={errors.harga} hint={jenis === 'pembelian' ? 'wajib diisi' : 'opsional'}>
            <TextInput type="number" value={harga} error={errors.harga} onChange={(e) => setHarga(e.target.value)} />
          </FieldWrap>
        </div>
        <FieldWrap label="Supplier (opsional)">
          <TextInput value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Keterangan (opsional)">
          <TextArea rows={2} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
        </FieldWrap>
        <Button onClick={save} disabled={saving} className="w-full mt-2">{saving ? 'Menyimpan...' : 'Simpan'}</Button>
      </Modal>
    </div>
  );
}
