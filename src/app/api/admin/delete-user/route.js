import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nfmgklkenucufkqlsohu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error: Missing service role key' }, { status: 500 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify Authorization Bearer Header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized access: Missing authorization token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Validate the token to extract calling user
    const { data: { user: callingUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
    if (tokenError || !callingUser) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

    // Verify calling user is registered in the 'admins' table
    const { data: adminRecord, error: adminErr } = await supabaseAdmin
      .from('admins')
      .select('email')
      .eq('email', callingUser.email)
      .single();

    if (adminErr || !adminRecord) {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    // Find volunteer registration record to extract photo_url
    const { data: volData } = await supabaseAdmin
      .from('registrations')
      .select('photo_url')
      .eq('id', userId)
      .maybeSingle();

    if (volData?.photo_url) {
      try {
        const cleanUrl = volData.photo_url.split('?')[0];
        let filePath = '';
        if (cleanUrl.includes('/nss-images/')) {
          filePath = decodeURIComponent(cleanUrl.split('/nss-images/')[1]);
        } else {
          filePath = decodeURIComponent(cleanUrl.split('/').pop());
        }
        if (filePath) {
          await supabaseAdmin.storage.from('nss-images').remove([filePath]);
        }
      } catch (imgErr) {
        console.error("Storage image deletion error:", imgErr);
      }
    }

    // Delete record from registrations table if present
    await supabaseAdmin.from('registrations').delete().eq('id', userId);

    // Delete user from Auth System
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Auth Deletion Error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'User completely removed from auth system' }, { status: 200 });

  } catch (err) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
