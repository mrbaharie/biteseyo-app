import { createClient } from '@/lib/supabase/server';
import MenuGrid from '@/components/MenuGrid';
import Link from 'next/link';
import CartBadgeLink from '@/components/CartBadgeLink';
import AksaraBadge from '@/components/AksaraBadge';

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createClient();
  const { data: produk } = await supabase
    .from('produk')
    .select('*')
    .eq('aktif', true)
    .order('urutan', { ascending: true });

  return (
    <main>
      <nav className="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b-2 border-ink">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="font-doodle text-xl md:text-2xl flex items-center gap-2">
            <span className="animate-pulse">🍡</span> BiteSeyo
          </div>
          <div className="hidden sm:flex gap-6 text-sm font-semibold">
            <a href="#menu">Menu</a>
            <Link href="/lacak">Lacak Pesanan</Link>
          </div>
          <CartBadgeLink />
        </div>
      </nav>

      <section className="text-center px-4 md:px-6 pt-12 md:pt-16 pb-8 relative overflow-hidden">
        <span className="hidden md:inline absolute text-3xl top-6 left-[8%] opacity-50">🍥</span>
        <span className="hidden md:inline absolute text-3xl top-16 right-[10%] opacity-50">✨</span>
        <h1 className="font-doodle text-4xl md:text-6xl leading-tight mb-3">
          annyeong~ mau ngemil<br />
          <span className="text-pinkDeep relative">apa hari ini? 🐣</span>
        </h1>
        <p className="text-inkSoft text-base md:text-lg max-w-md mx-auto mb-6">
          Jajanan Korea rumahan, dibuat fresh tiap hari. Pesan online, ambil sendiri, atau COD di titik terdekat kamu~
        </p>
        <a href="#menu" className="inline-block bg-pink text-ink border-2 border-ink font-doodle font-bold text-lg px-8 py-3 rounded-full shadow-doodle hover:-translate-y-1 transition">
          Lihat Menu →
        </a>
      </section>

      <section id="menu" className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="font-doodle text-3xl md:text-4xl">Menu Hari Ini</h2>
          <span className="font-pen text-pinkDeep text-lg">semua dibuat pas kamu order~ 🔥</span>
        </div>
        {produk && produk.length > 0
          ? <MenuGrid produk={produk} />
          : <p className="text-center text-inkSoft py-10">Menu belum tersedia saat ini, coba lagi nanti ya~</p>}
      </section>

      <footer className="bg-ink text-cream text-center py-8 px-4 mt-10">
        <div className="font-doodle text-xl mb-1">BiteSeyo 🍡</div>
        <p className="text-xs opacity-80">dibuat dengan cinta di dapur kecil kami</p>
        <div className="mt-3 flex justify-center"><AksaraBadge variant="dark" /></div>
      </footer>
    </main>
  );
}
