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
 * Request body: { orderId: string }
 * Response: { status: 'COMPLETED', captureId: string, amount: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();

    // Capture the order — this is when money actually moves
    const captureResponse = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!captureResponse.ok) {
      const error = await captureResponse.json();
      console.error('[PayPal] Capture failed:', error);
      return NextResponse.json(
        { error: 'PayPal capture failed. Contact support.' },
        { status: 502 }
      );
    }

    const capture = await captureResponse.json();

    // The capture response includes detailed payment information
    const captureUnit = capture.purchase_units?.[0]?.payments?.captures?.[0];

    return NextResponse.json({
      status: capture.status,           // Should be 'COMPLETED'
      captureId: captureUnit?.id,       // Unique ID for this capture (for refunds)
      amount: captureUnit?.amount?.value, // Actual amount captured
      currency: captureUnit?.amount?.currency_code,
    });

  } catch (error) {
    console.error('[PayPal] Capture error:', error);
    return NextResponse.json(
      { error: 'Payment capture failed. Please contact support.' },
      { status: 500 }
    );
  }
}
