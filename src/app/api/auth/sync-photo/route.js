export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
    if (tokenError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    // Ignore formData.get('userId') and use the verified user.id instead
    const userId = user.id;
    const email = formData.get('email');
    const fullName = formData.get('fullName');
    const photo = formData.get('photo'); // File or null

    if (!user.email_confirmed_at) {
      return NextResponse.json({ error: 'Email not confirmed' }, { status: 400 });
    }
    const m = user.user_metadata || {};

    // Check if profile already exists to preserve role and photo
    const { data: existingRecord } = await supabaseAdmin
      .from('registrations')
      .select('photo_url, role')
      .eq('id', userId)
      .maybeSingle();

    if (existingRecord?.photo_url && existingRecord.photo_url.includes('nss-images')) {
      return NextResponse.json({ photoUrl: existingRecord.photo_url }, { status: 200 });
    }

    let photoUrl = existingRecord?.photo_url || '';

    // Upload photo to storage if provided
    if (photo && photo instanceof File && photo.size > 0) {
      const fileExt = photo.name?.split('.').pop() || 'jpg';
      const nameSlug = (fullName || m.full_name || 'user')
        .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const userIdHash = userId.slice(0, 8);
      const fileName = `volunteer-${nameSlug}-${userIdHash}.${fileExt}`;

      const buffer = Buffer.from(await photo.arrayBuffer());

      const { error: uploadError } = await supabaseAdmin.storage
        .from('nss-images')
        .upload(fileName, buffer, {
          upsert: true,
          contentType: photo.type || 'image/jpeg'
        });

      if (uploadError) {
        console.error("Server storage upload error:", uploadError);
        return NextResponse.json({ error: 'Photo upload failed' }, { status: 500 });
      }

      const { data: urlData } = supabaseAdmin.storage.from('nss-images').getPublicUrl(fileName);
      photoUrl = urlData.publicUrl;
    }

    // Build profile payload from auth user_metadata
    const profilePayload = {
      id: userId,
      email: email || user.email,
      full_name: fullName || m.full_name || 'Volunteer',
      fathers_name: m.fathers_name || null,
      mothers_name: m.mothers_name || null,
      aadhaar_no: m.aadhaar_no || null,
      phone: m.phone || null,
      whatsapp: m.whatsapp || null,
      dob: m.dob || null,
      gender: m.gender || null,
      blood_group: m.blood_group || null,
      current_address: m.current_address || null,
      department: m.department || null,
      semester: m.semester || null,
      college_application_id: m.college_application_id || null,
      extra_curriculum: m.extra_curriculum || null,
      prev_experience: m.prev_experience || null,
      bio: m.bio || null,
      photo_url: photoUrl,
      role: existingRecord?.role || 'volunteer'
    };

    // Upsert with service_role key — bypasses RLS
    const { error: upsertError } = await supabaseAdmin
      .from('registrations')
      .upsert(profilePayload, { onConflict: 'id' });

    if (upsertError) {
      console.error("Server upsert error:", upsertError);
      return NextResponse.json({ error: 'Profile update failed' }, { status: 500 });
    }

    return NextResponse.json({ photoUrl }, { status: 200 });

  } catch (err) {
    console.error("sync-photo API error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


