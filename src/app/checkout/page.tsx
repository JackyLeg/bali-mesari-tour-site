'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
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
  ArrowLeft 
} from 'lucide-react';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activityTitle = searchParams.get('activityTitle') || 'Mount Batur Sunrise Trekking';
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'arrival'>('arrival');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const bookingRef = 'BMT-' + Math.floor(100000 + Math.random() * 900000);

    setTimeout(() => {
      const confirmParams = new URLSearchParams({
        ref: bookingRef,
        title: activityTitle,
        date: bookingDate,
        guests: participants.toString(),
        total: totalPrice.toString(),
        name: fullName || 'Valued Guest',
        email: email || 'guest@example.com',
        hotel: pickupHotel || 'Ubud Hotel Lobby'
      });
      router.push(`/booking/confirmation?${confirmParams.toString()}`);
    }, 1000);
  };

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
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Step 3: Flexible Payment Method */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                <Lock className="w-4 h-4 text-emerald-700" />
                <span>3. Select Preferred Payment</span>
              </h3>

              <div className="space-y-3">
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

                <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'card' ? 'border-emerald-700 bg-emerald-50/50 shadow-sm' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="payment"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="accent-emerald-700"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-gray-900 block">Credit / Debit Card (Stripe)</span>
                      <span className="text-[11px] text-gray-500">Visa, Mastercard, American Express</span>
                    </div>
                  </div>
                  <CreditCard className="w-4 h-4 text-gray-400" />
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-900/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {submitting ? 'Processing Confirmation...' : `Confirm & Reserve ($${totalPrice})`}
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
                  <span>${pricePerPerson} × {participants}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                <span className="text-xs font-extrabold text-gray-900">Total Payable</span>
                <span className="text-2xl font-extrabold text-emerald-900">${totalPrice}</span>
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
