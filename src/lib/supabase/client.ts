import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Bypass Navigator.locks for the auth token — prevents concurrent API calls
// from timing out waiting for the exclusive LockManager lock (10s timeout).
// Trade-off: concurrent token refreshes are possible, but in practice the
// gotrue-js deduplication handles this; the timeout error is far worse.
const noLock = <R,>(_name: string, _timeout: number, fn: () => Promise<R>): Promise<R> => fn();

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { lock: noLock } }
  );
}
