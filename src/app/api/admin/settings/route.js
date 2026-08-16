export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifyAdmin(request) {
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

// Admins only PUT (update settings/site_content)
export async function PUT(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, ...updates } = body;
    
    let result;
    if (id) {
      result = await auth.supabaseAdmin.from('site_content').update(updates).eq('id', id).select();
    } else {
      result = await auth.supabaseAdmin.from('site_content').insert([updates]).select();
    }
    
    if (result.error) throw result.error;
    return NextResponse.json({ success: true, settings: result.data?.[0] });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}


