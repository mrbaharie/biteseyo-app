'use client';
import { ReactNode } from 'react';

export default function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-paper border-2 border-ink rounded-2xl shadow-doodle max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-doodle text-2xl">{title}</h3>
          <button onClick={onClose} className="text-xl font-bold px-2 hover:text-pinkDeep">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
