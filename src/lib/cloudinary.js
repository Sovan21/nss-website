import crypto from 'crypto';

const getCloudinaryConfig = () => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return {
    cloudName,
    apiKey,
    apiSecret,
    isConfigured: Boolean(cloudName && apiKey && apiSecret)
  };
};

/**
 * Generates Cloudinary SHA-1 signature
 */
const generateSignature = (params, apiSecret) => {
  const sortedKeys = Object.keys(params).sort();
  const serialized = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  const toSign = serialized + apiSecret;
  return crypto.createHash('sha1').update(toSign).digest('hex');
};

/**
 * Uploads a single image buffer or Base64 string to Cloudinary
 * @param {Buffer|Blob|string} fileBufferOrBase64 - File buffer, Blob, or base64
 * @param {string} folder - Target Cloudinary folder (default: 'nss_gallery')
 * @returns {Promise<{ url: string, publicId: string, secureUrl: string }>}
 */
export async function uploadToCloudinary(fileBufferOrBase64, folder = 'nss_gallery') {
  const config = getCloudinaryConfig();
  if (!config.isConfigured) {
    throw new Error('Cloudinary is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    folder,
    timestamp
  };

  const signature = generateSignature(paramsToSign, config.apiSecret);

  const formData = new FormData();
  
  if (Buffer.isBuffer(fileBufferOrBase64)) {
    const blob = new Blob([fileBufferOrBase64]);
    formData.append('file', blob);
  } else if (typeof fileBufferOrBase64 === 'string') {
    formData.append('file', fileBufferOrBase64);
  } else {
    formData.append('file', fileBufferOrBase64);
  }

  formData.append('api_key', config.apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('signature', signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to upload image to Cloudinary');
  }

  // Construct auto-optimized CDN URL
  const optimizedUrl = data.secure_url
    ? data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/')
    : data.url;

  return {
    url: optimizedUrl,
    secureUrl: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format
  };
}

/**
 * Deletes an image from Cloudinary by public ID or URL
 * @param {string} publicIdOrUrl - Cloudinary public_id or image URL
 * @returns {Promise<boolean>}
 */
export async function deleteFromCloudinary(publicIdOrUrl) {
  if (!publicIdOrUrl) return false;

  const config = getCloudinaryConfig();
  if (!config.isConfigured) {
    console.warn('Cloudinary not configured. Skipping deletion.');
    return false;
  }

  let publicId = publicIdOrUrl;

  // If a full Cloudinary URL is passed, extract the full public_id (including folder)
  if (publicIdOrUrl.includes('cloudinary.com') || publicIdOrUrl.startsWith('http')) {
    const extracted = extractCloudinaryPublicId(publicIdOrUrl);
    if (extracted) {
      publicId = extracted;
    }
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    public_id: publicId,
    timestamp
  };

  const signature = generateSignature(paramsToSign, config.apiSecret);

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('api_key', config.apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    console.log(`Cloudinary destroy response for [${publicId}]:`, data);
    return data.result === 'ok';
  } catch (err) {
    console.error('Error deleting from Cloudinary:', err);
    return false;
  }
}

/**
 * Helper to extract public_id (including folder) from a Cloudinary URL
 * Example: https://res.cloudinary.com/demo/image/upload/v1234/nss_gallery/sample.jpg -> nss_gallery/sample
 */
export function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return url.replace(/\.[^/.]+$/, '');
    }

    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    const pathAfterUpload = url.substring(uploadIndex + 8); // remove '/upload/'

    // Match version segment /v1234567890/ or start with v1234567890/
    const versionMatch = pathAfterUpload.match(/(?:^|\/)v\d+\/(.+)$/);
    let publicIdWithExt = '';
    
    if (versionMatch && versionMatch[1]) {
      publicIdWithExt = versionMatch[1];
    } else {
      // If no version tag, filter out transformation segments (e.g. f_auto,q_auto or w_500,h_500)
      const parts = pathAfterUpload.split('/');
      const nonTransformParts = [];
      let foundNonTransform = false;
      for (const part of parts) {
        if (foundNonTransform) {
          nonTransformParts.push(part);
        } else if (part.includes(',') || /^[a-z]{1,2}_[a-zA-Z0-9_]+$/.test(part)) {
          continue;
        } else {
          foundNonTransform = true;
          nonTransformParts.push(part);
        }
      }
      publicIdWithExt = nonTransformParts.join('/');
    }

    // Strip query strings if any
    publicIdWithExt = publicIdWithExt.split('?')[0];

    // Remove file extension (.jpg, .png, .webp, etc.)
    const lastDotIndex = publicIdWithExt.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return publicIdWithExt.substring(0, lastDotIndex);
    }
    return publicIdWithExt;
  } catch (e) {
    console.error('Error extracting Cloudinary publicId:', e);
    return null;
  }
}

/**
 * Generates an auto-optimized, WebP/AVIF Cloudinary URL with specified width and quality.
 * If the URL is not a Cloudinary URL, returns the original URL.
 * 
 * @param {string} url 
 * @param {{ width?: number, height?: number, crop?: string, quality?: string|number }} options 
 * @returns {string}
 */
export function getOptimizedImageUrl(url, { width = 600, height, crop = 'fill', quality = 'auto' } = {}) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  // Build transformation string
  const transforms = ['f_auto', `q_${quality}`];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop && (width || height)) transforms.push(`c_${crop}`);

  const transformString = transforms.join(',');

  const prefix = url.substring(0, uploadIndex + 8);
  const suffix = url.substring(uploadIndex + 8);

  // If URL already has transformation segment, replace it
  if (/^[a-z]{1,2}_[a-zA-Z0-9_,]+(\/|$)/.test(suffix)) {
    const nextSlash = suffix.indexOf('/');
    if (nextSlash !== -1) {
      return `${prefix}${transformString}/${suffix.substring(nextSlash + 1)}`;
    }
  }

  return `${prefix}${transformString}/${suffix}`;
}

