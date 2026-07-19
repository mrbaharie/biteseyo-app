'use client';
import { Produk } from '@/lib/types';
import { rupiah } from '@/lib/validation';
import { useCart } from '@/components/CartProvider';
import { useState } from 'react';
import Link from 'next/link';

export default function MenuGrid({ produk }: { produk: Produk[] }) {
  const { add } = useCart();
  const [qty, setQty] = useState<Record<number, number>>({});

  function getQty(id: number) { return qty[id] ?? 1; }
  function changeQty(id: number, delta: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(1, getQty(id) + delta) }));
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
      {produk.map((p, i) => {
        const rotate = i % 3 === 0 ? '-rotate-1' : i % 3 === 1 ? 'rotate-1' : '-rotate-[3deg]';
        const plateBg = i % 3 === 0 ? 'bg-mint' : i % 3 === 1 ? 'bg-lavender' : 'bg-yellow';
        const soldOut = !p.tersedia;
        return (
          <div key={p.id} className={`relative bg-paper border-2 border-ink rounded-2xl p-3 md:p-4 shadow-doodle-sm transition hover:-translate-y-1 hover:shadow-doodle ${rotate} ${soldOut ? 'opacity-50' : ''}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-lavender/70 rotate-[-4deg] border border-ink/20" />
            <div className={`w-full aspect-square rounded-full border-2 border-ink flex items-center justify-center overflow-hidden mb-3 ${plateBg}`}>
              {p.foto_url
                ? <img src={p.foto_url} alt={p.nama} className="w-full h-full object-cover" />
                : <span className="text-4xl md:text-5xl">🍡</span>}
            </div>
            <h3 className="font-doodle text-lg md:text-xl leading-tight">{p.nama}</h3>
            <p className="text-xs text-inkSoft mb-2 line-clamp-2 min-h-[32px]">{p.deskripsi || ''}</p>
            <div className="flex items-center justify-between">
              <span className="font-doodle text-pinkDeep text-base md:text-lg font-bold">{rupiah(p.harga_jual)}</span>
              {!soldOut ? (
                <div className="flex items-center border-2 border-ink rounded-full overflow-hidden">
                  <button onClick={() => changeQty(p.id, -1)} className="w-7 h-7 font-bold">−</button>
                  <span className="w-6 text-center text-sm font-bold">{getQty(p.id)}</span>
                  <button onClick={() => changeQty(p.id, 1)} className="w-7 h-7 font-bold">+</button>
                </div>
              ) : <span className="text-xs text-inkSoft">Habis</span>}
            </div>
            {!soldOut && (
              <button
                onClick={() => add({ produk_id: p.id, nama: p.nama, harga: p.harga_jual, qty: getQty(p.id), foto_url: p.foto_url })}
                className="mt-2 w-full bg-ink text-cream rounded-full py-1.5 text-xs font-bold hover:bg-pinkDeep transition"
              >
                + Keranjang
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
