import { supabase } from './supabase';

// Generate UUID if not exists
function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Get or create Visitor ID (persistent across browser restarts)
export function getOrCreateVisitorId() {
  if (typeof window === 'undefined') return null;
  try {
    let visitorId = localStorage.getItem('nss_visitor_id');
    if (!visitorId) {
      visitorId = generateUUID();
      localStorage.setItem('nss_visitor_id', visitorId);
    }
    return visitorId;
  } catch (e) {
    console.warn('localStorage is not available, using session-only ID:', e.message);
    if (typeof window !== 'undefined') {
      if (!window.__nss_visitor_id) {
        window.__nss_visitor_id = generateUUID();
      }
      return window.__nss_visitor_id;
    }
    return null;
  }
}

/**
 * Increments the total visitor count in the database if this is a new visitor.
 * Utilizes localStorage to track uniqueness and prevent duplicate increments on reload.
 */
export async function trackVisitor() {
  if (typeof window === 'undefined') return;

  try {
    // Check/Create persistent visitor ID
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    // Check if this visitor was already counted in the database
    const alreadyCounted = localStorage.getItem('nss_counted_in_db');
    if (!alreadyCounted) {
      const { error } = await supabase.rpc('increment_visitor_count');
      if (!error) {
        // Mark as counted to prevent increments on future page reloads or visits
        localStorage.setItem('nss_counted_in_db', 'true');
      } else {
        console.warn('Failed to increment database visitor count:', error.message);
      }
    }
  } catch (e) {
    console.warn('Visitor tracking error:', e.message);
  }
}

/**
 * Fetches the total visitor count from the database.
 */
export async function fetchVisitorCount() {
  try {
    const { data, error } = await supabase
      .from('visitor_counts')
      .select('count')
      .eq('id', 1)
      .single();

    if (error) throw error;

    return {
      total: data?.count ?? 1420,
      success: true
    };
  } catch (err) {
    console.warn('Error fetching visitor count:', err.message);
    return {
      total: 1420,
      success: false
    };
  }
}
