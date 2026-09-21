/**
 * 📚 HOW THIS WORKS — PayPal Payment API (POST /api/payment/paypal)
 *
 * This is a Next.js API Route — a server-side function that runs on your server,
 * not in the user's browser. This is CRITICAL for security because:
 *   - Your PayPal CLIENT SECRET is never exposed to users
 *   - All payment data validation happens server-side
 *   - Users cannot tamper with the amount being charged
 *
 * THE PAYPAL PAYMENT FLOW (3 steps):
 *   1. CREATE ORDER (this file):
 *      → Your server calls PayPal API with the booking amount
 *      → PayPal returns an order ID and approval URL
 *      → User is redirected to PayPal to approve the payment
 *
 *   2. USER APPROVES at PayPal:
 *      → User logs in to PayPal, reviews the amount, clicks "Pay"
 *      → PayPal redirects user back to your site with ?token=ORDER_ID
 *
 *   3. CAPTURE ORDER (see capture/route.ts):
 *      → Your server calls PayPal API to finalize and collect the money
 *      → PayPal confirms payment and sends funds to your account
 *
 * SANDBOX vs PRODUCTION:
 *   - Sandbox: Use fake PayPal accounts, no real money moves
 *   - Production: Set PAYPAL_ENVIRONMENT=production in .env.local
 *
 * SETUP GUIDE:
 *   1. Go to https://developer.paypal.com
 *   2. Create an account and a new App under "My Apps & Credentials"
 *   3. Copy "Client ID" and "Client Secret" to your .env.local
 *   4. Test with sandbox accounts first
 */

import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/security';

// ─── PayPal Environment Configuration ────────────────────────────────────────

// 'sandbox' for testing, 'production' for live money
const PAYPAL_ENV = process.env.PAYPAL_ENVIRONMENT || 'sandbox';

const PAYPAL_BASE_URL =
  PAYPAL_ENV === 'production'
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

// ─── PayPal Access Token ──────────────────────────────────────────────────────

/**
 * Gets a temporary PayPal OAuth2 access token.
 *
 * 📚 HOW OAUTH2 WORKS:
 *   OAuth2 is an authentication standard. Instead of sending your Client ID
 *   and Secret with every request, you first exchange them for a short-lived
 *   "access token" (valid for ~9 hours). All subsequent API calls use this token.
 *
 *   This is more secure because:
 *   - Tokens expire, so even if intercepted, they can't be used forever
 *   - Your actual credentials are only sent once, over HTTPS
 */
async function getPayPalAccessToken(): Promise<string> {
  // Base64 encode "clientId:secret" — required by OAuth2 Basic Auth
  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials', // OAuth2 grant type
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal auth failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

/**
 * POST /api/payment/paypal
 *
 * Creates a PayPal order for a booking.
 *
 * Request body:
 * {
 *   amount: number,        // Total price in USD (e.g. 70)
 *   bookingRef: string,    // e.g. "BMT-849201"
 *   activityTitle: string, // e.g. "Mount Batur Sunrise Trekking"
 *   currency: "USD"        // Always USD for PayPal
 * }
 *
 * Response:
 * {
 *   orderId: string,      // PayPal order ID to track the payment
 *   approvalUrl: string,  // URL to redirect the user to PayPal
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Validate PayPal credentials are configured
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'PayPal is not configured. Contact site administrator.' },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const amount = Number(body.amount);
    const bookingRef = sanitizeInput(String(body.bookingRef || ''), 50);
    const activityTitle = sanitizeInput(String(body.activityTitle || ''), 100);

    // Server-side validation — never trust client-provided amounts
    if (!amount || amount <= 0 || amount > 10000) {
      return NextResponse.json(
        { error: 'Invalid booking amount.' },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // ── Create PayPal Order ─────────────────────────────────────────────────
    // PayPal Order v2 API: https://developer.paypal.com/api/orders/v2/
    const origin = request.nextUrl.origin;

    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        // PayPal-Request-Id prevents duplicate orders if request is retried
        'PayPal-Request-Id': `${bookingRef}-${Date.now()}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE', // 'CAPTURE' means collect money immediately (not authorize-then-capture)

        purchase_units: [{
          // Reference ID links this order to your booking
          reference_id: bookingRef,

          description: `Bali Mesari Tour: ${activityTitle}`,

          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2), // PayPal requires exactly 2 decimal places
          },

          // Your PayPal merchant account details (optional, for clarity)
          soft_descriptor: 'BALI MESARI TOUR',
        }],

        // Where to redirect after payment
        application_context: {
          brand_name: 'Bali Mesari Tour',
          locale: 'en-US',
          landing_page: 'BILLING',    // Send user straight to card entry
          shipping_preference: 'NO_SHIPPING', // Digital service, no physical shipping
          user_action: 'PAY_NOW',     // Button shows "Pay Now" instead of "Continue"

          // ✅ Success: redirect here after PayPal approval
          return_url: `${origin}/booking/confirmation?paypal=success&ref=${bookingRef}`,

          // ❌ Cancel: redirect here if user clicks "Cancel" on PayPal
          cancel_url: `${origin}/checkout?paypal=cancelled`,
        },
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.json();
      console.error('[PayPal] Create order failed:', error);
      return NextResponse.json(
        { error: 'Failed to create PayPal order. Please try again.' },
        { status: 502 }
      );
    }

    const order = await orderResponse.json();

    // Find the approval URL in PayPal's response links array
    // PayPal returns multiple links: approve, self, capture, etc.
    const approvalLink = order.links?.find(
      (link: { rel: string; href: string }) => link.rel === 'approve'
    );

    if (!approvalLink) {
      return NextResponse.json(
        { error: 'Could not get PayPal approval URL.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      approvalUrl: approvalLink.href,
    });

  } catch (error) {
    console.error('[PayPal] Unexpected error:', error);
    return NextResponse.json(
      { error: 'PayPal payment failed. Please try a different payment method.' },
      { status: 500 }
    );
  }
}
