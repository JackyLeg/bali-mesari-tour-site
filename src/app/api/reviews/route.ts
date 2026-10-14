import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const getAdminClient = () => {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);

async function findVerifiedBooking(
  client: NonNullable<ReturnType<typeof getAdminClient>>,
  bookingReference: string,
  activityId: string,
) {
  if (!/^BMT-[0-9A-F]{32}$/.test(bookingReference) || !isUuid(activityId)) {
    return null;
  }

  const { data, error } = await client
    .from('verified_bookings')
    .select('booking_reference, activity_id, user_name, user_country')
    .eq('booking_reference', bookingReference)
    .eq('activity_id', activityId)
    .maybeSingle();

  if (error) {
    console.error('[Reviews] Booking verification query failed:', error.message);
    throw new Error('Could not verify booking right now.');
  }

  return data;
}

export async function GET(request: NextRequest) {
  const client = getAdminClient();
  if (!client) {
    return NextResponse.json({ error: 'Review verification is not configured.' }, { status: 503 });
  }

  const bookingReference = sanitizeInput(request.nextUrl.searchParams.get('ref') || '', 40).toUpperCase();
  const activityId = sanitizeInput(request.nextUrl.searchParams.get('activityId') || '', 36);

  try {
    const booking = await findVerifiedBooking(client, bookingReference, activityId);
    if (!booking) {
      return NextResponse.json({ error: 'Confirmed booking could not be verified.' }, { status: 404 });
    }

    return NextResponse.json({
      booking: {
        userName: booking.user_name,
        userCountry: booking.user_country || 'Traveler',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not verify booking right now.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const client = getAdminClient();
  if (!client) {
    return NextResponse.json({ error: 'Review submission is not configured.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const activityId = sanitizeInput(String(body.activityId || ''), 36);
    const rating = Number(body.rating);
    const comment = sanitizeInput(String(body.comment || ''), 3000);
    const verified = body.verified === true;

    if (!isUuid(activityId)) {
      return NextResponse.json({ error: 'Invalid activity.' }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment.trim()) {
      return NextResponse.json({ error: 'Enter a rating and review comment.' }, { status: 400 });
    }

    const { data: activity, error: activityError } = await client
      .from('activities')
      .select('id')
      .eq('id', activityId)
      .eq('status', 'published')
      .maybeSingle();

    if (activityError) {
      console.error('[Reviews] Activity lookup failed:', activityError.message);
      return NextResponse.json({ error: 'Could not save review right now.' }, { status: 500 });
    }
    if (!activity) {
      return NextResponse.json({ error: 'Activity was not found.' }, { status: 404 });
    }

    let booking: Awaited<ReturnType<typeof findVerifiedBooking>> = null;
    if (verified) {
      const bookingReference = sanitizeInput(String(body.bookingReference || ''), 40).toUpperCase();
      booking = await findVerifiedBooking(client, bookingReference, activityId);
      if (!booking) {
        return NextResponse.json({ error: 'Confirmed booking could not be verified.' }, { status: 403 });
      }
    }

    const reviewPayload = {
      activity_id: activityId,
      booking_reference: booking?.booking_reference || null,
      is_verified: Boolean(booking),
      user_name: booking?.user_name || sanitizeInput(String(body.userName || ''), 150),
      user_country: booking?.user_country || sanitizeInput(String(body.userCountry || ''), 100) || 'Traveler',
      traveler_type: booking ? 'Verified Guest' : sanitizeInput(String(body.travelerType || ''), 50),
      rating,
      comment,
    };

    if (!reviewPayload.user_name) {
      return NextResponse.json({ error: 'Enter your name.' }, { status: 400 });
    }

    const { data: review, error: insertError } = await client
      .from('reviews')
      .insert(reviewPayload)
      .select('*')
      .single();

    if (insertError) {
      if (insertError.code === '23505' && booking) {
        return NextResponse.json({ error: 'This booking has already submitted a review.' }, { status: 409 });
      }
      console.error('[Reviews] Insert failed:', insertError.message);
      return NextResponse.json({ error: 'Could not save review right now.' }, { status: 500 });
    }

    return NextResponse.json({
      review: {
        id: review.id,
        activityId: review.activity_id,
        isVerified: review.is_verified,
        userName: review.user_name,
        userCountry: review.user_country || 'Traveler',
        rating: Number(review.rating),
        comment: review.comment,
        travelerType: review.traveler_type || 'Traveler',
        date: review.review_date || new Date().toISOString().split('T')[0],
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save review right now.';
    console.error('[Reviews] Request failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
