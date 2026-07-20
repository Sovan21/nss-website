import { useState, useEffect } from 'react';
import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * Shared Application Utility Functions
 */

/**
 * Dynamic Canvas Image Compressor
 * @param {File} file - Image file to compress
 * @param {number} maxSizeMB - Maximum target size in megabytes
 * @param {number} maxWidth - Maximum target width in pixels
 * @returns {Promise<File>} Compressed image file
 */
export const compressImage = (file, maxSizeMB = 2, maxWidth = 800) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) { resolve(file); return; }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        let quality = 0.9;
        
        const attemptCompress = () => {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return; }
            if (blob.size > maxSizeBytes && quality > 0.1) {
              quality -= 0.1;
              attemptCompress();
            } else {
              const newFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
              const compressedFile = new File([blob], newFileName, { type: 'image/jpeg', lastModified: Date.now() });
              const finalFile = compressedFile.size < file.size ? compressedFile : file;
              resolve(finalFile);
            }
          }, 'image/jpeg', quality);
        };
        attemptCompress();
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
  if (!url || url.includes('placeholder.com')) return;
  try {
    const fileName = url.split('/').pop();
    await supabase.storage.from('nss-images').remove([fileName]);
  } catch (error) {
    console.error("Error deleting old image:", error);
  }
};
