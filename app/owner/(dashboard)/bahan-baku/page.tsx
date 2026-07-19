'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { FieldWrap, TextInput } from '@/components/ui/Input';
import { rupiah, validateTeksWajib } from '@/lib/validation';
import { BahanBaku } from '@/lib/types';
import Link from 'next/link';

// Halaman ini khusus untuk kelola MASTER bahan baku (nama, satuan, stok minimum).
// stok_saat_ini & harga_rata_rata TIDAK diedit manual di sini -- itu terkelola
// otomatis oleh trigger fn_mutasi_stok_apply lewat halaman /owner/stok
// supaya jejak audit pembelian tetap konsisten.

export default function BahanBakuPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<BahanBaku[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BahanBaku | null>(null);
  const [form, setForm] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('bahan_baku').select('*').order('nama');
    setRows(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm({ nama: '', satuan: '', stok_minimum: 0 });
    setEditing(null); setErrors({}); setModalOpen(true);
  }
  function openEdit(b: BahanBaku) {
    setForm({ nama: b.nama, satuan: b.satuan, stok_minimum: b.stok_minimum });
    setEditing(b); setErrors({}); setModalOpen(true);
  }

  function validateAll() {
    const errs: Record<string, string> = {};
    const eNama = validateTeksWajib(form.nama, 'Nama bahan', 2, 60); if (eNama) errs.nama = eNama;
    const eSatuan = validateTeksWajib(form.satuan, 'Satuan', 1, 20); if (eSatuan) errs.satuan = eSatuan;
    if (isNaN(Number(form.stok_minimum)) || Number(form.stok_minimum) < 0) errs.stok_minimum = 'Stok minimum harus angka >= 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function save() {
    if (!validateAll()) return;
    const payload = { nama: form.nama.trim(), satuan: form.satuan.trim(), stok_minimum: Number(form.stok_minimum) };
    if (editing) await supabase.from('bahan_baku').update(payload).eq('id', editing.id);
    else await supabase.from('bahan_baku').insert({ ...payload, stok_saat_ini: 0, harga_rata_rata: 0, harga_beli_terakhir: 0 });
    setModalOpen(false);
    load();
  }

  async function remove(b: BahanBaku) {
    if (!confirm(`Hapus bahan "${b.nama}"?`)) return;
    const { error } = await supabase.from('bahan_baku').delete().eq('id', b.id);
    if (error) alert('Gagal hapus: ' + error.message + ' (bahan ini mungkin masih dipakai di resep)');
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-doodle text-3xl">Bahan Baku</h1>
          <p className="text-inkSoft text-sm">Stok & harga rata-rata terupdate otomatis dari <Link href="/owner/stok" className="underline font-bold">Mutasi Stok</Link></p>
        </div>
        <Button onClick={openAdd}>+ Tambah Bahan</Button>
      </div>

      <div className="overflow-x-auto bg-paper border-2 border-ink rounded-2xl shadow-doodle-sm">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-xs uppercase text-inkSoft border-b-2 border-ink">
              <th className="px-4 py-3">Nama</th><th className="px-4 py-3">Stok</th><th className="px-4 py-3">Minimum</th><th className="px-4 py-3">Harga Rata-rata</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-8 text-inkSoft">Memuat...</td></tr>}
            {rows.map((b) => {
              const kritis = Number(b.stok_saat_ini) <= Number(b.stok_minimum);
              return (
                <tr key={b.id} className="border-b border-ink/10 last:border-none">
                  <td className="px-4 py-3 font-semibold">{b.nama}</td>
                  <td className="px-4 py-3">{b.stok_saat_ini} {b.satuan}</td>
                  <td className="px-4 py-3">{b.stok_minimum} {b.satuan}</td>
                  <td className="px-4 py-3">{rupiah(b.harga_rata_rata)}</td>
                  <td className="px-4 py-3"><Badge tone={kritis ? 'danger' : 'ok'}>{kritis ? 'Perlu Restok' : 'Aman'}</Badge></td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <Button variant="secondary" className="!px-3 !py-1 !text-xs" onClick={() => openEdit(b)}>Edit</Button>
                    <Button variant="danger" className="!px-3 !py-1 !text-xs" onClick={() => remove(b)}>Hapus</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}>
        <FieldWrap label="Nama Bahan" error={errors.nama}>
          <TextInput value={form.nama ?? ''} error={errors.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
        </FieldWrap>
        <FieldWrap label="Satuan" error={errors.satuan}>
          <TextInput value={form.satuan ?? ''} error={errors.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} placeholder="kg, liter, pcs" />
        </FieldWrap>
        <FieldWrap label="Stok Minimum (untuk alert)" error={errors.stok_minimum}>
          <TextInput type="number" value={form.stok_minimum ?? ''} error={errors.stok_minimum} onChange={(e) => setForm({ ...form, stok_minimum: e.target.value })} />
        </FieldWrap>
        <Button onClick={save} className="w-full mt-2">Simpan</Button>
      </Modal>
    </div>
  );
}
