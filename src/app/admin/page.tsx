'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { INITIAL_ACTIVITIES } from '@/lib/data';
import { isSupabaseConfigured } from '@/lib/supabase';
import { 
  BarChart3, 
  DollarSign, 
  ShoppingBag, 
  Star, 
  Users, 
  Database, 
  CheckCircle2, 
  Plus, 
  Edit, 
  Trash2, 
  Eye 
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'bookings'>('overview');

  const mockBookings = [
    { ref: 'BMT-849201', name: 'Sarah Jenkins', title: 'Mount Batur Sunrise Trekking', date: '2026-09-05', guests: 2, total: 70, status: 'Confirmed' },
    { ref: 'BMT-712390', name: 'Markus Weber', title: 'Nusa Penida All-Inclusive Day Tour', date: '2026-09-06', guests: 4, total: 232, status: 'Confirmed' },
    { ref: 'BMT-509182', name: 'Elena Rostova', title: 'Best of Ubud Private Day Tour', date: '2026-09-07', guests: 2, total: 84, status: 'Confirmed' },
    { ref: 'BMT-338210', name: 'David Miller', title: 'Ayung River Rafting & Bali Swing', date: '2026-09-08', guests: 3, total: 87, status: 'Completed' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🌴</span>
                <h1 className="text-2xl font-extrabold text-gray-900">Bali Mesari Tour — Admin Portal</h1>
              </div>
              <p className="text-xs text-gray-500">Marketplace management dashboard & booking engine.</p>
            </div>

            {/* Supabase Status Indicator Badge */}
            <div className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              isSupabaseConfigured 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <Database className="w-4 h-4" />
              <span>{isSupabaseConfigured ? 'Supabase DB Connected' : 'Local Fallback Data Mode'}</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 mb-8 pb-3">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'overview'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Overview & Analytics
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'activities'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tour Catalog ({INITIAL_ACTIVITIES.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'bookings'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Bookings ({mockBookings.length})
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              
              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-gray-400 block uppercase">Total Revenue</span>
                  <span className="text-2xl font-extrabold text-gray-900">$14,280</span>
                  <span className="text-[11px] text-emerald-600 font-bold mt-1 block">↑ +18% from last month</span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-gray-400 block uppercase">Total Bookings</span>
                  <span className="text-2xl font-extrabold text-gray-900">342</span>
                  <span className="text-[11px] text-emerald-600 font-bold mt-1 block">98% completion rate</span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <Star className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-gray-400 block uppercase">Average Rating</span>
                  <span className="text-2xl font-extrabold text-gray-900">4.9 / 5.0</span>
                  <span className="text-[11px] text-gray-500 font-medium mt-1 block">Based on 1,840+ reviews</span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-gray-400 block uppercase">Verified Local Drivers</span>
                  <span className="text-2xl font-extrabold text-gray-900">28 Operators</span>
                  <span className="text-[11px] text-emerald-600 font-bold mt-1 block">Active across Bali</span>
                </div>
              </div>

              {/* Recent Bookings Table */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-base font-extrabold text-gray-900 mb-4">Recent Bookings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px]">
                        <th className="pb-3">Ref</th>
                        <th className="pb-3">Guest Name</th>
                        <th className="pb-3">Tour Experience</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Guests</th>
                        <th className="pb-3">Total</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                      {mockBookings.map((b) => (
                        <tr key={b.ref} className="hover:bg-gray-50">
                          <td className="py-3 font-mono font-bold text-emerald-800">{b.ref}</td>
                          <td className="py-3 font-bold text-gray-900">{b.name}</td>
                          <td className="py-3">{b.title}</td>
                          <td className="py-3">{b.date}</td>
                          <td className="py-3">{b.guests}</td>
                          <td className="py-3 font-bold text-gray-900">${b.total}</td>
                          <td className="py-3">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900">Manage Tour Inventory</h3>
                <button 
                  onClick={() => alert('Add Activity Modal: Connected to Supabase POST /api/activities')}
                  className="px-4 py-2 bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Experience</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px]">
                      <th className="pb-3">Tour Title</th>
                      <th className="pb-3">Location</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3">Rating</th>
                      <th className="pb-3">Badge</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                    {INITIAL_ACTIVITIES.map((act) => (
                      <tr key={act.id} className="hover:bg-gray-50">
                        <td className="py-3 font-bold text-gray-900 max-w-xs truncate">{act.title}</td>
                        <td className="py-3">{act.locationName}</td>
                        <td className="py-3 capitalize">{act.categorySlug}</td>
                        <td className="py-3 font-bold text-emerald-900">${act.priceDiscounted}</td>
                        <td className="py-3">★ {act.rating} ({act.reviewCount})</td>
                        <td className="py-3">
                          {act.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                              {act.badge}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right space-x-2">
                          <a 
                            href={`/activities/${act.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 inline-block"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-base font-extrabold text-gray-900">All Confirmed Guest Reservations</h3>
              <div className="space-y-4">
                {mockBookings.map((b) => (
                  <div key={b.ref} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="font-mono font-bold text-emerald-800 text-xs">{b.ref}</span>
                      <h4 className="font-extrabold text-sm text-gray-900">{b.name} — {b.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Date: {b.date} • Guests: {b.guests} • Total: ${b.total}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-800 text-white text-xs font-bold rounded-xl self-start sm:self-auto">
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
