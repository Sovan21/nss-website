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


