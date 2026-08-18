export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';

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


