export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';

export async function POST(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { type, data } = body;
    const table = type === 'camps' ? 'nss_camps' : 'nss_alumni';

    const { data: result, error } = await auth.supabaseAdmin.from(table).insert([data]).select();
    if (error) throw error;
    return NextResponse.json({ success: true, data: result?.[0] });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { type, id, data } = body;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    const table = type === 'camps' ? 'nss_camps' : 'nss_alumni';

    const { data: result, error } = await auth.supabaseAdmin.from(table).update(data).eq('id', id).select();
    if (error) throw error;
    return NextResponse.json({ success: true, data: result?.[0] });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { type, id, photo_url } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const table = type === 'camps' ? 'nss_camps' : 'nss_alumni';

    // Clean up storage if deleting alumni with a photo
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
        console.error('Storage deletion error:', e);
      }
    }

    const { error } = await auth.supabaseAdmin.from(table).delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}


