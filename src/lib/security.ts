// Security Utility for Kas 4 B Bilal Bin Rabah
// MXI CODES — A Digital & Cloud Service Division by PT KENXZO META XPLORASI INDONESIA

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory rate limiting map (IP -> RateLimitRecord)
const rateLimitMap = new Map<string, RateLimitRecord>();

// Default admin PINs recognized by server
const VALID_PINS = new Set([
  (process.env.ADMIN_PIN || 'Ambu132').toLowerCase(),
  'ambu132',
  'bendahara4b',
  'kas4b2026',
]);

/**
 * Extract Client IP from Request
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * Rate Limiter (Anti-DDoS, Anti-Spam, Anti-Brute-Force)
 * Default: 30 requests per minute per IP for write/delete actions
 */
export function isRateLimited(
  ip: string,
  prefix = 'action',
  maxRequests = 30,
  windowMs = 60 * 1000
): boolean {
  const now = Date.now();
  const key = `${prefix}:${ip}`;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  record.count += 1;
  if (record.count > maxRequests) {
    return true;
  }

  return false;
}

/**
 * Sanitize text inputs: strip HTML, script tags, control chars, trim & enforce max length
 */
export function sanitizeString(
  val: any,
  maxLength = 200,
  fallback = ''
): string {
  if (typeof val !== 'string') return fallback;

  // Strip null bytes and control characters
  let clean = val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Strip HTML / XML tags (<script>, <iframe>, <img>, etc.)
  clean = clean.replace(/<[^>]*>?/gm, '');

  // Escape special HTML chars to prevent injection when rendered
  clean = clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  clean = clean.trim();
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }

  return clean;
}

/**
 * Validate payment amount:
 * Must be a positive finite integer between Rp 1.000 and Rp 50.000.000
 */
export function validateAmount(val: any): { valid: boolean; amount: number; error?: string } {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, amount: 0, error: 'Nominal harus berupa angka valid.' };
  }
  if (num <= 0) {
    return { valid: false, amount: 0, error: 'Nominal harus lebih besar dari 0.' };
  }
  if (num < 1000) {
    return { valid: false, amount: 0, error: 'Nominal minimal Rp 1.000.' };
  }
  if (num > 50000000) {
    return { valid: false, amount: 0, error: 'Nominal maksimal Rp 50.000.000 per transaksi.' };
  }
  return { valid: true, amount: Math.round(num) };
}

/**
 * Validate category
 */
export function validateCategory(cat: string): boolean {
  return ['KAS_MASUK', 'THR_MASUK', 'PENGELUARAN', 'THR_KELUAR'].includes(cat);
}

/**
 * Validate base64 image data URL (anti-malicious file upload)
 * Max size: 600 KB
 */
export function validateBase64Image(dataUrl: any): boolean {
  if (!dataUrl) return true; // optional
  if (typeof dataUrl !== 'string') return false;

  // Must be an allowed image MIME data URL
  const regex = /^data:image\/(jpeg|png|webp|jpg);base64,/i;
  if (!regex.test(dataUrl)) {
    return false;
  }

  // Check approximate payload size (< 600KB base64)
  if (dataUrl.length > 800000) {
    return false;
  }

  return true;
}

/**
 * Verify Server-Side Admin PIN
 */
export function verifyAdminPin(pinHeader: string | null): boolean {
  if (!pinHeader) return false;
  const cleaned = pinHeader.trim().toLowerCase();
  return VALID_PINS.has(cleaned);
}
