'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Users, 
  PhoneCall, 
  Printer, 
  Share2, 
  Clock, 
  ShieldCheck, 
  Home,
  Star,
  MessageSquarePlus,
  Sparkles,
  FileText
} from 'lucide-react';
import { useCurrency } from '@/lib/currency';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { format } = useCurrency();

  // Retrieve URL params or fallback to stored pending booking
  const ref = searchParams.get('ref') || 'BMT-849201';
  const title = searchParams.get('title') || 'Mount Batur Sunrise Trekking & Hot Springs';
  const packageName = searchParams.get('package') || '';
  const slug = searchParams.get('slug') || '';
  const date = searchParams.get('date') || '2026-09-05';
  const guests = searchParams.get('guests') || '2';
  const total = searchParams.get('total') || '70';
  const name = searchParams.get('name') || 'Sarah Jenkins';
  const email = searchParams.get('email') || 'sarah@example.com';
  const phone = searchParams.get('phone') || '';
  const country = searchParams.get('country') || '';
  const hotel = searchParams.get('hotel') || 'Padma Resort Ubud Lobby';

  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-gray-50 print:pt-0 print:pb-0 print:bg-white print:min-h-0">
      <style jsx global>{`
        @media print {
          header, footer, nav, .no-print, [data-no-print] {
            display: none !important;
          }
          body, html, main {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #111827 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .print-receipt-card {
            box-shadow: none !important;
            border: 2px solid #064e3b !important;
            border-radius: 12px !important;
            margin: 0 !important;
            padding: 24px !important;
            width: 100% !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 print-container print:px-0">
        
        {/* Success Header Box (Screen only, hidden on print) */}
        <div className="no-print bg-emerald-800 text-white rounded-3xl p-8 text-center shadow-xl mb-8 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center mx-auto mb-4 shadow-md animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-300 block mb-1">
            Payment Confirmed
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">Suksma! Your Booking is Complete</h1>
          <p className="text-emerald-100/90 text-sm mt-2 max-w-md mx-auto">
            Your official booking receipt has been generated. A copy was sent to <span className="font-bold text-white">{email}</span>.
          </p>
        </div>

        {/* Official Printable Receipt Card */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden mb-8 print-receipt-card">
          
          {/* Receipt Top Header Bar */}
          <div className="bg-emerald-950 text-white p-6 sm:p-8 border-b-2 border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:bg-emerald-950 print:text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 border border-emerald-600 flex items-center justify-center font-bold text-2xl text-amber-400 shadow-sm shrink-0">
                🌴
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight block">
                  Bali Mesari <span className="text-amber-400">Tour</span>
                </span>
                <span className="text-[11px] text-emerald-300 font-semibold block tracking-wider uppercase">
                  Official Booking Receipt & Invoice
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-emerald-900">
              <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block">
                Receipt / Reference No.
              </span>
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-amber-400 block">
                {ref}
              </span>
              <span className="text-[10px] text-emerald-300 font-medium block">
                Issued: {currentDate || 'Today'}
              </span>
            </div>
          </div>

          {/* Receipt Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Payment & Verification Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-xs font-extrabold text-emerald-950 block">Payment Status: Confirmed & Paid</span>
                  <span className="text-[11px] text-emerald-700">100% Guaranteed Booking Voucher</span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-2xs">
                Booking ID: {ref}
              </span>
            </div>

            {/* Experience & Package Section */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider block mb-1">
                Reserved Tour Experience
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">
                {title}
              </h2>
              {packageName && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Selected Tier: {packageName}</span>
                </div>
              )}
            </div>

            {/* Schedule & Party Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                <Calendar className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-gray-400 font-bold block text-[10px] uppercase">Travel Date</span>
                  <span className="font-extrabold text-gray-900 text-sm">{date}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                <Users className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-gray-400 font-bold block text-[10px] uppercase">Total Guests</span>
                  <span className="font-extrabold text-gray-900 text-sm">{guests} Guests</span>
                </div>
              </div>
            </div>

            {/* Customer & Logistics Details Table */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden text-xs">
              <div className="bg-gray-100/80 px-4 py-2.5 font-bold text-gray-800 text-[11px] uppercase tracking-wider border-b border-gray-200">
                Guest & Pickup Logistics
              </div>
              <div className="divide-y divide-gray-100">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-gray-500 font-medium">Lead Traveler:</span>
                  <span className="font-bold text-gray-900">
                    {name} {country ? `(${country})` : ''}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-gray-500 font-medium">Contact Email:</span>
                  <span className="font-bold text-gray-900">{email}</span>
                </div>
                {phone && (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-gray-500 font-medium">Phone / WhatsApp:</span>
                    <span className="font-bold text-gray-900">{phone}</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-gray-500 font-medium">Pickup Location:</span>
                  <span className="font-bold text-emerald-800 text-right max-w-xs">{hotel}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-gray-500 font-medium">Driver Pickup Notice:</span>
                  <span className="font-semibold text-gray-800 text-right">
                    Driver contacts via WhatsApp 12h prior with car license & exact time
                  </span>
                </div>
              </div>
            </div>

            {/* Total Paid Section */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Amount Paid</span>
                <span className="text-xs text-gray-500 font-medium">Inclusive of all taxes, driver & transport</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-emerald-950 block">
                  {format(Number(total))}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                  Payment Complete
                </span>
              </div>
            </div>

            {/* Official Receipt Footer Note */}
            <div className="border-t border-dashed border-gray-300 pt-4 text-[11px] text-gray-500 leading-relaxed">
              <p className="font-bold text-gray-800">
                Official Electronic Receipt • Bali Mesari Tour Operator
              </p>
              <p className="mt-0.5">
                Please present this receipt (printed copy or digital screenshot) to your tour driver upon pickup. 
                For instant assistance, WhatsApp us at <strong className="text-emerald-800">+62 851-2801-6716</strong> or email <strong className="text-emerald-800">support@balimesaritour.com</strong>.
              </p>
            </div>

            {/* Screen-Only Widgets (Hidden when Printing) */}
            <div className="no-print space-y-4 pt-2">
              {/* WhatsApp Direct Help */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between gap-4">
                <div className="text-xs">
                  <p className="font-bold text-emerald-950">Need to modify hotel pickup or time?</p>
                  <p className="text-emerald-700 mt-0.5">Chat directly with local operator on WhatsApp.</p>
                </div>
                <a 
                  href={`https://wa.me/6285128016716?text=Hi%20Bali%20Mesari,%20I%20have%20booking%20ref%20${ref}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-xl shrink-0 shadow-sm transition-colors cursor-pointer"
                >
                  Chat WA
                </a>
              </div>

              {/* Verified Review CTA */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs">
                  <div className="flex items-center gap-1.5 font-extrabold text-amber-950 mb-0.5">
                    <div className="flex text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                    </div>
                    <span>Traveled with Bali Mesari Tour?</span>
                  </div>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Your verified feedback helps other travelers explore Bali with confidence.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const targetSlug = slug || 'mount-batur-sunrise-trekking';
                    router.push(`/activities/${targetSlug}?review=true&name=${encodeURIComponent(name)}&ref=${encodeURIComponent(ref)}#reviews`);
                  }}
                  className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shrink-0 shadow-sm flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5 text-amber-300" />
                  <span>Write a Review</span>
                </button>
              </div>
            </div>

          </div>

          {/* Action Buttons (Screen only, hidden on print) */}
          <div className="no-print bg-gray-50 p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4 text-emerald-800" />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Return to Homepage</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans print:bg-white print:min-h-0">
      <Header />
      <main className="flex-grow print:p-0 print:m-0">
        <Suspense fallback={<div className="p-20 text-center text-sm font-bold text-gray-400">Loading receipt...</div>}>
          <ConfirmationContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
