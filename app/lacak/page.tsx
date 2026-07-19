'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TextInput, FieldWrap } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LacakEntryPage() {
  const [kode, setKode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function cek() {
    const val = kode.trim().toUpperCase();
    if (!val) { setError('Masukkan kode pesanan dulu ya~'); return; }
    router.push(`/lacak/${val}`);
  }

  return (
    <main className="max-w-md mx-auto px-4 py-14 text-center">
      <Link href="/" className="text-sm font-semibold">← kembali ke menu</Link>
      <h1 className="font-doodle text-3xl md:text-4xl mt-2 mb-2">Lacak Pesanan</h1>
      <p className="font-pen text-pinkDeep text-lg mb-6">masukin kode dari struk kamu~</p>
      <div className="bg-paper border-2 border-ink rounded-2xl p-6 shadow-doodle-sm">
        <FieldWrap label="Kode Pesanan" error={error}>
          <TextInput value={kode} onChange={(e) => setKode(e.target.value)} placeholder="Contoh: BS-7F2K9A" error={error} />
        </FieldWrap>
        <Button onClick={cek} className="w-full">Cek Status</Button>
      </div>
    </main>
  );
}
