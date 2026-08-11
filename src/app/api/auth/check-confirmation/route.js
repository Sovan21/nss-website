import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nfmgklkenucufkqlsohu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbWdrbGtlbnVjdWZrcWxzb2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxOTQwMjAsImV4cCI6MjA4OTc3MDAyMH0.I9ufaMFIOFKrUpvpilILRdNEIFiUp0NYHbSjX4nKUto';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const { userId, email, password } = await request.json().catch(() => ({}));

    if (!userId && !email) {
      return NextResponse.json({ confirmed: false }, { status: 200 });
    }

    let isConfirmed = false;

    // Method 1: Try Admin API if Service Role Key is available & valid
    if (supabaseServiceKey && supabaseServiceKey !== supabaseAnonKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });

        if (userId) {
          const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (!error && data?.user?.email_confirmed_at) {
            isConfirmed = true;
          }
        }

        if (!isConfirmed && email) {
          const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 50 });
          if (!error && data?.users) {
            const foundUser = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
            if (foundUser?.email_confirmed_at) {
              isConfirmed = true;
            }
          }
        }
      } catch (adminErr) {
        // Silently swallow admin API errors
      }
    }

    // Method 2: Server-side check fallback using public client (never logs 403 in browser)
    if (!isConfirmed && email && password) {
      try {
        const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });

        const { data, error } = await supabasePublic.auth.signInWithPassword({
          email,
          password
        });

        if (data?.session && !error) {
          isConfirmed = true;
          await supabasePublic.auth.signOut().catch(() => {});
        }
      } catch (authErr) {
        // Silently swallow auth errors
      }
    }

    return NextResponse.json({
      confirmed: isConfirmed,
      userId: userId || ''
    }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ confirmed: false }, { status: 200 });
  }
}
