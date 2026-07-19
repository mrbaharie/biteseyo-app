'use client';
import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export default function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base = 'font-body font-bold rounded-full px-5 py-2.5 text-sm transition disabled:opacity-40 disabled:cursor-not-allowed';
  const styles: Record<string, string> = {
    primary: 'bg-pinkDeep text-white border-2 border-ink shadow-doodle hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#4A3B3B]',
    secondary: 'bg-cream text-ink border-2 border-ink hover:bg-mint',
    ghost: 'bg-transparent text-ink hover:bg-ink/5',
    danger: 'bg-red text-white border-2 border-ink hover:bg-red/90',
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
