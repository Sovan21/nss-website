export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const { userId } = await request.json().catch(() => ({}));

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ confirmed: false }, { status: 200 });
    }

    // Require service role key for admin API access
    if (!supabaseServiceKey) {
      return NextResponse.json({ confirmed: false }, { status: 200 });
    }

    let isConfirmed = false;

    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!error && data?.user?.email_confirmed_at) {
        isConfirmed = true;
      }
    } catch (adminErr) {
      // Silently swallow admin API errors
    }

    return NextResponse.json({
      confirmed: isConfirmed,
      userId: userId || ''
    }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ confirmed: false }, { status: 200 });
  }
}



