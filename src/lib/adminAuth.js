import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Verify the caller is an authenticated admin.
 * Used across all /api/admin/* routes.
 *
 * @param {Request} request 
 * @returns {Promise<{ error?: string, status?: number, supabaseAdmin?: any, user?: any }>}
 */
export async function verifyAdmin(request) {
  if (!supabaseServiceKey) return { error: 'Server configuration error', status: 500 };
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return { error: 'Unauthorized', status: 401 };
  
  const token = authHeader.split(' ')[1];
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } });
  
  const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
  if (tokenError || !user) return { error: 'Unauthorized', status: 401 };

  const { data: adminRecord } = await supabaseAdmin.from('admins').select('email').eq('email', user.email).maybeSingle();
  if (!adminRecord) {
    const { data: callerProfile } = await supabaseAdmin.from('registrations').select('role').eq('id', user.id).maybeSingle();
    if (!callerProfile || callerProfile.role !== 'admin') return { error: 'Forbidden', status: 403 };
  }
  
  return { supabaseAdmin, user };
}
