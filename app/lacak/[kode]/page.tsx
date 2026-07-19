import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { rupiah } from '@/lib/validation';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Konfirmasi',
  dikonfirmasi: 'Dikonfirmasi',
  diproses: 'Sedang Diproses',
  dikirim: 'Sedang Dikirim',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

export default async function LacakDetailPage({ params }: { params: { kode: string } }) {
  const supabase = createClient();
  // Memanggil fungsi khusus (security definer) supaya pelanggan tanpa login
  // hanya bisa lihat SATU pesanan sesuai kode -- bukan seluruh tabel transaksi.
  const { data, error } = await supabase.rpc('fn_lacak_pesanan', { p_kode_lacak: params.kode });
  const row = Array.isArray(data) ? data[0] : null;

  return (
    <main className="max-w-md mx-auto px-4 py-14 text-center">
      <Link href="/" className="text-sm font-semibold">← kembali ke menu</Link>
      <h1 className="font-doodle text-3xl md:text-4xl mt-2 mb-6">Status Pesanan</h1>

      <div className="bg-paper border-2 border-ink rounded-2xl p-6 shadow-doodle-sm text-left">
        {(!row || error) ? (
          <p className="text-red font-pen text-lg text-center">Kode pesanan tidak ditemukan. Cek kembali kode dari strukmu ya~</p>
        ) : (
          <>
            <p className="text-xs text-inkSoft mb-1">No. Transaksi</p>
            <p className="font-bold mb-3">{row.no_transaksi}</p>
            <p className="text-xs text-inkSoft mb-1">Status</p>
            <span className="inline-block bg-yellow px-3 py-1 rounded-full text-sm font-bold mb-3">{STATUS_LABEL[row.status] ?? row.status}</span>
            <p className="text-xs text-inkSoft mb-1">Total</p>
            <p className="font-doodle text-2xl text-pinkDeep font-bold">{rupiah(row.grand_total)}</p>
          </>
        )}
      </div>
    </main>
  );
}
