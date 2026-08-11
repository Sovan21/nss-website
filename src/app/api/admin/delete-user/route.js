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

    // Initialize Supabase admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the token belongs to a valid authenticated user
    const { data: { user: callerUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
    if (tokenError || !callerUser) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

    // Verify the caller has admin rights: check admins table (by email) OR registrations table (by role === 'admin')
    const { data: adminRecord } = await supabaseAdmin
      .from('admins')
      .select('email')
      .eq('email', callerUser.email)
      .maybeSingle();

    if (!adminRecord) {
      const { data: callerProfile } = await supabaseAdmin
        .from('registrations')
        .select('role')
        .eq('id', callerUser.id)
        .maybeSingle();

      if (!callerProfile || callerProfile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    // 1. Find volunteer registration record to extract photo_url and delete photo from storage
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

    // 2. Delete record from registrations table if present
    await supabaseAdmin.from('registrations').delete().eq('id', userId);

    // 3. Delete user from Auth System
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (authErr) {
      console.warn("Auth system user deletion notice:", authErr);
    }

    return NextResponse.json({ success: true, message: 'User completely removed' }, { status: 200 });

  } catch (err) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

