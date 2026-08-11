import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nfmgklkenucufkqlsohu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const { userId, email } = await request.json();

    if (!userId && !email) {
      return NextResponse.json({ confirmed: false, error: 'User ID or email is required' }, { status: 400 });
    }

    if (!supabaseServiceKey) {
      return NextResponse.json({ confirmed: false, noServiceKey: true }, { status: 200 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    let isConfirmed = false;
    let userData = null;

    if (userId) {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!error && data?.user) {
        userData = data.user;
        if (data.user.email_confirmed_at) {
          isConfirmed = true;
        }
      }
    }

    // Fallback search by email if userId lookup didn't yield positive confirmation
    if (!isConfirmed && email) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 50 });
      if (!error && data?.users) {
        const foundUser = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (foundUser) {
          userData = foundUser;
          if (foundUser.email_confirmed_at) {
            isConfirmed = true;
          }
        }
      }
    }

    return NextResponse.json({
      confirmed: isConfirmed,
      userId: userData?.id || userId
    }, { status: 200 });

  } catch (err) {
    console.error("Check email confirmation API error:", err);
    return NextResponse.json({ confirmed: false, error: err.message }, { status: 500 });
  }
}
