'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CartItem } from '@/lib/types';

type CartCtx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  setQty: (produk_id: number, qty: number) => void;
  remove: (produk_id: number) => void;
  clear: () => void;
  subtotal: number;
};

const Ctx = createContext<CartCtx | null>(null);

// Cart disimpan di localStorage supaya isi keranjang tidak hilang kalau
// pelanggan reload halaman -- wajar untuk aplikasi nyata (beda dengan
// sandbox artifact yang melarang localStorage).
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('biteseyo_cart');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('biteseyo_cart', JSON.stringify(items));
  }, [items]);

  function add(item: CartItem) {
    setItems((prev) => {
      const existing = prev.find((i) => i.produk_id === item.produk_id);
      if (existing) {
        return prev.map((i) => i.produk_id === item.produk_id ? { ...i, qty: i.qty + item.qty } : i);
      }
      return [...prev, item];
    });
  }
  function setQty(produk_id: number, qty: number) {
    setItems((prev) => qty <= 0 ? prev.filter((i) => i.produk_id !== produk_id) : prev.map((i) => i.produk_id === produk_id ? { ...i, qty } : i));
  }
  function remove(produk_id: number) {
    setItems((prev) => prev.filter((i) => i.produk_id !== produk_id));
  }
  function clear() { setItems([]); }

  const subtotal = items.reduce((sum, i) => sum + i.harga * i.qty, 0);

  return <Ctx.Provider value={{ items, add, setQty, remove, clear, subtotal }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart harus dipakai di dalam <CartProvider>');
  return ctx;
}
