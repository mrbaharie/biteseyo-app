'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import { FieldWrap, Select, TextInput, TextArea } from '@/components/ui/Input';
import { rupiah, validateTeksWajib } from '@/lib/validation';
import { JenisRiwayatModal, KategoriPengeluaran, ModalUsaha, Pengeluaran, RiwayatModal } from '@/lib/types';

export default function KeuanganPage() {
  const supabase = createClient();
  const [modal, setModal] = useState<ModalUsaha | null>(null);
  const [riwayat, setRiwayat] = useState<RiwayatModal[]>([]);
  const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriPengeluaran[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpenModal, setModalOpenModal] = useState(false);
  const [jenisModal, setJenisModal] = useState<JenisRiwayatModal>('setor');
  const [nominalModal, setNominalModal] = useState('');
  const [ketModal, setKetModal] = useState('');

  const [pengeluaranModalOpen, setPengeluaranModalOpen] = useState(false);
  const [kategoriId, setKategoriId] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [ketPengeluaran, setKetPengeluaran] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const [{ data: m }, { data: r }, { data: p }, { data: k }] = await Promise.all([
      supabase.from('modal_usaha').select('*').eq('id', 1).single(),
      supabase.from('riwayat_modal').select('*').order('tanggal', { ascending: false }).limit(20),
      supabase.from('pengeluaran').select('*, kategori_pengeluaran(*)').order('tanggal', { ascending: false }).limit(20),
      supabase.from('kategori_pengeluaran').select('*').eq('aktif', true).order('nama'),
    ]);
    setModal(m); setRiwayat(r || []); setPengeluaran((p as any) || []); setKategoriList(k || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function simpanModal() {
    const nominal = Number(nominalModal);
    if (isNaN(nominal) || nominal <= 0) { alert('Nominal harus lebih dari 0'); return; }
    const { error } = await supabase.from('riwayat_modal').insert({ jenis: jenisModal, nominal, keterangan: ketModal.trim() || null });
    if (error) { alert('Gagal simpan: ' + error.message); return; }
    setModalOpenModal(false); setNominalModal(''); setKetModal('');
    load();
  }

  function validatePengeluaran() {
    const errs: Record<string, string> = {};
    if (!kategoriId) errs.kategori = 'Kategori wajib dipilih';
    if (!jumlah || Number(jumlah) <= 0) errs.jumlah = 'Jumlah harus lebih dari 0';
    const eKet = validateTeksWajib(ketPengeluaran, 'Keterangan', 3, 150); if (eKet) errs.keterangan = eKet;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function simpanPengeluaran() {
    if (!validatePengeluaran()) return;
    const { error } = await supabase.from('pengeluaran').insert({
      kategori_id: Number(kategoriId), jumlah: Number(jumlah), keterangan: ketPengeluaran.trim(),
    });
    if (error) { alert('Gagal simpan: ' + error.message); return; }
    setPengeluaranModalOpen(false); setKategoriId(''); setJumlah(''); setKetPengeluaran('');
    load();
  }

  return (
    <div>
      <h1 className="font-doodle text-3xl mb-1">Keuangan</h1>
      <p className="text-inkSoft text-sm mb-6">Modal usaha, riwayat setor/tarik, dan pengeluaran operasional</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <p className="text-xs font-bold text-inkSoft mb-1">🐷 Saldo Modal Usaha</p>
          <p className="font-doodle text-3xl font-bold mb-3">{modal ? rupiah(modal.saldo) : '-'}</p>
          <Button onClick={() => setModalOpenModal(true)} className="w-full">+ Setor / Tarik Modal</Button>
        </Card>
        <Card>
          <p className="text-xs font-bold text-inkSoft mb-1">📉 Catat Pengeluaran</p>
          <p className="text-inkSoft text-sm mb-3">Biaya operasional di luar bahan baku (yang tercatat lewat Mutasi Stok)</p>
          <Button onClick={() => setPengeluaranModalOpen(true)} variant="secondary" className="w-full">+ Catat Pengeluaran</Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-bold mb-3">Riwayat Modal</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {riwayat.map((r) => (
              <div key={r.id} className="flex justify-between text-sm border-b border-ink/10 pb-2">
                <div>
                  <p className="font-semibold capitalize">{r.jenis}</p>
                  <p className="text-xs text-inkSoft">{r.keterangan ?? '-'} · {new Date(r.tanggal).toLocaleDateString('id-ID')}</p>
                </div>
                <span className={r.jenis === 'setor' ? 'text-mintDeep font-bold' : 'text-red font-bold'}>{r.jenis === 'setor' ? '+' : '-'}{rupiah(r.nominal)}</span>
              </div>
            ))}
            {riwayat.length === 0 && <p className="text-inkSoft text-sm">Belum ada riwayat</p>}
          </div>
        </Card>
        <Card>
          <h2 className="font-bold mb-3">Riwayat Pengeluaran</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {pengeluaran.map((p) => (
              <div key={p.id} className="flex justify-between text-sm border-b border-ink/10 pb-2">
                <div>
                  <p className="font-semibold">{(p as any).kategori_pengeluaran?.nama}</p>
                  <p className="text-xs text-inkSoft">{p.keterangan} · {new Date(p.tanggal).toLocaleDateString('id-ID')}</p>
                </div>
                <span className="text-red font-bold">-{rupiah(p.jumlah)}</span>
              </div>
            ))}
            {pengeluaran.length === 0 && <p className="text-inkSoft text-sm">Belum ada pengeluaran</p>}
          </div>
        </Card>
      </div>

      <Modal open={modalOpenModal} onClose={() => setModalOpenModal(false)} title="Setor / Tarik Modal">
        <FieldWrap label="Jenis">
          <Select value={jenisModal} onChange={(e) => setJenisModal(e.target.value as JenisRiwayatModal)}>
            <option value="setor">Setor Modal</option>
            <option value="tarik">Tarik Modal</option>
          </Select>
        </FieldWrap>
        <FieldWrap label="Nominal">
          <TextInput type="number" value={nominalModal} onChange={(e) => setNominalModal(e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Keterangan (opsional)">
          <TextArea rows={2} value={ketModal} onChange={(e) => setKetModal(e.target.value)} />
        </FieldWrap>
        <Button onClick={simpanModal} className="w-full mt-2">Simpan</Button>
      </Modal>

      <Modal open={pengeluaranModalOpen} onClose={() => setPengeluaranModalOpen(false)} title="Catat Pengeluaran">
        <FieldWrap label="Kategori" error={errors.kategori}>
          <Select value={kategoriId} error={errors.kategori} onChange={(e) => setKategoriId(e.target.value)}>
            <option value="">-- pilih kategori --</option>
            {kategoriList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </Select>
        </FieldWrap>
        <FieldWrap label="Jumlah" error={errors.jumlah}>
          <TextInput type="number" value={jumlah} error={errors.jumlah} onChange={(e) => setJumlah(e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Keterangan" error={errors.keterangan}>
          <TextArea rows={2} value={ketPengeluaran} error={errors.keterangan} onChange={(e) => setKetPengeluaran(e.target.value)} />
        </FieldWrap>
        <Button onClick={simpanPengeluaran} className="w-full mt-2">Simpan</Button>
      </Modal>
    </div>
  );
}
