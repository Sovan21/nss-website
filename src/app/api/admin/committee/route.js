export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Verify the caller is an authenticated admin.
 * Same pattern as /api/admin/delete-user/route.js
 */
async function verifyAdmin(request) {
  if (!supabaseServiceKey) {
    return { error: 'Server configuration error: Missing service role key', status: 500 };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized: Missing authorization token', status: 401 };
  }

  const token = authHeader.split(' ')[1];

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
  if (tokenError || !user) {
    return { error: 'Unauthorized: Invalid or expired token', status: 401 };
  }

  // Check admins table
  const { data: adminRecord } = await supabaseAdmin
    .from('admins')
    .select('email')
    .eq('email', user.email)
    .maybeSingle();

  if (!adminRecord) {
    // Fallback: check registrations role
    const { data: callerProfile } = await supabaseAdmin
      .from('registrations')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== 'admin') {
      return { error: 'Forbidden: Admin access required', status: 403 };
    }
  }

  return { supabaseAdmin, user };
}

/**
 * POST — Add a new committee member
 * Body: { name, designation, about, image_url, display_order }
 */
export async function POST(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { name, designation, about, image_url, display_order } = body;

    if (!name || !designation) {
      return NextResponse.json({ error: 'Name and designation are required' }, { status: 400 });
    }

    const insertData = { name, designation, about: about || '', image_url: image_url || null };
    if (display_order != null) insertData.display_order = Number(display_order);

    const { data, error } = await auth.supabaseAdmin.from('committee').insert([insertData]).select();

    if (error) {
      // Retry without display_order if column doesn't exist
      if (error.message?.includes('display_order') || error.code === 'PGRST204') {
        const { display_order: _, ...cleanData } = insertData;
        const { data: d2, error: e2 } = await auth.supabaseAdmin.from('committee').insert([cleanData]).select();
        if (e2) throw e2;
        return NextResponse.json({ success: true, member: d2?.[0] });
      }
      throw error;
    }

    return NextResponse.json({ success: true, member: data?.[0] });
  } catch (err) {
    console.error('POST /api/admin/committee error:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT — Update an existing committee member
 * Body: { id, name, designation, about, image_url, display_order }
 */
export async function PUT(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const { data, error } = await auth.supabaseAdmin.from('committee').update(updates).eq('id', id).select();

    if (error) {
      if (error.message?.includes('display_order') || error.code === 'PGRST204') {
        const { display_order, ...cleanUpdates } = updates;
        const { data: d2, error: e2 } = await auth.supabaseAdmin.from('committee').update(cleanUpdates).eq('id', id).select();
        if (e2) throw e2;
        return NextResponse.json({ success: true, member: d2?.[0] });
      }
      throw error;
    }

    return NextResponse.json({ success: true, member: data?.[0] });
  } catch (err) {
    console.error('PUT /api/admin/committee error:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE — Remove a committee member
 * Body: { id }
 */
export async function DELETE(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, image_url } = body;

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    // Delete image from storage if present
    if (image_url) {
      try {
        const cleanUrl = image_url.split('?')[0];
        let filePath = '';
        if (cleanUrl.includes('/nss-images/')) {
          filePath = decodeURIComponent(cleanUrl.split('/nss-images/')[1]);
        } else {
          filePath = decodeURIComponent(cleanUrl.split('/').pop());
        }
        if (filePath) {
          await auth.supabaseAdmin.storage.from('nss-images').remove([filePath]);
        }
      } catch (imgErr) {
        console.error('Image deletion error:', imgErr);
      }
    }

    const { error } = await auth.supabaseAdmin.from('committee').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/committee error:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}


