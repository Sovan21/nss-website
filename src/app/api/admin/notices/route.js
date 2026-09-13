export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';

// Helper to determine active notices table (nss_notices or notices)
async function getNoticesTable(supabaseAdmin) {
  try {
    const { error } = await supabaseAdmin.from('nss_notices').select('id').limit(1);
    if (!error) return 'nss_notices';
  } catch (e) {
    // fallback
  }
  return 'notices';
}

export async function GET(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const table = await getNoticesTable(auth.supabaseAdmin);
    const { data, error } = await auth.supabaseAdmin.from(table).select('*').order('date', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ success: true, notices: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const table = await getNoticesTable(auth.supabaseAdmin);

    const { data, error } = await auth.supabaseAdmin.from(table).insert([body]).select();
    if (error) throw error;

    return NextResponse.json({ success: true, notice: data?.[0] });
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

    const table = await getNoticesTable(auth.supabaseAdmin);
    const { data, error } = await auth.supabaseAdmin.from(table).update(updates).eq('id', id).select();
    if (error) throw error;

    return NextResponse.json({ success: true, notice: data?.[0] });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id, attachment_url } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    if (attachment_url) {
      try {
        const cleanUrl = attachment_url.split('?')[0];
        let filePath = '';
        if (cleanUrl.includes('/nss-images/')) {
          filePath = decodeURIComponent(cleanUrl.split('/nss-images/')[1]);
        } else {
          filePath = decodeURIComponent(cleanUrl.split('/').pop());
        }
        if (filePath) await auth.supabaseAdmin.storage.from('nss-images').remove([filePath]);
      } catch (e) {
        console.error('Storage attachment deletion error:', e);
      }
    }

    const table = await getNoticesTable(auth.supabaseAdmin);
    const { error } = await auth.supabaseAdmin.from(table).delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}
