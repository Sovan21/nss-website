export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    // Rate Limiting: Max 80 confirmation polls per minute per IP (plenty for normal client polling)
    const rateLimit = checkRateLimit(request, { limit: 80, windowMs: 60 * 1000, prefix: 'check_conf' });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { confirmed: false, error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.resetSeconds) } }
      );
    }
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



