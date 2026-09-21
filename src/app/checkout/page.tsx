/**
 * 📚 HOW THIS WORKS — Checkout Page (src/app/checkout/page.tsx)
 *
 * KEY CHANGES FROM ORIGINAL:
 *
 * 1. CURRENCY DISPLAY:
 *    useCurrency().format() shows prices in user's preferred currency.
 *    The booking summary sidebar shows "Total: $70 / Rp 1,134,000"
 *
 * 2. INPUT SANITIZATION:
 *    sanitizeInput() cleans all user-provided strings before they're
 *    sent to Supabase. This prevents SQL injection (though Supabase's
 *    parameterized queries already protect against this — defense in depth).
 *
 * 3. PAYPAL PAYMENT:
 *    When user selects PayPal, we call POST /api/payment/paypal
 *    with the booking amount. The API returns a PayPal approval URL.
 *    We redirect the user to PayPal, they approve, PayPal redirects them
 *    back to /booking/confirmation.
 *
 * 4. WISE PAYMENT:
 *    When user selects Wise, we call POST /api/payment/wise
 *    which generates a pre-filled Wise payment link.
 *    We redirect the user to Wise to complete their bank transfer.
 *
 * 5. FORM VALIDATION:
 *    Basic validation added for empty fields before submission.
 */

'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { sanitizeInput, sanitizeEmail, validateEmail } from '@/lib/security';
import { useCurrency } from '@/lib/currency';
import { 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  CheckCircle2, 
  Calendar, 
  Users, 
  MapPin, 
  PhoneCall, 
  Mail, 
  User, 
  ArrowLeft,
  Globe,
  RefreshCw,
} from 'lucide-react';

// ─── PayPal Logo SVG ──────────────────────────────────────────────────────────
// Inline SVG so we don't need external images
function PayPalLogo() {
  return (
    <svg viewBox="0 0 124 33" className="h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="24" fontSize="22" fontWeight="bold" fill="#003087" fontFamily="Arial">Pay</text>
      <text x="34" y="24" fontSize="22" fontWeight="bold" fill="#009cde" fontFamily="Arial">Pal</text>
    </svg>
  );
}

// ─── Wise Logo ────────────────────────────────────────────────────────────────
function WiseLogo() {
  return (
    <span className="font-extrabold text-sm" style={{ color: '#163300' }}>
      <span style={{ color: '#9fe870' }}>wise</span>
    </span>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 📚 useCurrency gives us format() to display prices in USD or IDR
  const { format, currency, rate } = useCurrency();

  const activityTitle = searchParams.get('activityTitle') || 'Mount Batur Sunrise Trekking';
  const activitySlug = searchParams.get('slug') || '';
  const bookingDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const participants = Number(searchParams.get('participants') || 2);
  const pricePerPerson = Number(searchParams.get('pricePerPerson') || 35);
  const totalPrice = Number(searchParams.get('totalPrice') || pricePerPerson * participants);
  const includePickup = searchParams.get('pickup') === 'yes';

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Australia');
  const [pickupHotel, setPickupHotel] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'arrival' | 'paypal' | 'wise'>('arrival');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // ─── Form Submission ─────────────────────────────────────────────────────────

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // ── Basic Validation ───────────────────────────────────────────────────
    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!validateEmail(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter your phone number.');
      return;
    }
    if (!pickupHotel.trim()) {
      setFormError('Please enter your hotel or pickup location.');
      return;
    }

    setSubmitting(true);

    // ── Sanitize ALL user inputs ───────────────────────────────────────────
    // 📚 WHAT IS INPUT SANITIZATION?
    // Even though Supabase uses parameterized queries (safe from SQL injection),
    // we sanitize inputs as an extra "defense in depth" layer.
    // sanitizeInput() removes HTML tags, SQL special chars, and trims whitespace.
    const sanitizedName = sanitizeInput(fullName, 150);
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedPhone = sanitizeInput(phone, 50);
    const sanitizedCountry = sanitizeInput(country, 100);
    const sanitizedHotel = sanitizeInput(pickupHotel, 255);
    const sanitizedRequests = sanitizeInput(specialRequests, 500);

    const bookingRef = 'BMT-' + Math.floor(100000 + Math.random() * 900000);

    // ── Handle PayPal Payment ──────────────────────────────────────────────
    if (paymentMethod === 'paypal') {
      try {
        // Call our server-side PayPal API (never expose secrets to client)
        const res = await fetch('/api/payment/paypal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalPrice,
            bookingRef,
            activityTitle: sanitizeInput(activityTitle, 100),
            currency: 'USD',
          }),
        });
        const data = await res.json();
        
        if (data.error) {
          setFormError(data.error);
          setSubmitting(false);
          return;
        }

        // Save booking reference to localStorage so confirmation page can retrieve it
        try {
          localStorage.setItem('pending_booking_ref', bookingRef);
          localStorage.setItem('pending_booking_data', JSON.stringify({
            ref: bookingRef,
            name: sanitizedName,
            email: sanitizedEmail,
            title: activityTitle,
            date: bookingDate,
            guests: participants,
            total: totalPrice,
            hotel: sanitizedHotel,
          }));
        } catch {}

        // 📚 Redirect to PayPal for approval
        // The browser navigates to PayPal's website. After the user approves,
        // PayPal redirects them back to /booking/confirmation?paypal=success&ref=BMT-XXXX
        window.location.href = data.approvalUrl;
        return;

      } catch (err) {
        setFormError('Could not connect to PayPal. Please try another payment method.');
        setSubmitting(false);
        return;
      }
    }

    // ── Handle Wise Payment ────────────────────────────────────────────────
    if (paymentMethod === 'wise') {
      try {
        const res = await fetch('/api/payment/wise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalPrice,
            bookingRef,
            activityTitle: sanitizeInput(activityTitle, 100),
            guestName: sanitizedName,
          }),
        });
        const data = await res.json();

        // Save pending booking so confirmation page knows what was booked
        try {
          localStorage.setItem('pending_booking_ref', bookingRef);
          localStorage.setItem('pending_booking_data', JSON.stringify({
            ref: bookingRef,
            name: sanitizedName,
            email: sanitizedEmail,
            title: activityTitle,
            date: bookingDate,
            guests: participants,
            total: totalPrice,
            hotel: sanitizedHotel,
          }));
        } catch {}

        if (data.fallback) {
          // Wise not configured — open WhatsApp as fallback
          window.open(data.whatsappUrl, '_blank');
          router.push(`/booking/confirmation?ref=${bookingRef}&wise=pending&title=${encodeURIComponent(activityTitle)}&date=${bookingDate}&guests=${participants}&total=${totalPrice}&name=${encodeURIComponent(sanitizedName)}&email=${encodeURIComponent(sanitizedEmail)}&hotel=${encodeURIComponent(sanitizedHotel)}`);
          return;
        }

        // 📚 Redirect to Wise payment page
        window.location.href = data.paymentUrl;
        return;

      } catch (err) {
        setFormError('Could not connect to Wise. Please try another payment method.');
        setSubmitting(false);
        return;
      }
    }

    // ── Handle Cash/Arrival Payment ───────────────────────────────────────

    // 1️⃣ Save to Supabase (cross-device sync)
    // 📚 SUPABASE PARAMETERIZED QUERIES:
    // The .insert([{...}]) call uses Supabase's JavaScript client which
    // internally uses PostgreSQL prepared statements. User data is passed
    // as parameters — never concatenated into SQL strings.
    // This makes SQL injection structurally impossible, not just sanitized.
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('bookings').insert([{
          booking_reference: bookingRef,
          user_name: sanitizedName,
          user_email: sanitizedEmail,
          user_phone: sanitizedPhone,
          user_country: sanitizedCountry,
          booking_date: bookingDate,
          participants_count: participants,
          pickup_address: sanitizedHotel,
          special_requests: sanitizedRequests,
          total_amount: totalPrice,
          currency: 'USD',
          payment_status: 'confirmed',
          booking_status: 'confirmed',
        }]);
      } catch (err) {
        console.error('Supabase booking save error:', err);
      }
    }

    // 2️⃣ Also save to localStorage as offline fallback
    try {
      const stored = localStorage.getItem('bookings');
      const existing = stored ? JSON.parse(stored) : [];
      localStorage.setItem('bookings', JSON.stringify([{
        ref: bookingRef, name: sanitizedName, email: sanitizedEmail,
        title: activityTitle, date: bookingDate,
        guests: participants, total: totalPrice,
        status: 'Confirmed', hotel: sanitizedHotel,
      }, ...existing]));
    } catch (_) {}

    const confirmParams = new URLSearchParams({
      ref: bookingRef,
      title: activityTitle,
      slug: activitySlug,
      date: bookingDate,
      guests: participants.toString(),
      total: totalPrice.toString(),
      name: sanitizedName,
      email: sanitizedEmail,
      hotel: sanitizedHotel || 'Ubud Hotel Lobby',
    });
    router.push(`/booking/confirmation?${confirmParams.toString()}`);
  };

  // ─── IDR equivalent display ───────────────────────────────────────────────
  const idrTotal = Math.round(totalPrice * rate);
  const idrFormatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(idrTotal);

  return (
    <div className="pt-24 pb-20 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.back()} 
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tour Details
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Checkout & Reserve
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Fast 1-minute booking • No hidden payment fees • Instant confirmation voucher
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Checkout Form */}
          <form onSubmit={handleSubmitBooking} className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Guest Information */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                <User className="w-4 h-4 text-emerald-700" />
                <span>1. Guest Contact Information</span>
              </h3>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Full Name (Lead Guest) *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={150}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Email Address (Voucher Sent Here) *</label>
                  <input 
                    type="email"
                    required
                    placeholder="sarah@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={254}
                    className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">WhatsApp / Phone Number *</label>
                  <input 
                    type="tel"
                    required
                    placeholder="+61 400 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={50}
                    className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Country of Origin</label>
                <input 
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  maxLength={100}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Step 2: Pickup & Special Instructions */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>2. Hotel Pickup & Logistics</span>
              </h3>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Hotel Name / Pickup Location *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Padma Resort Ubud (Room 204 or Main Lobby)"
                  value={pickupHotel}
                  onChange={(e) => setPickupHotel(e.target.value)}
                  maxLength={255}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Dietary Restrictions or Special Requests (Optional)</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Vegetarian breakfast, child car seat needed..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  maxLength={500}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Step 3: Payment Method */}
            {/*
              📚 PAYMENT OPTIONS EXPLAINED:
              - ARRIVAL: No online payment. User pays the driver in cash (USD or IDR).
                         We just record the booking in our database.
              - PAYPAL:  User is redirected to PayPal's website to pay.
                         Money flows: PayPal account → Bali Mesari's PayPal → bank.
              - WISE:    User is redirected to Wise's website to make a bank transfer.
                         Great for international customers. Lower fees than PayPal.
            */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                <Lock className="w-4 h-4 text-emerald-700" />
                <span>3. Select Preferred Payment</span>
              </h3>

              <div className="space-y-3">
                
                {/* Option A: Pay on Arrival */}
                <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'arrival' ? 'border-emerald-700 bg-emerald-50/50 shadow-sm' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="payment"
                      checked={paymentMethod === 'arrival'}
                      onChange={() => setPaymentMethod('arrival')}
                      className="accent-emerald-700"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block">Pay cash to driver on tour date</span>
                      <span className="text-[11px] text-gray-500">Pay in USD or IDR directly when picked up</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-md">Popular</span>
                </label>

                {/* Option B: PayPal */}
                <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="payment"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="accent-blue-600"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block flex items-center gap-2">
                        Pay with PayPal
                      </span>
                      <span className="text-[11px] text-gray-500">Secure online payment — Visa, Mastercard, PayPal balance</span>
                    </div>
                  </div>
                  {/* PayPal blue P logo */}
                  <div className="w-8 h-8 rounded-lg bg-[#003087] flex items-center justify-center">
                    <span className="text-white font-extrabold text-sm">P</span>
                  </div>
                </label>

                {/* Option C: Wise */}
                <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'wise' ? 'border-green-500 bg-green-50/50 shadow-sm' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="payment"
                      checked={paymentMethod === 'wise'}
                      onChange={() => setPaymentMethod('wise')}
                      className="accent-green-600"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block">Pay with Wise (Bank Transfer)</span>
                      <span className="text-[11px] text-gray-500">Best for AUD, EUR, GBP → IDR. Mid-market rates, low fees.</span>
                    </div>
                  </div>
                  {/* Wise logo — green */}
                  <div className="w-8 h-8 rounded-lg bg-[#9fe870] flex items-center justify-center">
                    <span className="text-[#163300] font-extrabold text-xs">W</span>
                  </div>
                </label>

              </div>

              {/* Payment info by method */}
              {paymentMethod === 'paypal' && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-800">
                  <p className="font-bold mb-1">🔒 Secure PayPal Payment</p>
                  <p>You'll be redirected to PayPal's secure site to complete payment. Your financial details are never shared with us.</p>
                </div>
              )}
              {paymentMethod === 'wise' && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-[11px] text-green-800">
                  <p className="font-bold mb-1">💚 Wise International Transfer</p>
                  <p>You'll be redirected to Wise to complete a bank transfer. Best rates for international payments. After sending, please WhatsApp us your confirmation screenshot.</p>
                </div>
              )}
            </div>

            {/* Form Error */}
            {formError && (
              <div className="flex items-start gap-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <span className="text-red-500 text-base">⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-900/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {paymentMethod === 'paypal' ? 'Redirecting to PayPal...' : paymentMethod === 'wise' ? 'Generating Wise link...' : 'Processing...'}
                </>
              ) : (
                <>
                  {paymentMethod === 'paypal' ? '🔒 Pay with PayPal — ' : paymentMethod === 'wise' ? '💚 Pay with Wise — ' : `✅ Confirm & Reserve — `}
                  {/* Show price in user's selected currency */}
                  {format(totalPrice)}
                  {currency === 'USD' && <span className="font-normal text-emerald-300 text-[11px]">≈ {idrFormatted}</span>}
                </>
              )}
            </button>

          </form>

          {/* Right Summary Sidebar */}
          <aside className="lg:col-span-5">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl space-y-4 sticky top-28">
              <h3 className="text-sm font-extrabold text-gray-900 pb-3 border-b border-gray-100">
                Booking Summary
              </h3>

              <div>
                <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">{activityTitle}</h4>
              </div>

              <div className="space-y-2 text-xs font-medium text-gray-600 pt-2 border-t border-gray-100">
                <div className="flex justify-between">
                  <span>Travel Date:</span>
                  <span className="font-bold text-gray-900">{bookingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Participants:</span>
                  <span className="font-bold text-gray-900">{participants} Guests</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate:</span>
                  {/* 📚 format() converts USD price to user's selected currency */}
                  <span>{format(pricePerPerson)} × {participants}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-extrabold text-gray-900">Total Payable</span>
                  <span className="text-2xl font-extrabold text-emerald-900">
                    {format(totalPrice)}
                  </span>
                </div>
                {/* Always show both currencies for clarity */}
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {currency === 'USD' 
                      ? `≈ ${idrFormatted} IDR`
                      : `= $${totalPrice} USD`
                    }
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Live rate: 1 USD = Rp {rate.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-[11px] text-amber-900 font-medium space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Free Cancellation Policy</span>
                </div>
                <p>Cancel anytime up to 24 hours prior to travel date for a 100% full refund.</p>
              </div>
            </div>
          </aside>

        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<div className="p-20 text-center text-sm font-bold text-gray-400">Loading checkout...</div>}>
          <CheckoutContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
