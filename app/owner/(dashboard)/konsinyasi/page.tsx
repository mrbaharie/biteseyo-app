'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import CrudTable from '@/components/CrudTable';
import { FieldWrap, Select, TextInput } from '@/components/ui/Input';
import { rupiah, validateQty, validatePersen, validateTeksWajib } from '@/lib/validation';
import { Kantin, Produk, TitipanKantin } from '@/lib/types';

export default function KonsinyasiPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<'titipan' | 'kantin'>('titipan');
  const [titipan, setTitipan] = useState<TitipanKantin[]>([]);
  const [kantinList, setKantinList] = useState<Kantin[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [kantinId, setKantinId] = useState('');
  const [items, setItems] = useState<{ produk_id: string; qty: string; harga: string }[]>([{ produk_id: '', qty: '', harga: '' }]);

  const [settleModal, setSettleModal] = useState<TitipanKantin | null>(null);
  const [settleQty, setSettleQty] = useState<Record<number, string>>({});

  async function load() {
    setLoading(true);
    const [{ data: t }, { data: k }, { data: p }] = await Promise.all([
      supabase.from('titipan_kantin').select('*, kantin(*), titipan_kantin_detail(*, produk:produk_id(nama))').order('tanggal_kirim', { ascending: false }),
      supabase.from('kantin').select('*').eq('aktif', true).order('nama'),
      supabase.from('produk').select('*').eq('aktif', true).order('nama'),
    ]);
    setTitipan((t as any) || []); setKantinList(k || []); setProdukList(p || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function addItemRow() { setItems([...items, { produk_id: '', qty: '', harga: '' }]); }
  function updateItemRow(i: number, key: string, val: string) {
    const copy = [...items]; (copy[i] as any)[key] = val; setItems(copy);
  }
  function removeItemRow(i: number) {
    if (items.length === 1) { setItems([{ produk_id: '', qty: '', harga: '' }]); return; }
    setItems(items.filter((_, idx) => idx !== i));
  }

  async function kirimTitipan() {
    if (!kantinId) { alert('Pilih kantin dulu'); return; }
    const validItems = items.filter((i) => i.produk_id && i.qty && i.harga);
    if (validItems.length === 0) { alert('Tambahkan minimal 1 produk'); return; }
    for (const it of validItems) {
      if (validateQty(Number(it.qty))) { alert('Qty produk harus lebih dari 0'); return; }
    }

    const { data: titipanBaru, error } = await supabase.from('titipan_kantin').insert({ kantin_id: Number(kantinId) }).select().single();
    if (error || !titipanBaru) { alert('Gagal buat titipan: ' + error?.message); return; }

    const rows = validItems.map((it) => ({
      titipan_id: titipanBaru.id,
      produk_id: Number(it.produk_id),
      qty_dititipkan: Number(it.qty),
      harga_jual_satuan: Number(it.harga),
    }));
    await supabase.from('titipan_kantin_detail').insert(rows);

    setModalOpen(false);
    setKantinId(''); setItems([{ produk_id: '', qty: '', harga: '' }]);
    load();
  }

  function openSettle(t: TitipanKantin) {
    setSettleModal(t);
    const init: Record<number, string> = {};
    (t.titipan_kantin_detail || []).forEach((d) => { init[d.id] = String(d.qty_terjual ?? ''); });
    setSettleQty(init);
  }

  async function simpanQtyTerjual() {
    if (!settleModal) return;
    for (const d of settleModal.titipan_kantin_detail || []) {
      const val = settleQty[d.id];
      if (val === '' || val === undefined) { alert('Isi qty terjual untuk semua produk'); return; }
      if (Number(val) > d.qty_dititipkan) { alert(`Qty terjual "${(d as any).produk?.nama}" tidak boleh lebih dari qty dititipkan`); return; }
      await supabase.from('titipan_kantin_detail').update({ qty_terjual: Number(val) }).eq('id', d.id);
    }
    const { data: userData } = await supabase.auth.getUser();
    const { data: staff } = await supabase.from('staff').select('id').eq('auth_user_id', userData.user?.id).single();
    const { error } = await supabase.rpc('sp_settlement_titipan_kantin', { p_titipan_id: settleModal.id, p_staff_id: staff?.id ?? null });
    if (error) { alert('Gagal settlement: ' + error.message); return; }
    setSettleModal(null);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-doodle text-3xl">Konsinyasi Kantin</h1>
        <div className="flex gap-2">
          <Button variant={tab === 'titipan' ? 'primary' : 'secondary'} onClick={() => setTab('titipan')}>Titipan</Button>
          <Button variant={tab === 'kantin' ? 'primary' : 'secondary'} onClick={() => setTab('kantin')}>Master Kantin</Button>
        </div>
      </div>

      {tab === 'kantin' && (
        <CrudTable
          table="kantin"
          title="Master Kantin"
          fields={[
            { key: 'nama', label: 'Nama Kantin', type: 'text', required: true, validate: (v) => validateTeksWajib(v, 'Nama kantin', 3, 60) },
            { key: 'alamat', label: 'Alamat', type: 'text' },
            { key: 'kontak', label: 'Kontak', type: 'text' },
            { key: 'persen_bagi_hasil', label: 'Persen Bagi Hasil (%)', type: 'number', required: true, min: 0, max: 100, validate: (v) => validatePersen(Number(v)) },
            { key: 'aktif', label: 'Aktif', type: 'boolean' },
          ]}
        />
      )}

      {tab === 'titipan' && (
        <>
          <div className="flex justify-end mb-3"><Button onClick={() => setModalOpen(true)}>+ Kirim Titipan</Button></div>
          <div className="overflow-x-auto bg-paper border-2 border-ink rounded-2xl shadow-doodle-sm">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-left text-xs uppercase text-inkSoft border-b-2 border-ink">
                  <th className="px-4 py-3">Kantin</th><th className="px-4 py-3">Tgl Kirim</th><th className="px-4 py-3">Produk</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={5} className="text-center py-8 text-inkSoft">Memuat...</td></tr>}
                {titipan.map((t) => (
                  <tr key={t.id} className="border-b border-ink/10 last:border-none">
                    <td className="px-4 py-3">{t.kantin?.nama}</td>
                    <td className="px-4 py-3">{new Date(t.tanggal_kirim).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 text-xs">{(t.titipan_kantin_detail || []).map((d) => (d as any).produk?.nama).join(', ')}</td>
                    <td className="px-4 py-3"><Badge tone={t.settled ? 'ok' : 'warn'}>{t.settled ? 'Settled' : 'Berjalan'}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      {!t.settled && <Button variant="secondary" className="!text-xs !px-3 !py-1.5" onClick={() => openSettle(t)}>Input & Settle</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Kirim Titipan Baru">
        <FieldWrap label="Kantin Tujuan">
          <Select value={kantinId} onChange={(e) => setKantinId(e.target.value)}>
            <option value="">-- pilih kantin --</option>
            {kantinList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </Select>
        </FieldWrap>
        <p className="font-bold text-sm mb-2">Produk yang Dititipkan</p>
        {items.map((it, i) => (
          <div key={i} className="mb-2 p-3 bg-cream/60 border-2 border-ink/15 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Select value={it.produk_id} onChange={(e) => updateItemRow(i, 'produk_id', e.target.value)} className="flex-1 min-w-0">
                <option value="">-- pilih produk --</option>
                {produkList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </Select>
              <button
                type="button"
                onClick={() => removeItemRow(i)}
                title="Hapus baris"
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border-2 border-ink/20 text-inkSoft hover:border-red hover:text-red transition"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-2">
              <TextInput type="number" placeholder="Qty" value={it.qty} onChange={(e) => updateItemRow(i, 'qty', e.target.value)} className="flex-1 min-w-0" />
              <TextInput type="number" placeholder="Harga satuan" value={it.harga} onChange={(e) => updateItemRow(i, 'harga', e.target.value)} className="flex-1 min-w-0" />
            </div>
          </div>
        ))}
        <Button variant="secondary" onClick={addItemRow} className="w-full mb-3 !text-xs">+ Tambah Baris Produk</Button>
        <Button onClick={kirimTitipan} className="w-full">Kirim Titipan</Button>
      </Modal>

      <Modal open={!!settleModal} onClose={() => setSettleModal(null)} title="Input Qty Terjual & Settlement">
        <p className="text-xs text-inkSoft mb-3">Sisa otomatis dihitung, dan bagi hasil ke kantin dicatat sebagai pengeluaran.</p>
        {(settleModal?.titipan_kantin_detail || []).map((d) => (
          <FieldWrap key={d.id} label={`${(d as any).produk?.nama} (dititipkan: ${d.qty_dititipkan})`}>
            <TextInput
              type="number"
              max={d.qty_dititipkan}
              value={settleQty[d.id] ?? ''}
              onChange={(e) => setSettleQty({ ...settleQty, [d.id]: e.target.value })}
            />
          </FieldWrap>
        ))}
        <Button onClick={simpanQtyTerjual} className="w-full mt-2">Simpan & Settlement</Button>
      </Modal>
    </div>
  );
}
