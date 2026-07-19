'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { rupiah } from '@/lib/validation';
import { StatusTransaksi, Transaksi } from '@/lib/types';

const STATUS_TONE: Record<StatusTransaksi, 'default' | 'ok' | 'warn' | 'danger'> = {
  pending: 'warn', dikonfirmasi: 'default', diproses: 'default', dikirim: 'default', selesai: 'ok', dibatalkan: 'danger',
};

export default function PesananPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('semua');
  const [detail, setDetail] = useState<Transaksi | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('transaksi')
      .select('*, pelanggan:pelanggan_id(*), detail_transaksi(*, produk:produk_id(nama))')
      .order('tanggal', { ascending: false })
      .limit(100);
    setRows((data as any) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(t: Transaksi, status: StatusTransaksi) {
    if (status === 'diproses' && t.status === 'pending') {
      // konfirmasi pembayaran sekaligus potong stok bahan baku otomatis lewat stored procedure
      const { data: userData } = await supabase.auth.getUser();
      const { data: staff } = await supabase.from('staff').select('id').eq('auth_user_id', userData.user?.id).single();
      const { error } = await supabase.rpc('sp_konfirmasi_transaksi', { p_transaksi_id: t.id, p_staff_id: staff?.id ?? null });
      if (error) { alert('Gagal konfirmasi: ' + error.message); return; }
    } else {
      await supabase.from('transaksi').update({ status }).eq('id', t.id);
    }
    load();
  }

  const filtered = filter === 'semua' ? rows : rows.filter((r) => r.status === filter);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-doodle text-3xl">Pesanan</h1>
          <p className="text-inkSoft text-sm">Konfirmasi pembayaran otomatis potong stok bahan baku</p>
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full sm:w-52">
          <option value="semua">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="diproses">Diproses</option>
          <option value="dikirim">Dikirim</option>
          <option value="selesai">Selesai</option>
          <option value="dibatalkan">Dibatalkan</option>
        </Select>
      </div>

      <div className="overflow-x-auto bg-paper border-2 border-ink rounded-2xl shadow-doodle-sm">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-xs uppercase text-inkSoft border-b-2 border-ink">
              <th className="px-4 py-3">No Transaksi</th><th className="px-4 py-3">Pelanggan</th><th className="px-4 py-3">Metode</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-8 text-inkSoft">Memuat...</td></tr>}
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-ink/10 last:border-none">
                <td className="px-4 py-3">
                  <button className="font-semibold underline" onClick={() => setDetail(t)}>{t.no_transaksi}</button>
                </td>
                <td className="px-4 py-3">{t.pelanggan?.nama}</td>
                <td className="px-4 py-3 capitalize">{t.metode_pengiriman.replace('_', ' ')}</td>
                <td className="px-4 py-3">{rupiah(t.grand_total)}</td>
                <td className="px-4 py-3"><Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <Select value={t.status} onChange={(e) => updateStatus(t, e.target.value as StatusTransaksi)} className="!py-1.5 !text-xs w-40">
                    <option value="pending">Pending</option>
                    <option value="diproses">Diproses (potong stok)</option>
                    <option value="dikirim">Dikirim</option>
                    <option value="selesai">Selesai</option>
                    <option value="dibatalkan">Dibatalkan</option>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Detail ${detail?.no_transaksi ?? ''}`}>
        {detail && (
          <div className="text-sm space-y-3">
            <p><b>Pelanggan:</b> {detail.pelanggan?.nama} ({detail.pelanggan?.no_wa})</p>
            <p><b>Alamat:</b> {detail.alamat_text ?? '-'}</p>
            <p><b>Catatan:</b> {detail.catatan ?? '-'}</p>
            <div className="border-t-2 border-dashed border-ink pt-2">
              {(detail.detail_transaksi || []).map((d) => (
                <div key={d.id} className="flex justify-between py-1">
                  <span>{(d as any).produk?.nama} x{d.qty}</span>
                  <span>{rupiah(d.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold border-t-2 border-ink pt-2">
              <span>Total</span><span>{rupiah(detail.grand_total)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
