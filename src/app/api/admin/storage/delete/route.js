export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifyAdmin(request) {
  if (!supabaseServiceKey) return { error: 'Missing service role key', status: 500 };
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return { error: 'Missing authorization token', status: 401 };
  
  const token = authHeader.split(' ')[1];
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) } });
  
  const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
  if (tokenError || !user) return { error: 'Invalid or expired token', status: 401 };

  const { data: adminRecord, error: adminErr } = await supabaseAdmin.from('admins').select('email').eq('email', user.email).maybeSingle();
  if (!adminRecord) {
    const { data: callerProfile } = await supabaseAdmin.from('registrations').select('role').eq('id', user.id).maybeSingle();
    if (!callerProfile || callerProfile.role !== 'admin') {
      return { error: 'Forbidden: Admin access required', status: 403 };
    }
  }
  return { supabaseAdmin, user };
}

export async function DELETE(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    const cleanUrl = url.split('?')[0];
    let filePath = '';
    if (cleanUrl.includes('/nss-images/')) {
      filePath = decodeURIComponent(cleanUrl.split('/nss-images/')[1]);
    } else {
      filePath = decodeURIComponent(cleanUrl.split('/').pop());
    }

    if (!filePath) {
      return NextResponse.json({ error: 'Could not parse file path' }, { status: 400 });
    }

    const { error: deleteError } = await auth.supabaseAdmin.storage
      .from('nss-images')
      .remove([filePath]);

    if (deleteError) {
      console.error("Storage delete error:", deleteError);
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("DELETE /api/admin/storage/delete error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


