export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/adminAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.CRON_SECRET;

/**
 * Automated / Manual Cleanup for unconfirmed registration photos in temp/ folder.
 * 
 * Supports:
 * 1. Admin UI trigger: Authenticated via standard admin Bearer token.
 * 2. Vercel Cron / Scheduled Job: Authenticated via CRON_SECRET header if configured.
 * 
 * Default retention: 7 days (customizable via query param `?days=7`)
 */
export async function POST(request) {
  try {
    let supabaseAdmin = null;

    // 1. Check if authorized via CRON_SECRET header
    const authHeader = request.headers.get('authorization') || '';
    const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (isCronAuthorized) {
      if (!supabaseServiceKey) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
    } else {
      // 2. Otherwise authenticate as Admin
      const auth = await verifyAdmin(request);
      if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
      supabaseAdmin = auth.supabaseAdmin;
    }

    // Parse retention days (default: 7 days)
    const url = new URL(request.url);
    const daysParam = parseInt(url.searchParams.get('days') || '7', 10);
    const retentionDays = isNaN(daysParam) || daysParam < 1 ? 7 : daysParam;

    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

    // List all files in the 'temp' folder of 'nss-images' bucket
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('nss-images')
      .list('temp', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'created_at', order: 'asc' }
      });

    if (listError) {
      console.error('Storage cleanup list error:', listError);
      return NextResponse.json({ error: 'Failed to list temp storage files' }, { status: 500 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No temp files found in storage',
        scannedCount: 0,
        deletedCount: 0,
        retentionDays
      });
    }

    // Filter files older than the cutoff time (skip system placeholders)
    const filesToDelete = [];
    for (const file of files) {
      if (!file.name || file.name === '.emptyFolderPlaceholder') continue;

      const fileCreatedAt = file.created_at ? new Date(file.created_at).getTime() : 0;
      if (fileCreatedAt > 0 && fileCreatedAt < cutoffTime) {
        filesToDelete.push(`temp/${file.name}`);
      }
    }

    // If eligible old files found, delete them in batch
    let deletedCount = 0;
    if (filesToDelete.length > 0) {
      const { error: removeError } = await supabaseAdmin.storage
        .from('nss-images')
        .remove(filesToDelete);

      if (removeError) {
        console.error('Storage cleanup remove error:', removeError);
        return NextResponse.json({ error: 'Failed to delete expired temp files' }, { status: 500 });
      }

      deletedCount = filesToDelete.length;
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} temp files older than ${retentionDays} days.`,
      scannedCount: files.length,
      deletedCount,
      deletedFiles: filesToDelete,
      retentionDays
    });

  } catch (err) {
    console.error('POST /api/admin/storage/cleanup-temp error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
