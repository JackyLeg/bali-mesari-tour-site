import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sanitizeInput, sanitizeEmail } from '@/lib/security';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * 📚 HOW THIS WORKS — DOKU Payment Gateway API (POST /api/payment/doku)
 *
 * DOKU is Indonesia's leading payment gateway, supporting:
 * - QRIS (BCA, GoPay, OVO, Dana, LinkAja, ShopeePay, all Indonesian banking apps)
 * - Virtual Accounts (BCA, Mandiri, BRI, BNI, Permata, CIMB)
 * - Credit & Debit Cards (Visa, Mastercard, JCB)
 * - Convenience Stores (Alfamart, Indomaret)
 * - E-Wallets (OVO, DANA, ShopeePay)
 *
 * DOKU CHECKOUT API FLOW:
 * 1. Customer chooses "Pay with DOKU" on checkout.
 * 2. Our server creates an order on DOKU Checkout API with HMAC-SHA256 signature.
 * 3. DOKU returns a secure hosted checkout URL.
 * 4. The customer is redirected to DOKU, pays via QRIS/VA/Card, and gets redirected
 *    back to /booking/confirmation.
 *
 * SETUP GUIDE (.env.local):
 * DOKU_ENVIRONMENT=sandbox (or production)
 * DOKU_CLIENT_ID=your_doku_client_id
 * DOKU_SECRET_KEY=your_doku_secret_key
 */

const DOKU_ENV = process.env.DOKU_ENVIRONMENT || 'sandbox';
const DOKU_BASE_URL =
  DOKU_ENV === 'production'
    ? 'https://api.doku.com'
    : 'https://api-sandbox.doku.com';

const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID || '';
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      amountIdr,
      bookingRef,
      activityTitle,
      packageName,
      bookingDate,
      participants,
      guestName,
      guestEmail,
      guestPhone,
      guestCountry,
      pickupHotel,
      specialRequests,
    } = body;

    if (!amount || !bookingRef || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: 'Missing required booking details for payment.' },
        { status: 400 }
      );
    }

    const host = request.headers.get('host') || 'balimesari.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    // Clean data
    const sanitizedName = sanitizeInput(guestName, 150);
    const sanitizedEmail = sanitizeEmail(guestEmail);
    const sanitizedPhone = sanitizeInput(guestPhone || '', 50);
    const sanitizedTitle = sanitizeInput(activityTitle || 'Bali Tour', 100);
    const sanitizedHotel = sanitizeInput(pickupHotel || '', 255);
    const sanitizedCountry = sanitizeInput(guestCountry || 'Indonesia', 100);

    // Compute IDR amount (minimum 10,000 IDR for DOKU)
    const finalAmountIdr = Math.max(10000, Math.round(Number(amountIdr || amount * 16200)));

    // 1️⃣ Save pending booking to Supabase so it's tracked
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('bookings').insert([
          {
            booking_reference: bookingRef,
            user_name: sanitizedName,
            user_email: sanitizedEmail,
            user_phone: sanitizedPhone,
            user_country: sanitizedCountry,
            booking_date: bookingDate,
            participants_count: Number(participants) || 2,
            pickup_address: sanitizedHotel,
            special_requests: specialRequests || '',
            total_amount: Number(amount),
            currency: 'IDR',
            payment_status: 'pending_payment',
            booking_status: 'pending',
          },
        ]);
      } catch (dbErr) {
        console.error('Supabase pending booking error:', dbErr);
      }
    }

    // 2️⃣ If DOKU credentials are NOT yet set in .env.local, provide smooth Sandbox Demo fallback
    if (!DOKU_CLIENT_ID || !DOKU_SECRET_KEY) {
      console.log('[DOKU] No DOKU credentials configured. Returning Demo Payment URL.');
      
      const demoConfirmationUrl = `${origin}/booking/confirmation?doku=demo&ref=${bookingRef}&title=${encodeURIComponent(
        sanitizedTitle
      )}&date=${bookingDate}&guests=${participants}&total=${amount}&name=${encodeURIComponent(
        sanitizedName
      )}&email=${encodeURIComponent(sanitizedEmail)}&hotel=${encodeURIComponent(sanitizedHotel)}`;

      return NextResponse.json({
        success: true,
        isDemo: true,
        paymentUrl: demoConfirmationUrl,
        message: 'DOKU demo mode: Credentials not configured yet in .env.local.',
      });
    }

    // 3️⃣ Real DOKU Checkout API Call
    const invoiceNumber = `INV-${bookingRef}`;
    const callbackUrl = `${origin}/booking/confirmation?doku=success&ref=${bookingRef}&title=${encodeURIComponent(
      sanitizedTitle
    )}&date=${bookingDate}&guests=${participants}&total=${amount}&name=${encodeURIComponent(
      sanitizedName
    )}&email=${encodeURIComponent(sanitizedEmail)}&hotel=${encodeURIComponent(sanitizedHotel)}`;

    const dokuPayload = {
      order: {
        amount: finalAmountIdr,
        invoice_number: invoiceNumber,
        currency: 'IDR',
        callback_url: callbackUrl,
        auto_redirect: true,
      },
      payment: {
        payment_due_date: 60, // 60 minutes expiry
      },
      customer: {
        id: `CUST-${bookingRef}`,
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone.replace(/[^0-9+]/g, '') || '+6281234567890',
        address: sanitizedHotel || 'Bali, Indonesia',
        country: 'ID',
      },
    };

    const jsonBody = JSON.stringify(dokuPayload);
    const digest = crypto.createHash('sha256').update(jsonBody).digest('base64');
    const requestId = crypto.randomUUID();
    const timestamp = new Date().toISOString().slice(0, 19) + 'Z';
    const requestTarget = '/checkout/v1/payment';

    // Signature formula according to DOKU Documentation
    const componentSignature =
      `Client-Id:${DOKU_CLIENT_ID}\n` +
      `Request-Id:${requestId}\n` +
      `Request-Timestamp:${timestamp}\n` +
      `Request-Target:${requestTarget}\n` +
      `Digest:${digest}`;

    const hmac = crypto
      .createHmac('sha256', DOKU_SECRET_KEY)
      .update(componentSignature)
      .digest('base64');

    const signature = `HMACSHA256=${hmac}`;

    const response = await fetch(`${DOKU_BASE_URL}${requestTarget}`, {
      method: 'POST',
      headers: {
        'Client-Id': DOKU_CLIENT_ID,
        'Request-Id': requestId,
        'Request-Timestamp': timestamp,
        'Signature': signature,
        'Content-Type': 'application/json',
      },
      body: jsonBody,
    });

    const responseData = await response.json();

    if (!response.ok || !responseData?.response?.payment?.url) {
      console.error('[DOKU] API Error:', responseData);
      return NextResponse.json(
        {
          error:
            responseData?.error?.message ||
            'Failed to generate DOKU payment link. Please try again or choose another payment method.',
          details: responseData,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentUrl: responseData.response.payment.url,
      invoiceNumber: responseData.response.order.invoice_number,
    });
  } catch (error: any) {
    console.error('[DOKU] Handler Exception:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error processing DOKU payment' },
      { status: 500 }
    );
  }
}
