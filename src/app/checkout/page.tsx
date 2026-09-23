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

// ─── Country Calling Codes & Country Mapping ───────────────────────────────────
const COUNTRY_DIAL_CODES = [
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
  { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
];

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
  const packageName = searchParams.get('packageName') || '';
  const packageDescription = searchParams.get('packageDescription') || '';
  const packageUnit = searchParams.get('packageUnit') || '';

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+62');
  const [phoneRest, setPhoneRest] = useState('');
  const [country, setCountry] = useState('Indonesia');
  const [pickupHotel, setPickupHotel] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'wise'>('paypal');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Auto-fill country of origin when country code is selected, but user can still edit
  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    const matched = COUNTRY_DIAL_CODES.find((c) => c.code === newCode);
    if (matched) {
      setCountry(matched.country);
    }
  };

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
    if (!phoneRest.trim()) {
      setFormError('Please enter your WhatsApp / phone number.');
      return;
    }
    if (!country.trim()) {
      setFormError('Please enter your country of origin.');
      return;
    }
    if (!pickupHotel.trim()) {
      setFormError('Please enter your hotel or pickup location.');
      return;
    }

    setSubmitting(true);

    const fullPhone = `${countryCode} ${phoneRest.trim()}`;

    // ── Sanitize ALL user inputs ───────────────────────────────────────────
    // 📚 WHAT IS INPUT SANITIZATION?
    // Even though Supabase uses parameterized queries (safe from SQL injection),
    // we sanitize inputs as an extra "defense in depth" layer.
    // sanitizeInput() removes HTML tags, SQL special chars, and trims whitespace.
    const sanitizedName = sanitizeInput(fullName, 150);
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedPhone = sanitizeInput(fullPhone, 50);
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
        title: activityTitle,
        package: packageName,
        date: bookingDate,
        guests: participants, total: totalPrice,
        status: 'Confirmed', hotel: sanitizedHotel,
        phone: sanitizedPhone, country: sanitizedCountry,
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
      phone: sanitizedPhone,
      country: sanitizedCountry,
      hotel: sanitizedHotel || 'Ubud Hotel Lobby',
      ...(packageName ? { package: packageName } : {}),
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
                  <label className="text-xs font-bold text-gray-700 block mb-1">Email Address (Receipt Sent Here) *</label>
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
                  <div className="flex items-center gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => handleCountryCodeChange(e.target.value)}
                      className="w-32 sm:w-36 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2.5 outline-none focus:border-emerald-600 cursor-pointer shrink-0"
                    >
                      {COUNTRY_DIAL_CODES.map((item) => (
                        <option key={`${item.code}-${item.country}`} value={item.code}>
                          {item.flag} {item.code} ({item.country})
                        </option>
                      ))}
                    </select>
                    <input 
                      type="tel"
                      required
                      placeholder="812 3456 7890"
                      value={phoneRest}
                      onChange={(e) => setPhoneRest(e.target.value.replace(/[^0-9\s-]/g, ''))}
                      maxLength={30}
                      className="flex-grow text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Country of Origin *</label>
                <input 
                  type="text"
                  required
                  placeholder="Indonesia"
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

            {/* Step 3: Payment Method (Upfront Online Only) */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>3. Secure Online Payment</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  100% Guaranteed Reservation
                </span>
              </div>

              <div className="space-y-3">
                {/* Option 1: PayPal / Card */}
                <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="payment"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="accent-blue-600 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block flex items-center gap-2">
                        Pay with PayPal (Credit / Debit Card)
                      </span>
                      <span className="text-[11px] text-gray-500">Instant reservation — Visa, Mastercard, AMEX, PayPal balance</span>
                    </div>
                  </div>
                  {/* PayPal blue P logo */}
                  <div className="w-8 h-8 rounded-lg bg-[#003087] flex items-center justify-center shrink-0">
                    <span className="text-white font-extrabold text-sm">P</span>
                  </div>
                </label>

                {/* Option 2: Wise */}
                <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'wise' ? 'border-green-500 bg-green-50/50 shadow-sm' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="payment"
                      checked={paymentMethod === 'wise'}
                      onChange={() => setPaymentMethod('wise')}
                      className="accent-green-600 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block">Pay with Wise (Bank Transfer)</span>
                      <span className="text-[11px] text-gray-500">Best for AUD, EUR, GBP, SGD → IDR. Low fees, mid-market rate.</span>
                    </div>
                  </div>
                  {/* Wise logo — green */}
                  <div className="w-8 h-8 rounded-lg bg-[#9fe870] flex items-center justify-center shrink-0">
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
                  {paymentMethod === 'paypal' ? '🔒 Pay with PayPal — ' : '💚 Pay with Wise — '}
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
                {packageName && (
                  <div className="mt-2.5 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider block">
                      Selected Package:
                    </span>
                    <span className="text-xs font-extrabold text-emerald-950 block mt-0.5">
                      {packageName}
                    </span>
                    {packageDescription && (
                      <span className="text-[11px] text-emerald-700 block mt-0.5 leading-snug">
                        {packageDescription}
                      </span>
                    )}
                  </div>
                )}
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
                  <span>{format(pricePerPerson)} {packageUnit ? `(${packageUnit})` : `× ${participants}`}</span>
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
