'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { FieldWrap, TextInput, Select } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

// Komponen CRUD generik untuk tabel master data sederhana yang strukturnya flat:
// kategori_produk, kantin, lokasi_cod, kategori_pengeluaran.
// Untuk tabel dengan kebutuhan khusus (produk+foto, pesanan, stok, konsinyasi)
// dibuatkan halaman tersendiri -- lihat app/owner/produk, app/owner/pesanan, dst.

export type FieldConfig = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  required?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  validate?: (v: any) => string | null;
};

export default function CrudTable({
  table,
  title,
  fields,
  selectQuery = '*',
  orderBy = 'id',
}: {
  table: string;
  title: string;
  fields: FieldConfig[];
  selectQuery?: string;
  orderBy?: string;
}) {
  const supabase = createClient();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from(table).select(selectQuery).order(orderBy, { ascending: false });
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function openAdd() {
    const initial: Record<string, any> = {};
    fields.forEach((f) => { initial[f.key] = f.type === 'boolean' ? true : ''; });
    setForm(initial);
    setEditing(null);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(row: any) {
    const initial: Record<string, any> = {};
    fields.forEach((f) => { initial[f.key] = row[f.key]; });
    setForm(initial);
    setEditing(row);
    setErrors({});
    setModalOpen(true);
  }

  function validateAll(): boolean {
    const errs: Record<string, string> = {};
    fields.forEach((f) => {
      const v = form[f.key];
      if (f.required && (v === '' || v === null || v === undefined)) {
        errs[f.key] = `${f.label} wajib diisi`;
        return;
      }
      if (f.type === 'number' && v !== '' && v !== null) {
        const num = Number(v);
        if (isNaN(num)) errs[f.key] = `${f.label} harus angka`;
        else if (f.min !== undefined && num < f.min) errs[f.key] = `${f.label} minimal ${f.min}`;
        else if (f.max !== undefined && num > f.max) errs[f.key] = `${f.label} maksimal ${f.max}`;
      }
      if (f.validate) {
        const msg = f.validate(v);
        if (msg) errs[f.key] = msg;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function save() {
    if (!validateAll()) return;
    setSaving(true);
    const payload: Record<string, any> = {};
    fields.forEach((f) => {
      payload[f.key] = f.type === 'number' ? Number(form[f.key]) : form[f.key];
    });
    if (editing) {
      await supabase.from(table).update(payload).eq('id', editing.id);
    } else {
      await supabase.from(table).insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function remove(row: any) {
    if (!confirm(`Yakin mau hapus "${row[fields[0].key]}"? Data terkait bisa ikut terpengaruh.`)) return;
    const { error } = await supabase.from(table).delete().eq('id', row.id);
    if (error) alert('Gagal hapus: ' + error.message + ' (mungkin data ini masih dipakai di tempat lain)');
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-doodle text-2xl">{title}</h2>
        <Button onClick={openAdd}>+ Tambah</Button>
      </div>

      <div className="overflow-x-auto bg-paper border-2 border-ink rounded-2xl shadow-doodle-sm">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="border-b-2 border-ink text-xs uppercase text-inkSoft">
              {fields.map((f) => <th key={f.key} className="text-left px-4 py-3">{f.label}</th>)}
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={fields.length + 1} className="text-center py-8 text-inkSoft">Memuat data...</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={fields.length + 1} className="text-center py-8 text-inkSoft">Belum ada data</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ink/10 last:border-none">
                {fields.map((f) => (
                  <td key={f.key} className="px-4 py-3">
                    {f.type === 'boolean'
                      ? <Badge tone={row[f.key] ? 'ok' : 'danger'}>{row[f.key] ? 'Ya' : 'Tidak'}</Badge>
                      : String(row[f.key] ?? '-')}
                  </td>
                ))}
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <Button variant="secondary" className="!px-3 !py-1 !text-xs" onClick={() => openEdit(row)}>Edit</Button>
                  <Button variant="danger" className="!px-3 !py-1 !text-xs" onClick={() => remove(row)}>Hapus</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${title}` : `Tambah ${title}`}>
        {fields.map((f) => (
          <FieldWrap key={f.key} label={f.label} error={errors[f.key]}>
            {f.type === 'boolean' ? (
              <Select
                value={form[f.key] ? 'true' : 'false'}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value === 'true' })}
              >
                <option value="true">Ya</option>
                <option value="false">Tidak</option>
              </Select>
            ) : f.type === 'select' ? (
              <Select value={form[f.key] ?? ''} error={errors[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                <option value="">-- pilih --</option>
                {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            ) : (
              <TextInput
                type={f.type === 'number' ? 'number' : 'text'}
                value={form[f.key] ?? ''}
                error={errors[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            )}
          </FieldWrap>
        ))}
        <Button onClick={save} disabled={saving} className="w-full mt-2">{saving ? 'Menyimpan...' : 'Simpan'}</Button>
      </Modal>
    </div>
  );
}
