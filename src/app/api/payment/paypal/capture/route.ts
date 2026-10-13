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

import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { sanitizeInput } from '@/lib/security';

const PAYPAL_ENV = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
const PAYPAL_BASE_URL =
  PAYPAL_ENV === 'production'
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

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
    const bookingRef = sanitizeInput(String(body.bookingRef || ''), 50);
    const idempotencyKey = sanitizeInput(String(body.idempotencyKey || ''), 100) || (bookingRef ? `capture-${bookingRef}` : `capture-${orderId}`);

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // ── Idempotency Check in DB ─────────────────────────────────────────────
    // If booking already recorded as paid with this order/capture ID, return immediately
    if (isSupabaseConfigured && supabase) {
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id, booking_reference, payment_id, payment_status, total_amount, currency')
        .or(`payment_id.eq.${orderId},booking_reference.eq.${bookingRef}`)
        .maybeSingle();

      if (existingBooking && existingBooking.payment_status === 'confirmed' && existingBooking.payment_id) {
        return NextResponse.json({
          status: 'COMPLETED',
          captureId: existingBooking.payment_id,
          amount: String(existingBooking.total_amount),
          currency: existingBooking.currency || 'USD',
          idempotent: true,
        });
      }
    }

    const accessToken = await getPayPalAccessToken();

    // Capture the order with PayPal-Request-Id header for gateway-level idempotency
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

    const capture = await captureResponse.json();

    // Handle ORDER_ALREADY_CAPTURED error gracefully (idempotent case from PayPal)
    if (!captureResponse.ok) {
      const isAlreadyCaptured = capture.details?.some(
        (d: { issue?: string }) => d.issue === 'ORDER_ALREADY_CAPTURED'
      );

      if (isAlreadyCaptured) {
        // Fetch order details from PayPal to confirm completion
        const orderCheck = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (orderCheck.ok) {
          const orderData = await orderCheck.json();
          const captureUnit = orderData.purchase_units?.[0]?.payments?.captures?.[0];
          return NextResponse.json({
            status: 'COMPLETED',
            captureId: captureUnit?.id || orderId,
            amount: captureUnit?.amount?.value,
            currency: captureUnit?.amount?.currency_code || 'USD',
            idempotent: true,
          });
        }
      }

      console.error('[PayPal] Capture failed:', capture);
      return NextResponse.json(
        { error: 'PayPal capture failed. Contact support.' },
        { status: 502 }
      );
    }

    // The capture response includes detailed payment information
    const captureUnit = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId = captureUnit?.id || orderId;

    // ── Update or Insert Booking Record in DB (Idempotent upsert) ───────────
    if (isSupabaseConfigured && supabase && bookingRef) {
      try {
        const details = (body.bookingDetails || {}) as Record<string, any>;
        const amountValue = Number(captureUnit?.amount?.value) || Number(details.total_amount) || 0;

        const { error: dbErr } = await supabase
          .from('bookings')
          .upsert([{
            booking_reference: bookingRef,
            user_name: details.user_name || 'Guest',
            user_email: details.user_email || 'guest@example.com',
            user_phone: details.user_phone || '',
            user_country: details.user_country || '',
            booking_date: details.booking_date || new Date().toISOString().split('T')[0],
            participants_count: Number(details.participants_count) || 1,
            pickup_address: details.pickup_address || '',
            total_amount: amountValue,
            currency: captureUnit?.amount?.currency_code || 'USD',
            payment_status: 'confirmed',
            booking_status: 'confirmed',
            payment_id: captureId,
            payment_method: 'paypal',
          }], { onConflict: 'booking_reference' });

        if (dbErr) {
          console.error('[PayPal] DB booking upsert error:', dbErr);
        }
      } catch (dbErr) {
        console.error('[PayPal] Failed to upsert booking payment in DB:', dbErr);
      }
    }

    return NextResponse.json({
      status: capture.status,
      captureId: captureId,
      amount: captureUnit?.amount?.value,
      currency: captureUnit?.amount?.currency_code,
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
