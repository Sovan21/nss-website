/**
 * Supabase Client Configuration
 * 
 * BROWSER-ONLY — both exports use the public anon key.
 * Service role key is NEVER used in the browser; it is only used
 * inside Next.js API routes (server-side).
 * 
 * `supabaseAdmin` is kept as a named export for backward-compatibility
 * with admin UI components (separate auth storage key).
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env variables.');
}

if (typeof window !== 'undefined') {
  // Clean up error hash fragments from aborted OAuth (but preserve tab hashes like #about)
  try {
    const hash = window.location.hash;
    if (hash && hash.includes('error=') && hash.includes('error_description')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Public Client — used by public-facing pages (read-only queries, auth flows)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
    storageKey: 'nss-public-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Admin UI Client — uses the SAME anon key but a separate auth storage key
 * so admin and public sessions don't collide.
 * All write operations MUST go through server-side API routes.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
    storageKey: 'nss-admin-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

if (typeof window !== 'undefined') {
  // Clean up OAuth pending flag if present
  if (sessionStorage.getItem('nss_oauth_pending')) {
    sessionStorage.removeItem('nss_oauth_pending');
  }
}