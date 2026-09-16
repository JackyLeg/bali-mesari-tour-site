'use client';

import React, { Suspense } from 'react';
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
  MessageSquarePlus
} from 'lucide-react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const ref = searchParams.get('ref') || 'BMT-849201';
  const title = searchParams.get('title') || 'Mount Batur Sunrise Trekking & Hot Springs';
  const slug = searchParams.get('slug') || '';
  const date = searchParams.get('date') || '2026-09-05';
  const guests = searchParams.get('guests') || '2';
  const total = searchParams.get('total') || '70';
  const name = searchParams.get('name') || 'Sarah Jenkins';
  const email = searchParams.get('email') || 'sarah@example.com';
  const hotel = searchParams.get('hotel') || 'Padma Resort Ubud Lobby';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success Header Box */}
        <div className="bg-emerald-800 text-white rounded-3xl p-8 text-center shadow-xl mb-8 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center mx-auto mb-4 shadow-md animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-300 block mb-1">
            Booking Confirmed
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">Suksma! Your Tour is Reserved</h1>
          <p className="text-emerald-100/90 text-sm mt-2 max-w-md mx-auto">
            We sent your confirmation voucher to <span className="font-bold text-white">{email}</span> and notified your local driver on WhatsApp.
          </p>
        </div>

        {/* Digital Printable Voucher Card */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden mb-8">
          
          {/* Voucher Header Bar */}
          <div className="bg-emerald-950 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-emerald-300 block">Booking Reference</span>
              <span className="text-2xl font-mono font-extrabold text-amber-400">{ref}</span>
            </div>

            {/* QR Code Simulator */}
            <div className="bg-white p-2 rounded-xl flex items-center gap-3 text-emerald-950">
              <div className="w-12 h-12 bg-emerald-900 text-white font-mono text-[9px] flex items-center justify-center text-center p-1 rounded font-bold">
                QR CODE
              </div>
              <div className="text-left pr-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Status</span>
                <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            </div>
          </div>

          {/* Voucher Details Body */}
          <div className="p-6 space-y-6">
            
            {/* Experience Name */}
            <div>
              <span className="text-xs font-bold uppercase text-gray-400 block mb-1">Reserved Experience</span>
              <h2 className="text-xl font-extrabold text-gray-900 leading-snug">{title}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <Calendar className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-gray-400 font-bold block">Travel Date</span>
                  <span className="font-extrabold text-gray-900">{date}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <Users className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-gray-400 font-bold block">Party Size</span>
                  <span className="font-extrabold text-gray-900">{guests} Guests</span>
                </div>
              </div>
            </div>

            {/* Guest & Pickup Info */}
            <div className="space-y-3 pt-4 border-t border-gray-100 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Lead Traveler:</span>
                <span className="font-bold text-gray-900">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Hotel Pickup Address:</span>
                <span className="font-bold text-emerald-800 text-right">{hotel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Driver Pickup Time:</span>
                <span className="font-bold text-gray-900">01:30 AM (Driver sends WA prior)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Total Amount:</span>
                <span className="font-extrabold text-emerald-900 text-base">${total}</span>
              </div>
            </div>

            {/* WhatsApp Direct Help */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between gap-4">
              <div className="text-xs">
                <p className="font-bold text-emerald-950">Need to modify hotel pickup?</p>
                <p className="text-emerald-700 mt-0.5">Chat directly with local operator on WhatsApp.</p>
              </div>
              <a 
                href={`https://wa.me/6285128016716?text=Hi%20Bali%20Mesari,%20I%20have%20booking%20ref%20${ref}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-xl shrink-0 shadow-sm transition-colors"
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
                  <span>Have you completed this tour or traveled with us?</span>
                </div>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Your feedback helps other travelers! You can leave an authentic review and rating anytime.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  const targetSlug = slug || 'mount-batur-sunrise-trekking';
                  router.push(`/activities/${targetSlug}?review=true&name=${encodeURIComponent(name)}&ref=${encodeURIComponent(ref)}#reviews`);
                }}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shrink-0 shadow-sm flex items-center gap-2 transition-transform hover:scale-105"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-amber-300" />
                <span>Write a Review</span>
              </button>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Voucher PDF</span>
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full sm:w-auto px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<div className="p-20 text-center text-sm font-bold text-gray-400">Loading voucher...</div>}>
          <ConfirmationContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
