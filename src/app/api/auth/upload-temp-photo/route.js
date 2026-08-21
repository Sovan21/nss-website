export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Upload a registration photo to temp/ storage BEFORE email confirmation.
 * Called immediately after signUp succeeds.
 * Stores the temp file path in user_metadata so sync-photo can move it later.
 */
export async function POST(request) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const formData = await request.formData();
    const userId = formData.get('userId');
    const fullName = formData.get('fullName');
    const photo = formData.get('photo');

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (!photo || typeof photo.arrayBuffer !== 'function' || photo.size === 0) {
      return NextResponse.json({ error: 'Missing photo' }, { status: 400 });
    }

    // Security: Only allow image files
    const contentType = photo.type || '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files allowed' }, { status: 400 });
    }

    // Security: Server-side file size limit (2MB — compressed photos are 700-900KB)
    const MAX_TEMP_PHOTO_SIZE = 2 * 1024 * 1024;
    if (photo.size > MAX_TEMP_PHOTO_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Verify user exists in auth (no email confirmation required)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
    }

    // Security: Reject if user already confirmed (temp upload only for unconfirmed registrations)
    if (userData.user.email_confirmed_at) {
      return NextResponse.json({ error: 'User already confirmed' }, { status: 400 });
    }

    // Build temp filename using userId hash (ensures same user = same file = overwrite on re-register)
    const fileExt = photo.name?.split('.').pop() || 'jpg';
    const nameSlug = (fullName || userData.user.user_metadata?.full_name || 'user')
      .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const userIdHash = userId.slice(0, 8);
    const tempFileName = `temp/volunteer-${nameSlug}-${userIdHash}.${fileExt}`;

    const buffer = Buffer.from(await photo.arrayBuffer());

    // Upload to temp/ prefix in nss-images bucket (upsert = overwrite on re-register)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('nss-images')
      .upload(tempFileName, buffer, {
        upsert: true,
        contentType: photo.type || 'image/jpeg'
      });

    if (uploadError) {
      console.error("Temp photo upload error:", uploadError);
      return NextResponse.json({ error: 'Photo upload failed' }, { status: 500 });
    }

    // Store temp path in user_metadata so sync-photo can find it on confirmation
    const existingMeta = userData.user.user_metadata || {};
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { ...existingMeta, temp_photo_path: tempFileName }
    });

    return NextResponse.json({ success: true, tempPath: tempFileName }, { status: 200 });

  } catch (err) {
    console.error("upload-temp-photo API error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
