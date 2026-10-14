/**
 * 📚 HOW THIS WORKS — PayPal Capture API (POST /api/payment/paypal/capture)
 *
 * This is STEP 3 of the PayPal payment flow.
 *
 * After the user approves on PayPal's website, PayPal redirects them to:
 *   /booking/confirmation?paypal=success&ref=BMT-849201&token=ORDER_ID
 *
 * Your confirmation page then calls THIS endpoint with the token (order ID)
 * to CAPTURE (collect) the money. Without this step, PayPal has only
 * "authorized" the payment but not actually transferred the money yet.
 *
 * WHY TWO STEPS (approve then capture)?
 *   - The user has a chance to review before money moves
 *   - If your server is down after approval, the authorization is still valid
 *     for up to 3 days, so you can capture later
 *   - It follows the "authorize then capture" payment processing standard
 *     used by all major payment processors
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/security';

const PAYPAL_ENV = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
const PAYPAL_BASE_URL =
  PAYPAL_ENV === 'production'
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const isSupabaseConfigured = Boolean(supabaseUrl);
const adminSupabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

type PayPalCapture = {
  id?: string;
  status?: string;
  amount?: { value?: string; currency_code?: string };
};

type PayPalOrder = {
  status?: string;
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    payments?: { captures?: PayPalCapture[] };
  }>;
  details?: Array<{ issue?: string }>;
};

async function getPayPalAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  return data.access_token;
}

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);

/**
 * POST /api/payment/paypal/capture
 *
 * Request body: { orderId: string, bookingRef?: string, idempotencyKey?: string }
 * Response: { status: 'COMPLETED', captureId: string, amount: string, idempotent?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = sanitizeInput(String(body.orderId || ''), 100);
    const bookingRef = sanitizeInput(String(body.bookingRef || ''), 50).toUpperCase();
    const bookingDetails = body.bookingDetails && typeof body.bookingDetails === 'object'
      ? body.bookingDetails as Record<string, unknown>
      : {};
    const activityId = sanitizeInput(String(bookingDetails.activity_id || ''), 36);
    const idempotencyKey = sanitizeInput(String(body.idempotencyKey || ''), 100) || `capture-${bookingRef}`;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }
    if (!/^BMT-[0-9A-F]{32}$/.test(bookingRef) || !isUuid(activityId)) {
      return NextResponse.json({ error: 'Invalid booking details.' }, { status: 400 });
    }
    if (isSupabaseConfigured && !adminSupabase) {
      return NextResponse.json({ error: 'Payment verification is not configured.' }, { status: 503 });
    }

    const accessToken = await getPayPalAccessToken();
    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!orderResponse.ok) {
      return NextResponse.json({ error: 'Could not verify PayPal order.' }, { status: 502 });
    }

    const order = await orderResponse.json() as PayPalOrder;
    const orderUnit = order.purchase_units?.[0];
    if (orderUnit?.reference_id !== bookingRef || orderUnit?.custom_id !== activityId) {
      return NextResponse.json({ error: 'PayPal order does not match this booking.' }, { status: 403 });
    }

    if (adminSupabase) {
      const { data: activity, error: activityError } = await adminSupabase
        .from('activities')
        .select('id')
        .eq('id', activityId)
        .eq('status', 'published')
        .maybeSingle();
      if (activityError || !activity) {
        console.error('[PayPal] Booking activity verification failed:', activityError?.message);
        return NextResponse.json({ error: 'Booking activity could not be verified.' }, { status: 400 });
      }
    }

    let capture = order;
    if (order.status === 'APPROVED') {
      const captureResponse = await fetch(
        `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': idempotencyKey,
          },
        }
      );
      capture = await captureResponse.json() as PayPalOrder;

      if (!captureResponse.ok) {
        const alreadyCaptured = capture.details?.some(detail => detail.issue === 'ORDER_ALREADY_CAPTURED');
        if (!alreadyCaptured) {
          console.error('[PayPal] Capture failed:', capture);
          return NextResponse.json({ error: 'PayPal capture failed. Contact support.' }, { status: 502 });
        }

        const completedOrderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!completedOrderResponse.ok) {
          return NextResponse.json({ error: 'Could not verify completed PayPal capture.' }, { status: 502 });
        }
        capture = await completedOrderResponse.json() as PayPalOrder;
      }
    } else if (order.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'PayPal payment is not approved.' }, { status: 409 });
    }

    const captureUnit = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId = captureUnit?.id;
    if (capture.status !== 'COMPLETED' || captureUnit?.status !== 'COMPLETED' || !captureId) {
      return NextResponse.json({ error: 'PayPal has not completed this payment.' }, { status: 409 });
    }

    if (adminSupabase) {
      const bookingRow = {
        booking_reference: bookingRef,
        activity_id: activityId,
        user_name: String(bookingDetails.user_name || 'Guest'),
        user_email: String(bookingDetails.user_email || 'guest@example.com'),
        user_phone: String(bookingDetails.user_phone || ''),
        user_country: String(bookingDetails.user_country || ''),
        booking_date: String(bookingDetails.booking_date || new Date().toISOString().split('T')[0]),
        participants_count: Number(bookingDetails.participants_count) || 1,
        pickup_address: String(bookingDetails.pickup_address || ''),
        total_amount: Number(captureUnit.amount?.value) || Number(bookingDetails.total_amount) || 0,
        currency: captureUnit.amount?.currency_code || 'USD',
        payment_status: 'confirmed',
        booking_status: 'confirmed',
        payment_id: captureId,
        payment_method: 'paypal',
      };

      const { error: bookingError } = await adminSupabase
        .from('bookings')
        .upsert([bookingRow], { onConflict: 'booking_reference' });
      if (bookingError) {
        console.error('[PayPal] Booking save failed:', bookingError.message);
      }

      const { error: ledgerError } = await adminSupabase
        .from('verified_bookings')
        .upsert([{
          booking_reference: bookingRef,
          activity_id: activityId,
          capture_id: captureId,
          user_name: bookingRow.user_name,
          user_country: bookingRow.user_country,
        }], { onConflict: 'booking_reference' });
      if (ledgerError) {
        console.error('[PayPal] Private booking verification save failed:', ledgerError.message);
        return NextResponse.json(
          { error: 'Payment completed, but review verification could not be saved. Contact support.' },
          { status: 500 }
        );
      }
      if (bookingError) {
        return NextResponse.json(
          { error: 'Payment completed, but booking could not be saved. Contact support.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      status: capture.status,
      captureId,
      amount: captureUnit.amount?.value,
      currency: captureUnit.amount?.currency_code,
      idempotent: false,
    });
  } catch (error) {
    console.error('[PayPal] Capture error:', error);
    return NextResponse.json(
      { error: 'Payment capture failed. Please contact support.' },
      { status: 500 }
    );
  }
}
