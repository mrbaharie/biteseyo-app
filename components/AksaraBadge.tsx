// Badge kecil "Powered by AKSARA+" — dipakai di footer publik, sidebar dashboard
// owner, dan halaman login staff. variant="light" untuk latar terang (footer/login),
// variant="dark" untuk latar gelap (sidebar).
// Catatan: sengaja pakai <span>, bukan <a>/onClick, supaya komponen ini tetap bisa
// dipakai di Server Component (mis. app/page.tsx) tanpa perlu 'use client'.
export default function AksaraBadge({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const textColor = variant === 'dark' ? 'text-cream/45' : 'text-inkSoft/60';
  const markBg = variant === 'dark' ? 'bg-cream/15 text-cream/70' : 'bg-ink/10 text-ink/60';

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] ${textColor} select-none`}
      title="AKSARA+ — platform aplikasi UMKM"
    >
      <span className={`flex items-center justify-center w-4 h-4 rounded-full font-bold text-[9px] leading-none ${markBg}`}>
        A+
      </span>
      Powered by AKSARA+
    </span>
  );
}
