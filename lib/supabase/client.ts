'use client';

import { createBrowserClient } from '@supabase/ssr';

// Client Supabase untuk dipakai di Client Components ('use client').
// Otomatis membawa session login staff (lewat cookie) untuk request yang butuh RLS authenticated.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
