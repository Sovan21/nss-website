import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const [{ data: commData, error: commErr }, { data: regData, error: regErr }] = await Promise.all([
      adminClient.from("committee").select("*").order("id", { ascending: true }),
      adminClient.from("registrations").select("id, full_name, department, semester, photo_url")
    ]);

    if (commErr) console.error("commErr:", commErr);
    if (regErr) console.error("regErr:", regErr);

    return NextResponse.json({
      members: commData || [],
      registrations: regData || []
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error("Error fetching committee API:", error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
