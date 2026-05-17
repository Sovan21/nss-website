/**
 * Supabase Client Configuration
 * Provides isolated clients for public and admin sessions using separate storage keys.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nfmgklkenucufkqlsohu.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbWdrbGtlbnVjdWZrcWxzb2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxOTQwMjAsImV4cCI6MjA4OTc3MDAyMH0.I9ufaMFIOFKrUpvpilILRdNEIFiUp0NYHbSjX4nKUto';

if (typeof window !== 'undefined') {
  // Force reload on Bfcache restore (back-forward cache) to prevent stuck loading states
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      window.location.reload();
    }
  });

  // Clean up error hash fragments from aborted OAuth
  try {
    const hash = window.location.hash;
    if (hash && hash.includes('error=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Public Client
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'nss-public-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Admin Client
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
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