'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { TextInput } from '@/components/ui/Input';
import { PengaturanSistem } from '@/lib/types';

// Halaman ini mengedit langsung tabel pengaturan_sistem (key-value).
// Ini praktik "parameterize" yang diminta: ubah tarif ongkir, lokasi toko, dsb
// tanpa perlu ubah kode aplikasi sama sekali.

export default function PengaturanPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<PengaturanSistem[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('pengaturan_sistem').select('*').order('kategori');
    setRows(data || []);
    const init: Record<string, string> = {};
    (data || []).forEach((r) => { init[r.kunci] = typeof r.nilai === 'string' ? r.nilai : JSON.stringify(r.nilai); });
    setValues(init);
  }
  useEffect(() => { load(); }, []);

  async function simpan(kunci: string) {
    setSaving(kunci);
    let parsed: any = values[kunci];
    // coba parse sebagai angka kalau memang angka, kalau tidak simpan sebagai string JSON
    if (!isNaN(Number(parsed)) && parsed.trim() !== '') parsed = Number(parsed);
    const { error } = await supabase.from('pengaturan_sistem').update({ nilai: parsed, updated_at: new Date().toISOString() }).eq('kunci', kunci);
    setSaving(null);
    if (error) alert('Gagal simpan: ' + error.message);
  }

  const grouped = rows.reduce((acc: Record<string, PengaturanSistem[]>, r) => {
    (acc[r.kategori] = acc[r.kategori] || []).push(r);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="font-doodle text-3xl mb-1">Pengaturan</h1>
      <p className="text-inkSoft text-sm mb-6">Ubah parameter bisnis tanpa perlu update aplikasi</p>

      {Object.entries(grouped).map(([kategori, items]) => (
        <Card key={kategori} className="mb-5">
          <h2 className="font-bold mb-3 capitalize">{kategori}</h2>
          {items.map((r) => (
            <div key={r.kunci} className="flex items-center justify-between py-2.5 border-b border-ink/10 last:border-none gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm">{r.kunci}</p>
                <p className="text-xs text-inkSoft">{r.deskripsi}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <TextInput
                  className="w-32 sm:w-40"
                  value={values[r.kunci] ?? ''}
                  onChange={(e) => setValues({ ...values, [r.kunci]: e.target.value })}
                />
                <Button variant="secondary" className="!text-xs !px-3 !py-1.5" disabled={saving === r.kunci} onClick={() => simpan(r.kunci)}>
                  {saving === r.kunci ? '...' : 'Simpan'}
                </Button>
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
