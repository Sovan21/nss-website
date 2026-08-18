export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';

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


