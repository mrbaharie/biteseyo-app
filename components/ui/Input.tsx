'use client';
import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

type FieldWrapProps = { label: string; error?: string | null; hint?: string; children: ReactNode };
export function FieldWrap({ label, error, hint, children }: FieldWrapProps) {
  return (
    <div className="mb-4">
      <label className="block font-bold text-sm mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-inkSoft mt-1">{hint}</p>}
      {error && <p className="text-red font-pen text-base mt-1">✗ {error}</p>}
    </div>
  );
}

const baseCls = 'w-full px-3 py-2.5 rounded-lg border-2 bg-cream font-body text-sm focus:outline-none focus:ring-2 focus:ring-pink/40';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement> & { error?: string | null }) {
  const { error, className = '', ...rest } = props;
  return <input className={`${baseCls} ${error ? 'border-red' : 'border-ink'} ${className}`} {...rest} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string | null }) {
  const { error, className = '', ...rest } = props;
  return <textarea className={`${baseCls} ${error ? 'border-red' : 'border-ink'} ${className}`} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement> & { error?: string | null }) {
  const { error, className = '', children, ...rest } = props;
  return <select className={`${baseCls} ${error ? 'border-red' : 'border-ink'} ${className}`} {...rest}>{children}</select>;
}
