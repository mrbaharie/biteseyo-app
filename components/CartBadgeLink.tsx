'use client';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';

export default function CartBadgeLink() {
  const { items } = useCart();
  const count = items.reduce((s, i) => s + i.qty, 0);
  return (
    <Link href="/pesan" className="relative bg-ink text-cream rounded-full px-4 py-2 text-sm font-bold flex items-center gap-1.5">
      🛒 <span className="hidden sm:inline">Keranjang</span>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-pinkDeep text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-cream">
          {count}
        </span>
      )}
    </Link>
  );
}
