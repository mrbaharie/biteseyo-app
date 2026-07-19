'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FieldWrap, TextInput } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import AksaraBadge from '@/components/AksaraBadge';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError('Email dan password wajib diisi'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError('Login gagal: ' + error.message); return; }
    router.push('/owner/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-4">
      <form onSubmit={login} className="bg-paper border-2 border-ink rounded-2xl p-8 w-full max-w-sm shadow-doodle">
        <div className="text-center mb-6">
          <div className="font-doodle text-3xl">🍡 BiteSeyo</div>
          <p className="text-inkSoft text-sm">Login Owner / Staff</p>
        </div>
        <FieldWrap label="Email" error={error ? ' ' : undefined}>
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@biteseyo.id" />
        </FieldWrap>
        <FieldWrap label="Password">
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </FieldWrap>
        {error && <p className="text-red font-pen text-base -mt-2 mb-3">✗ {error}</p>}
        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Masuk...' : 'Masuk'}</Button>
        <div className="flex justify-center mt-4"><AksaraBadge variant="light" /></div>
      </form>
    </main>
  );
}
