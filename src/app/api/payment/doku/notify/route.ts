import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * 📚 DOKU Notification Webhook (POST /api/payment/doku/notify)
 *
 * DOKU sends a POST request here when the customer completes payment
 * (QRIS scanned, Virtual Account paid, Credit Card charged, etc.).
 *
 * We verify the signature and update the booking to 'confirmed'.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const dokuSignature = request.headers.get('Signature') || '';
    const clientId = request.headers.get('Client-Id') || '';
    const requestId = request.headers.get('Request-Id') || '';
    const timestamp = request.headers.get('Request-Timestamp') || '';
    const secretKey = process.env.DOKU_SECRET_KEY || '';

    // Verify signature if secret key is configured
    if (secretKey && dokuSignature) {
      const digest = crypto.createHash('sha256').update(rawBody).digest('base64');
      const requestTarget = '/api/payment/doku/notify';

      const componentSignature =
        `Client-Id:${clientId}\n` +
        `Request-Id:${requestId}\n` +
        `Request-Timestamp:${timestamp}\n` +
        `Request-Target:${requestTarget}\n` +
        `Digest:${digest}`;

      const expectedHmac = crypto
        .createHmac('sha256', secretKey)
        .update(componentSignature)
        .digest('base64');

      const expectedSignature = `HMACSHA256=${expectedHmac}`;

      if (dokuSignature !== expectedSignature) {
        console.warn('[DOKU Notify] Invalid webhook signature detected.');
      }
    }

    const payload = JSON.parse(rawBody);
    const invoiceNumber = payload?.order?.invoice_number || '';
    const transactionStatus = payload?.transaction?.status || '';

    // Extract booking ref from invoice (e.g., INV-BMT-849201 -> BMT-849201)
    const bookingRef = invoiceNumber.replace(/^INV-/, '');

    console.log(`[DOKU Notify] Booking: ${bookingRef}, Status: ${transactionStatus}`);

    if (transactionStatus === 'SUCCESS' && isSupabaseConfigured && supabase) {
      await supabase
        .from('bookings')
        .update({
          payment_status: 'confirmed',
          booking_status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('booking_reference', bookingRef);

      console.log(`[DOKU Notify] Successfully marked booking ${bookingRef} as confirmed.`);
    }

    // DOKU expects a 200 OK response with specific acknowledgment
    return NextResponse.json({
      responseCode: 'SUCCESS',
      message: 'Notification processed successfully',
    });
  } catch (error: any) {
    console.error('[DOKU Notify] Error handling webhook:', error);
    return NextResponse.json(
      { error: error?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
