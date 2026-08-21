import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';

/**
 * Shared Application Utility Functions
 */

/**
 * Dynamic Canvas Image Compressor targeting a specific file size window [minSizeKB, maxSizeKB]
 * @param {File} file - Image file to compress
 * @param {number} minSizeKB - Minimum target size in KB (default 700)
 * @param {number} maxSizeKB - Maximum target size in KB (default 900)
 * @param {number} initialMaxWidth - Maximum target width in pixels (default 2000)
 * @returns {Promise<File>} Compressed image file
 */
export const compressImage = (file, minSizeKB = 700, maxSizeKB = 900, initialMaxWidth = 2000) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) { resolve(file); return; }

    // Support legacy signature: compressImage(file, maxSizeMB, maxWidth)
    let minKB = minSizeKB;
    let maxKB = maxSizeKB;
    if (minSizeKB < 10) {
      maxKB = Math.round(minSizeKB * 1024);
      minKB = Math.round(maxKB * 0.70);
      if (typeof maxSizeKB === 'number' && maxSizeKB > 100) {
        initialMaxWidth = maxSizeKB;
      }
    }

    const minSizeBytes = minKB * 1024;
    const maxSizeBytes = maxKB * 1024;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        let maxWidth = initialMaxWidth;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        let quality = 0.95;
        let attempts = 0;
        const maxAttempts = 25;

        const attemptCompress = (currentWidth, currentHeight) => {
          attempts++;
          const canvas = document.createElement('canvas');
          canvas.width = currentWidth;
          canvas.height = currentHeight;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, currentWidth, currentHeight);
          ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

          canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return; }

            const size = blob.size;

            // Target achieved: Size is inside target window [minSizeBytes, maxSizeBytes]
            if (size >= minSizeBytes && size <= maxSizeBytes) {
              const newFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
              const compressedFile = new File([blob], newFileName, { type: 'image/jpeg', lastModified: Date.now() });
              resolve(compressedFile);
              return;
            }

            if (attempts >= maxAttempts) {
              const newFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
              const compressedFile = new File([blob], newFileName, { type: 'image/jpeg', lastModified: Date.now() });
              resolve(compressedFile);
              return;
            }

            if (size > maxSizeBytes) {
              // Too large (> 900 KB): Decrease quality gradually
              if (quality > 0.70) {
                quality -= 0.02;
                attemptCompress(currentWidth, currentHeight);
              } else {
                quality = 0.90;
                attemptCompress(Math.round(currentWidth * 0.90), Math.round(currentHeight * 0.90));
              }
            } else if (size < minSizeBytes) {
              // Too small (< 700 KB): Increase quality or scale canvas resolution up
              if (quality < 0.98) {
                quality = Math.min(0.98, quality + 0.03);
                attemptCompress(currentWidth, currentHeight);
              } else if (currentWidth < 2500) {
                attemptCompress(Math.round(currentWidth * 1.15), Math.round(currentHeight * 1.15));
              } else {
                const newFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
                const compressedFile = new File([blob], newFileName, { type: 'image/jpeg', lastModified: Date.now() });
                resolve(compressedFile);
              }
            }
          }, 'image/jpeg', quality);
        };

        attemptCompress(width, height);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

/**
 * Extract user initials from full name
 * @param {string} name 
 * @returns {string} Initials (e.g. "AB")
 */
export const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Format YYYY-MM-DD or ISO date string into DD/MM/YYYY format
 * @param {string} dateStr 
 * @returns {string} Formatted date string
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [_, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear());
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
};

/**
 * Debounce hook for input search
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
};

/**
 * Secure Supabase Image Deleter
 */
export const deleteSupabaseImage = async (url) => {
  if (!url || typeof url !== 'string' || url.includes('placeholder.com')) return;
  try {
    let { data: { session } } = await supabaseAdmin.auth.getSession();
    let token = session?.access_token;
    
    // Fallback if admin client doesn't have it (e.g. legacy session)
    if (!token) {
      const pubSession = await supabase.auth.getSession();
      token = pubSession?.data?.session?.access_token;
    }
    
    if (!token) {
      console.warn("No token available for deleteSupabaseImage");
      return;
    }
    const res = await fetch('/api/admin/storage/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ url })
    });
    if (!res.ok) {
      console.error("Client storage delete error:", await res.text());
    }
  } catch (error) {
    console.error("Error deleting image from storage:", error);
  }
};

/**
 * Secure Admin Image Uploader
 */
export const uploadAdminImage = async (file, fileName) => {
  if (!file || !fileName) return null;
  try {
    let { data: { session } } = await supabaseAdmin.auth.getSession();
    let token = session?.access_token;
    
    // Fallback if admin client doesn't have it (e.g. legacy session)
    if (!token) {
      const pubSession = await supabase.auth.getSession();
      token = pubSession?.data?.session?.access_token;
    }

    if (!token) throw new Error("No auth token available");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);

    const res = await fetch('/api/admin/storage/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to upload image');
    }
    
    const data = await res.json();
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading admin image:", error);
    return null;
  }
};
/**
 * Save pending registration photo to local sessionStorage
 */
export const savePendingPhoto = (email, file) => {
  if (!file || !email) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      sessionStorage.setItem(`nss_pending_photo_${email.toLowerCase()}`, e.target.result);
      sessionStorage.setItem(`nss_pending_photo_name_${email.toLowerCase()}`, file.name);
    } catch (err) {
      console.warn("Could not cache pending photo locally:", err);
    }
  };
  reader.readAsDataURL(file);
};

/**
 * Retrieve pending registration photo file from local sessionStorage
 */
export const getPendingPhotoFile = (email) => {
  if (!email) return null;
  try {
    const dataUrl = sessionStorage.getItem(`nss_pending_photo_${email.toLowerCase()}`);
    const fileName = sessionStorage.getItem(`nss_pending_photo_name_${email.toLowerCase()}`) || 'photo.jpg';
    if (!dataUrl) return null;
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  } catch (err) {
    return null;
  }
};

/**
 * Clear pending photo from sessionStorage
 */
export const clearPendingPhoto = (email) => {
  if (!email) return;
  try {
    sessionStorage.removeItem(`nss_pending_photo_${email.toLowerCase()}`);
    sessionStorage.removeItem(`nss_pending_photo_name_${email.toLowerCase()}`);
  } catch (err) {}
};

/**
 * Sync photo to Supabase storage AFTER email confirmation.
 * Uses server-side API (/api/auth/sync-photo) with service_role key to bypass RLS.
 * If no photo file is provided, the server checks for a temp photo uploaded at registration.
 */
export const uploadConfirmedUserPhoto = async (user, email, fullName, photoFile = null) => {
  try {
    if (!user || !user.id) return '';

    const fileToUploadRaw = photoFile || getPendingPhotoFile(email || user.email);

    // Build FormData for server-side API
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('email', email || user.email || '');
    formData.append('fullName', fullName || user.user_metadata?.full_name || 'Volunteer');

    if (fileToUploadRaw) {
      // Compress image on client side before sending to server
      const finalFile = await compressImage(fileToUploadRaw, 700, 900);
      formData.append('photo', finalFile);
    }

    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch('/api/auth/sync-photo', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });

    if (!res.ok) {
      console.warn("sync-photo API returned:", res.status);
      return '';
    }

    const { photoUrl } = await res.json();

    // Clean up local pending photo cache
    clearPendingPhoto(email || user.email);

    // Sync localStorage and trigger user logged in event if currently active
    if (typeof window !== 'undefined' && photoUrl) {
      const localUser = localStorage.getItem('nss_user');
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          if (parsed.id === user.id) {
            parsed.photo_url = photoUrl;
            localStorage.setItem('nss_user', JSON.stringify(parsed));
            window.dispatchEvent(new Event('nss_user_logged_in'));
          }
        } catch (e) {}
      }
    }

    return photoUrl || '';
  } catch (err) {
    console.error("Failed to upload confirmed user photo:", err);
    return '';
  }
};
