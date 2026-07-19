import { createClient } from '@/lib/supabase/server';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { rupiah } from '@/lib/validation';

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createClient();

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);

  const { data: pesananHariIni } = await supabase
    .from('transaksi')
    .select('id, no_transaksi, grand_total, status, subtotal_produk, hpp, pelanggan:pelanggan_id(nama)')
    .gte('tanggal', todayStart.toISOString())
    .order('tanggal', { ascending: false });

  const { data: stokKritis } = await supabase
    .from('bahan_baku')
    .select('id, nama, stok_saat_ini, stok_minimum')
    .order('nama');
  const bahanKritis = (stokKritis || []).filter((b) => Number(b.stok_saat_ini) <= Number(b.stok_minimum));

  const omzetHariIni = (pesananHariIni || []).filter(p => p.status !== 'dibatalkan').reduce((s, p: any) => s + Number(p.subtotal_produk), 0);
  const labaHariIni = (pesananHariIni || []).filter(p => p.status !== 'dibatalkan').reduce((s, p: any) => s + (Number(p.subtotal_produk) - Number(p.hpp)), 0);
  const pesananBaru = (pesananHariIni || []).filter(p => p.status === 'pending').length;

  return (
    <div>
      <h1 className="font-doodle text-3xl mb-1">Dashboard</h1>
      <p className="text-inkSoft text-sm mb-6">Halo, owner! Ini ringkasan hari ini~</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-pink/15 to-transparent">
          <p className="text-xs font-bold text-inkSoft mb-1">💵 Omzet Hari Ini</p>
          <p className="font-doodle text-2xl font-bold">{rupiah(omzetHariIni)}</p>
        </Card>
        <Card className="bg-gradient-to-br from-mint/25 to-transparent">
          <p className="text-xs font-bold text-inkSoft mb-1">📈 Laba Kotor Hari Ini</p>
          <p className="font-doodle text-2xl font-bold">{rupiah(labaHariIni)}</p>
        </Card>
        <Card className="bg-gradient-to-br from-yellow/25 to-transparent">
          <p className="text-xs font-bold text-inkSoft mb-1">🧾 Pesanan Baru</p>
          <p className="font-doodle text-2xl font-bold">{pesananBaru}</p>
        </Card>
        <Card className="bg-gradient-to-br from-lavender/25 to-transparent">
          <p className="text-xs font-bold text-inkSoft mb-1">⚠️ Stok Kritis</p>
          <p className="font-doodle text-2xl font-bold">{bahanKritis.length} bahan</p>
        </Card>
      </div>

      {bahanKritis.length > 0 && (
        <Card className="mb-8 border-red">
          <h2 className="font-bold mb-2">⚠️ Bahan baku perlu segera direstok</h2>
          <ul className="text-sm space-y-1">
            {bahanKritis.map((b) => (
              <li key={b.id}>{b.nama} — sisa {b.stok_saat_ini} (minimum {b.stok_minimum})</li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="font-bold mb-3">Pesanan Hari Ini</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-left text-xs text-inkSoft border-b-2 border-ink">
                <th className="py-2 pr-3">No Transaksi</th><th className="py-2 pr-3">Pelanggan</th><th className="py-2 pr-3">Total</th><th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(pesananHariIni || []).length === 0 && <tr><td colSpan={4} className="text-center py-6 text-inkSoft">Belum ada pesanan hari ini</td></tr>}
              {(pesananHariIni || []).map((p: any) => (
                <tr key={p.id} className="border-b border-ink/10 last:border-none">
                  <td className="py-2 pr-3">{p.no_transaksi}</td>
                  <td className="py-2 pr-3">{p.pelanggan?.nama ?? '-'}</td>
                  <td className="py-2 pr-3">{rupiah(p.grand_total)}</td>
                  <td className="py-2"><Badge tone={p.status === 'selesai' ? 'ok' : p.status === 'dibatalkan' ? 'danger' : 'warn'}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
