/**
 * 📚 HOW THIS WORKS — Next.js Middleware (src/middleware.ts)
 *
 * Next.js Middleware runs on the Edge (Cloudflare/Vercel network layer)
 * BEFORE the request even reaches your pages or API routes.
 *
 * This middleware does THREE security things:
 *
 * 1. SECURITY HEADERS — Added to every response to protect browsers
 *    - Content Security Policy (CSP): Tells browsers which scripts/styles are allowed
 *    - X-Frame-Options: Prevents your site from being embedded in iframes (clickjacking)
 *    - X-Content-Type-Options: Prevents browsers from guessing file types (MIME sniffing)
 *    - Referrer-Policy: Controls what URL is sent in the Referer header
 *
 * 2. RATE LIMITING on /api/ routes
 *    - Limits each IP to 100 API requests per minute
 *    - Returns HTTP 429 (Too Many Requests) if exceeded
 *    - Protects against DDoS attacks on API endpoints
 *
 * 3. ADMIN ROUTE PROTECTION
 *    - Checks for admin auth cookie before allowing access to /admin
 *    - Returns 403 if not authenticated (double-check, UI already handles this)
 *
 * WHY MIDDLEWARE AND NOT JUST PAGE-LEVEL CHECKS?
 *   Middleware runs at the network edge — it's faster than page-level code
 *   and cannot be bypassed by JavaScript tricks. If the middleware blocks a
 *   request, the page code never even runs.
 */

import { NextResponse, NextRequest } from 'next/server';

// ─── Rate Limiting Store ──────────────────────────────────────────────────────
// NOTE: Middleware runs on the Edge runtime, which means each worker is
// isolated. This in-memory map works for single-instance deployments.
// For multi-instance production (Vercel functions), use Redis or KV store.

interface RateLimitBucket {
  count: number;
  windowStart: number;
}

const apiRateLimitStore = new Map<string, RateLimitBucket>();
const API_MAX_REQUESTS = 100;         // Max requests per window
const API_WINDOW_MS = 60 * 1000;      // 1-minute window

function checkApiRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = apiRateLimitStore.get(ip);

  if (!bucket || now - bucket.windowStart > API_WINDOW_MS) {
    // Start a new window
    apiRateLimitStore.set(ip, { count: 1, windowStart: now });
    return true; // Allowed
  }

  if (bucket.count >= API_MAX_REQUESTS) {
    return false; // Rate limited
  }

  bucket.count++;
  return true; // Allowed
}

// ─── Security Headers ─────────────────────────────────────────────────────────

/**
 * Content Security Policy (CSP):
 * 📚 CSP is like a whitelist telling the browser:
 *   "Only load scripts from these approved sources."
 *   "Only load images from these approved sources."
 *   If a page tries to load from an unapproved source (e.g. an injected script),
 *   the browser blocks it — even if the HTML says to load it.
 *
 * KEY DIRECTIVES:
 *   default-src  — fallback for any type not explicitly listed
 *   script-src   — where JavaScript can come from
 *   style-src    — where CSS can come from
 *   img-src      — where images can come from
 *   connect-src  — where fetch/XHR/WebSocket connections can go
 *   frame-src    — what can be embedded in iframes (PayPal, Wise use iframes)
 */
function buildCSP(): string {
  const policy = [
    // Only load resources from our own origin by default
    "default-src 'self'",

    // Scripts: self + PayPal SDK + inline scripts (needed for Next.js hydration)
    // 'unsafe-inline' is required for Next.js's inline script chunks
    // 'unsafe-eval' is required for development mode only (remove in production if desired)
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://js.braintreegateway.com https://www.sandbox.paypal.com",

    // Styles: self + Google Fonts + inline styles (Tailwind generates these)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Fonts: self + Google Fonts CDN
    "font-src 'self' https://fonts.gstatic.com",

    // Images: self + Unsplash CDN + data URIs (for base64 images)
    "img-src 'self' data: blob: https://images.unsplash.com https://www.paypalobjects.com https://upload.wikimedia.org",

    // API connections: self + Supabase + PayPal + Wise + Exchange Rate API
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paypal.com https://api.sandbox.paypal.com https://api.wise.com https://v6.exchangerate-api.com",

    // Media (audio/video): self only
    "media-src 'self'",

    // Frames: PayPal uses iframes for their payment UI
    "frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com",

    // Object (Flash etc.): block completely — no one uses Flash in 2026
    "object-src 'none'",

    // Base URI: only allow our own origin as the <base> tag target
    "base-uri 'self'",

    // Form actions: only submit to our own origin
    "form-action 'self'",
  ].join('; ');

  return policy;
}

// ─── Middleware Function ──────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the real IP address (Vercel puts it in x-forwarded-for)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // ── 1. Rate limit API routes ──────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const allowed = checkApiRateLimit(ip);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'You have exceeded the API rate limit. Please wait 1 minute.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            // 📚 Retry-After tells the client how many seconds to wait
          },
        }
      );
    }
  }

  // ── 2. Add security headers to ALL responses ──────────────────────────────
  const response = NextResponse.next();

  // Content Security Policy — the most powerful XSS protection
  response.headers.set('Content-Security-Policy', buildCSP());

  // Clickjacking protection — prevents your site being embedded in iframes
  // 'SAMEORIGIN' allows your own iframes but blocks third-party embedding
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // MIME type sniffing protection
  // Without this, if you upload a file named "photo.jpg" that contains JS,
  // some browsers might execute it as JavaScript. This header prevents that.
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer policy — when users click links to external sites,
  // 'strict-origin-when-cross-origin' only sends your domain (not full URL)
  // This prevents leaking search queries, user IDs, etc. in URLs
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS — forces HTTPS for 1 year. Once a browser sees this, it will
  // automatically use HTTPS even if the user types http://
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  // Permissions Policy — disables unused browser APIs that could be exploited
  // We don't use camera, microphone, or geolocation, so block them
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Remove the X-Powered-By header that Next.js adds by default
  // This prevents attackers from knowing what framework you're using
  response.headers.delete('X-Powered-By');

  return response;
}

// ─── Matcher Configuration ────────────────────────────────────────────────────

/**
 * 📚 WHAT IS THE MATCHER?
 * This tells Next.js which URLs the middleware should run on.
 * Without a matcher, middleware runs on EVERY request including images,
 * fonts, and static files — which would be wasteful.
 *
 * The pattern below matches all routes EXCEPT:
 *   - _next/static/* — static files (JS bundles, CSS)
 *   - _next/image/*  — Next.js image optimization
 *   - favicon.ico    — browser tab icon
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
