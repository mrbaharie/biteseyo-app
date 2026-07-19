'use client';
import CrudTable from '@/components/CrudTable';
import { validateTeksWajib } from '@/lib/validation';

export default function KategoriPage() {
  return (
    <CrudTable
      table="kategori_produk"
      title="Kategori Produk"
      fields={[
        { key: 'nama', label: 'Nama Kategori', type: 'text', required: true, validate: (v) => validateTeksWajib(v, 'Nama kategori', 2, 40) },
      ]}
    />
  );
}
