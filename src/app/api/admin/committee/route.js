export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';

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


