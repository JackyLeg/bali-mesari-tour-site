/**
 * 📚 HOW THIS WORKS — Wise Payment Link API (POST /api/payment/wise)
 *
 * Wise (formerly TransferWise) is excellent for international transfers —
 * especially when customers pay from countries like Australia, Europe, or the US
 * to a business in Indonesia. Wise offers mid-market exchange rates (much better
 * than PayPal's rates) and lower transfer fees.
 *
 * WISE PAYMENT APPROACH (Two Options):
 *
 * OPTION A — Payment Links (SIMPLER, used here):
 *   Wise offers "Payment Links" — a pre-filled URL you send to customers.
 *   The customer opens the link, sees the amount pre-filled in Wise,
 *   and completes the payment. No complex API integration needed.
 *   
 *   URL format: https://wise.com/pay/r/{profileId}?amount=XX&currency=USD&...
 *
 * OPTION B — Full API Integration (COMPLEX):
 *   Use Wise's REST API to programmatically create quotes and transfers.
 *   Requires a Business Wise account with API access enabled.
 *   More control but much more setup.
 *
 * This implementation uses Option A (Payment Links) for simplicity,
 * with a structured server-side function so you can upgrade to Option B later.
 *
 * SETUP GUIDE:
 *   1. Go to https://wise.com and create a Business account
 *   2. Go to https://wise.com/settings/api-tokens
 *   3. Create an API key with "read-only" permissions
 *   4. Find your Profile ID at https://api.wise.com/v1/profiles (use your API key)
 *   5. Add both to your .env.local
 */

import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/security';

const WISE_PROFILE_ID = process.env.WISE_PROFILE_ID || '';

/**
 * POST /api/payment/wise
 *
 * Generates a Wise payment link for a booking.
 *
 * Request body:
 * {
 *   amount: number,        // Total in USD
 *   bookingRef: string,    // e.g. "BMT-849201"
 *   activityTitle: string,
 *   guestName: string,
 * }
 *
 * Response:
 * {
 *   paymentUrl: string,  // URL to redirect user to Wise
 *   reference: string,   // Payment reference for tracking
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const amount = Number(body.amount);
    const bookingRef = sanitizeInput(String(body.bookingRef || ''), 50);
    const activityTitle = sanitizeInput(String(body.activityTitle || ''), 100);
    const guestName = sanitizeInput(String(body.guestName || ''), 100);

    // Server-side amount validation
    if (!amount || amount <= 0 || amount > 10000) {
      return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 });
    }

    if (!WISE_PROFILE_ID) {
      // If Wise is not configured, return a helpful error
      return NextResponse.json(
        { 
          error: 'Wise payment is not configured yet.',
          fallback: true,
          // Provide the WhatsApp contact as fallback
          whatsappUrl: `https://wa.me/6285128016716?text=Hi!%20I%20want%20to%20pay%20via%20Wise%20for%20booking%20${bookingRef}%20-%20${activityTitle}%20-%20USD%20${amount}`,
        },
        { status: 200 } // Return 200 so the UI can handle gracefully
      );
    }

    // ── Build Wise Payment Link ──────────────────────────────────────────────
    // The reference appears in both Wise and your bank statement for matching
    const reference = `BMT-${bookingRef}`;

    // Wise Payment Link URL format
    // This opens Wise with the amount and currency pre-filled
    const wiseParams = new URLSearchParams({
      amount: amount.toFixed(2),
      currency: 'USD',
      reference: reference,
      note: `Bali Mesari Tour - ${activityTitle} - ${guestName}`,
    });

    const paymentUrl = `https://wise.com/pay/r/${WISE_PROFILE_ID}?${wiseParams.toString()}`;

    return NextResponse.json({
      paymentUrl,
      reference,
      amount: amount.toFixed(2),
      currency: 'USD',
      note: `After payment, please send your Wise confirmation to support@balimesari.com or WhatsApp +62 851-2801-6716`,
    });

  } catch (error) {
    console.error('[Wise] Error generating payment link:', error);
    return NextResponse.json(
      { error: 'Failed to generate Wise payment link.' },
      { status: 500 }
    );
  }
}
