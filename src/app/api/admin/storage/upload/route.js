export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';

export async function POST(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const formData = await request.formData();
    const file = formData.get('file');
    const fileName = formData.get('fileName');

    if (!file || !(file instanceof Blob) || !fileName) {
      return NextResponse.json({ error: 'File and fileName are required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await auth.supabaseAdmin.storage
      .from('nss-images')
      .upload(fileName, buffer, {
        upsert: true,
        contentType: file.type || 'application/octet-stream'
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: urlData } = auth.supabaseAdmin.storage.from('nss-images').getPublicUrl(fileName);
    return NextResponse.json({ success: true, publicUrl: urlData.publicUrl });

  } catch (err) {
    console.error("POST /api/admin/storage/upload error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


