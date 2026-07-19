'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AksaraBadge from '@/components/AksaraBadge';

const NAV = [
  { href: '/owner/dashboard', label: '📊 Dashboard' },
  { href: '/owner/pesanan', label: '🧾 Pesanan' },
  { href: '/owner/produk', label: '🍢 Produk & Resep' },
  { href: '/owner/bahan-baku', label: '🧂 Bahan Baku' },
  { href: '/owner/stok', label: '📦 Mutasi Stok' },
  { href: '/owner/konsinyasi', label: '🏫 Konsinyasi Kantin' },
  { href: '/owner/keuangan', label: '💰 Keuangan' },
  { href: '/owner/kategori', label: '🏷️ Kategori Produk' },
  { href: '/owner/pengaturan', label: '⚙️ Pengaturan' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push('/owner/login');
    router.refresh();
  }

  return (
    <aside className="w-full md:w-60 shrink-0 bg-ink text-cream flex md:flex-col overflow-x-auto md:overflow-visible p-4 md:p-5 md:min-h-screen">
      <div className="hidden md:flex items-center gap-2 font-doodle text-2xl mb-6">
        🍡 BiteSeyo <span className="text-[10px] font-body bg-pink text-ink px-2 py-0.5 rounded-full font-bold">OPS</span>
      </div>
      <nav className="flex md:flex-col gap-1 md:gap-1 flex-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
              pathname?.startsWith(item.href) ? 'bg-pink text-ink' : 'text-cream/75 hover:bg-white/10 hover:text-cream'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <button onClick={logout} className="hidden md:block mt-4 text-xs text-cream/60 hover:text-cream text-left">
        ↩ Keluar
      </button>
      <div className="hidden md:block mt-2"><AksaraBadge variant="dark" /></div>
    </aside>
  );
}
