export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';

// Admins only PUT (update settings/site_content)
export async function PUT(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, ...updates } = body;
    
    let result;
    if (id) {
      result = await auth.supabaseAdmin.from('site_content').update(updates).eq('id', id).select();
    } else {
      result = await auth.supabaseAdmin.from('site_content').insert([updates]).select();
    }
    
    if (result.error) throw result.error;
    return NextResponse.json({ success: true, settings: result.data?.[0] });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}


