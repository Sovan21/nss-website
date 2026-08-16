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

export async function POST(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { data, error } = await auth.supabaseAdmin.from('events').insert([body]).select();
    if (error) throw error;
    return NextResponse.json({ success: true, event: data?.[0] });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { data, error } = await auth.supabaseAdmin.from('events').update(updates).eq('id', id).select();
    if (error) throw error;
    return NextResponse.json({ success: true, event: data?.[0] });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id, banner_url, gallery_urls } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    // Clean up storage
    const urlsToDelete = [banner_url, ...(gallery_urls || [])].filter(Boolean);
    for (const url of urlsToDelete) {
      try {
        const cleanUrl = url.split('?')[0];
        let filePath = '';
        if (cleanUrl.includes('/nss-images/')) {
          filePath = decodeURIComponent(cleanUrl.split('/nss-images/')[1]);
        } else {
          filePath = decodeURIComponent(cleanUrl.split('/').pop());
        }
        if (filePath) await auth.supabaseAdmin.storage.from('nss-images').remove([filePath]);
      } catch (e) {
        console.error('Storage deletion error:', e);
      }
    }

    const { error } = await auth.supabaseAdmin.from('events').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}


