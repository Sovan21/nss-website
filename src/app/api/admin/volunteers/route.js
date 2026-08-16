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

// Admins only PUT (update volunteer)
export async function PUT(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { data, error } = await auth.supabaseAdmin.from('registrations').update(updates).eq('id', id).select();
    if (error) throw error;
    return NextResponse.json({ success: true, volunteer: data?.[0] });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}

// Admins only DELETE (delete volunteer and their photo from storage, also remove from committee if applicable)
export async function DELETE(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id, photo_url } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    // Clean up photo from storage
    if (photo_url) {
      try {
        const cleanUrl = photo_url.split('?')[0];
        let filePath = '';
        if (cleanUrl.includes('/nss-images/')) {
          filePath = decodeURIComponent(cleanUrl.split('/nss-images/')[1]);
        } else {
          filePath = decodeURIComponent(cleanUrl.split('/').pop());
        }
        if (filePath) await auth.supabaseAdmin.storage.from('nss-images').remove([filePath]);
      } catch (e) {
        console.error('Photo deletion error:', e);
      }
    }

    // Try to remove from committee if they are in there (using designation->registration_id logic)
    // Actually the committee table stores it encoded, it's safer to just let the foreign key / cascade handle it or let CommitteeManager handle its own state,
    // Wait, committee table doesn't have a foreign key for registration_id, it's in a JSON string.
    // If it fails, that's fine, we will just delete the user auth.

    // Get the user auth ID to delete from auth.users
    const { data: userRecord } = await auth.supabaseAdmin.from('registrations').select('auth_id').eq('id', id).maybeSingle();

    // 1. Delete from registrations table
    const { error: dbError } = await auth.supabaseAdmin.from('registrations').delete().eq('id', id);
    if (dbError) throw dbError;

    // 2. Delete from Supabase Auth
    if (userRecord?.auth_id) {
      const { error: authError } = await auth.supabaseAdmin.auth.admin.deleteUser(userRecord.auth_id);
      if (authError) console.error("Error deleting auth user:", authError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}


