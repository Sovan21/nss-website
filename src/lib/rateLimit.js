/**
 * In-memory sliding window rate limiter for Next.js Route Handlers.
 * Lightweight, zero-dependency, and cleans up expired IP buckets automatically.
 */

// Global storage map across hot-reloads in development
const rateLimitMap = globalThis.__nss_rate_limit_map || new Map();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__nss_rate_limit_map = rateLimitMap;
}

/**
 * Extracts client IP from standard Next.js / Cloudflare / Vercel proxy headers.
 * 
 * @param {Request} request 
 * @returns {string}
 */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return '127.0.0.1';
}

/**
 * Checks if the incoming request exceeds the rate limit.
 * 
 * @param {Request} request 
 * @param {{ limit?: number, windowMs?: number, prefix?: string }} options 
 * @returns {{ allowed: boolean, remaining: number, resetSeconds: number, ip: string }}
 */
export function checkRateLimit(request, { limit = 30, windowMs = 60 * 1000, prefix = 'rl' } = {}) {
  const ip = getClientIp(request);
  const now = Date.now();
  const key = `${prefix}:${ip}`;

  // Periodically clean up expired entries if map gets large
  if (rateLimitMap.size > 5000) {
    for (const [k, data] of rateLimitMap.entries()) {
      if (now > data.resetTime) {
        rateLimitMap.delete(k);
      }
    }
  }

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // Start a new window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
      ip
    };
  }

  // Increment current window count
  record.count += 1;
  const remaining = Math.max(0, limit - record.count);
  const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

  if (record.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
      ip
    };
  }

  return {
    allowed: true,
    remaining,
    resetSeconds,
    ip
  };
}
