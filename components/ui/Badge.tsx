export default function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'ok' | 'warn' | 'danger' }) {
  const tones: Record<string, string> = {
    default: 'bg-lavender text-ink',
    ok: 'bg-mint text-[#215c40]',
    warn: 'bg-yellow text-[#8a5a00]',
    danger: 'bg-red/25 text-[#8a2a1a]',
  };
  return <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${tones[tone]}`}>{children}</span>;
}
