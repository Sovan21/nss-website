export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

async function getGalleryTable(supabaseAdmin) {
  try {
    const { error } = await supabaseAdmin.from('nss_gallery').select('id').limit(1);
    if (!error) return 'nss_gallery';
  } catch (e) {
    // fallback
  }
  return 'gallery';
}

export async function GET(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const table = await getGalleryTable(auth.supabaseAdmin);
    const { data, error } = await auth.supabaseAdmin.from(table).select('*').order('date', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ success: true, gallery: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const contentType = request.headers.get('content-type') || '';
    const table = await getGalleryTable(auth.supabaseAdmin);

    // 1. Handle Multi-file FormData upload (Direct to Cloudinary)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const title = formData.get('title') || 'NSS Activity';
      const category = formData.get('category') || 'general';
      const date = formData.get('date') || new Date().toISOString().split('T')[0];
      const location = formData.get('location') || 'B.B. College Campus, Asansol';
      const volunteers = formData.get('volunteers') || 'NSS Volunteers';
      const description = formData.get('description') || '';

      const files = formData.getAll('files');
      if (!files || files.length === 0) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
      }

      // Upload each file to Cloudinary in parallel
      const uploadPromises = files.map(async (file) => {
        if (!file || typeof file === 'string') return null;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await uploadToCloudinary(buffer, 'nss_gallery');
        return result.url;
      });

      const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean);

      if (uploadedUrls.length === 0) {
        return NextResponse.json({ error: 'Failed to upload files to Cloudinary' }, { status: 500 });
      }

      // Prepare database rows
      const rowsToInsert = uploadedUrls.map((url) => ({
        title,
        category,
        date,
        location,
        volunteers,
        description,
        image_url: url
      }));

      const { data, error } = await auth.supabaseAdmin.from(table).insert(rowsToInsert).select();
      if (error) throw error;

      return NextResponse.json({
        success: true,
        count: data?.length || 0,
        items: data
      });
    }

    // 2. Handle JSON payload (Single or Batch Link URLs)
    const body = await request.json();
    const rows = Array.isArray(body) ? body : (body.items ? body.items : [body]);

    const { data, error } = await auth.supabaseAdmin.from(table).insert(rows).select();
    if (error) throw error;

    return NextResponse.json({ success: true, count: data?.length || 0, items: data });
  } catch (err) {
    console.error('Gallery POST error:', err);
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const table = await getGalleryTable(auth.supabaseAdmin);
    const { data, error } = await auth.supabaseAdmin.from(table).update(updates).eq('id', id).select();
    if (error) throw error;

    return NextResponse.json({ success: true, item: data?.[0] });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id, image_url } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const table = await getGalleryTable(auth.supabaseAdmin);
    let targetImageUrl = image_url;

    // If image_url is not passed in payload, fetch it from the database first
    if (!targetImageUrl) {
      const { data: item } = await auth.supabaseAdmin.from(table).select('image_url').eq('id', id).single();
      if (item?.image_url) {
        targetImageUrl = item.image_url;
      }
    }

    // Clean up Cloudinary storage
    if (targetImageUrl && targetImageUrl.includes('cloudinary.com')) {
      try {
        await deleteFromCloudinary(targetImageUrl);
      } catch (e) {
        console.error('Cloudinary deletion error:', e);
      }
    }

    // Clean up Supabase storage if it was stored there
    if (targetImageUrl && targetImageUrl.includes('supabase.co/storage')) {
      try {
        const cleanUrl = targetImageUrl.split('?')[0];
        let filePath = '';
        if (cleanUrl.includes('/nss-images/')) {
          filePath = decodeURIComponent(cleanUrl.split('/nss-images/')[1]);
        } else {
          filePath = decodeURIComponent(cleanUrl.split('/').pop());
        }
        if (filePath) await auth.supabaseAdmin.storage.from('nss-images').remove([filePath]);
      } catch (e) {
        console.error('Supabase storage gallery deletion error:', e);
      }
    }

    const { error } = await auth.supabaseAdmin.from(table).delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
}
