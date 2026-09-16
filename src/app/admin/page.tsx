'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Activity } from '@/types';
import { INITIAL_ACTIVITIES, getActivities } from '@/lib/data';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
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
  Eye,
  X
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'bookings'>('overview');
  const [activitiesList, setActivitiesList] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadAllActivities() {
      const list = await getActivities();
      setActivitiesList(list);
    }
    loadAllActivities();
  }, []);

  // New Activity Form State
  const [formData, setFormData] = useState({
    title: '',
    locationName: '',
    destinationSlug: 'ubud',
    categorySlug: 'adventure',
    shortDescription: '',
    fullDescription: '',
    highlights: 'Experienced local guide, Hotel pickup included, Sacred photos, Refreshments',
    durationHours: 6,
    priceOriginal: 50,
    priceDiscounted: 35,
    badge: 'Popular',
    travelerType: 'Adventure' as const,
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80'
  });

  const mockBookings = [
    { ref: 'BMT-849201', name: 'Sarah Jenkins', title: 'Mount Batur Sunrise Trekking', date: '2026-09-05', guests: 2, total: 70, status: 'Confirmed' },
    { ref: 'BMT-712390', name: 'Markus Weber', title: 'Nusa Penida All-Inclusive Day Tour', date: '2026-09-06', guests: 4, total: 232, status: 'Confirmed' },
    { ref: 'BMT-509182', name: 'Elena Rostova', title: 'Best of Ubud Private Day Tour', date: '2026-09-07', guests: 2, total: 84, status: 'Confirmed' },
    { ref: 'BMT-338210', name: 'David Miller', title: 'Ayung River Rafting & Bali Swing', date: '2026-09-08', guests: 3, total: 87, status: 'Completed' },
  ];

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `tour-${Date.now()}`;

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      title: formData.title,
      slug: slug,
      locationName: formData.locationName,
      destinationSlug: formData.destinationSlug,
      categorySlug: formData.categorySlug,
      shortDescription: formData.shortDescription || formData.title,
      fullDescription: formData.fullDescription || formData.shortDescription || formData.title,
      highlights: formData.highlights.split(',').map(s => s.trim()).filter(Boolean),
      included: ['Hotel pickup and drop-off', 'English-speaking driver', 'Mineral water', 'Insurance'],
      notIncluded: ['Personal tips & souvenirs'],
      itinerary: [
        { time: '08:00 AM', title: 'Hotel Pickup', description: 'Driver arrives at your hotel lobby.' },
        { time: '09:30 AM', title: 'Activity Start', description: 'Guided experience begins.' },
        { time: '01:00 PM', title: 'Lunch & Drop-off', description: 'Return back to hotel.' }
      ],
      durationHours: Number(formData.durationHours),
      pickupAvailable: true,
      pickupLocations: 'Ubud, Canggu, Seminyak, Kuta, Sanur',
      meetingPoint: 'Hotel Lobby',
      priceOriginal: Number(formData.priceOriginal),
      priceDiscounted: Number(formData.priceDiscounted),
      rating: 5.0,
      reviewCount: 1,
      cancellationPolicy: 'Free cancellation up to 24 hours in advance',
      badge: formData.badge as any,
      travelerType: formData.travelerType,
      status: 'published',
      isFeatured: true,
      isTrending: true,
      images: [formData.imageUrl]
    };

    // Save to localStorage for instant persistence across pages
    try {
      const stored = localStorage.getItem('custom_activities');
      const existingCustom = stored ? JSON.parse(stored) : [];
      const updatedCustom = [newActivity, ...existingCustom];
      localStorage.setItem('custom_activities', JSON.stringify(updatedCustom));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }

    // Push to Supabase if connected
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('activities').insert([
          {
            title: newActivity.title,
            slug: newActivity.slug,
            location_name: newActivity.locationName,
            short_description: newActivity.shortDescription,
            full_description: newActivity.fullDescription,
            duration_hours: newActivity.durationHours,
            price_original: newActivity.priceOriginal,
            price_discounted: newActivity.priceDiscounted,
            badge: newActivity.badge,
            traveler_type: newActivity.travelerType,
            status: 'published'
          }
        ]);
      } catch (err) {
        console.error('Supabase error:', err);
      }
    }

    setActivitiesList([newActivity, ...activitiesList]);
    setSubmitting(false);
    setIsAddModalOpen(false);

    // Reset form
    setFormData({
      title: '',
      locationName: '',
      destinationSlug: 'ubud',
      categorySlug: 'adventure',
      shortDescription: '',
      fullDescription: '',
      highlights: 'Experienced local guide, Hotel pickup included, Sacred photos',
      durationHours: 6,
      priceOriginal: 50,
      priceDiscounted: 35,
      badge: 'Popular',
      travelerType: 'Adventure',
      imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80'
    });
  };

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
              Tour Catalog ({activitiesList.length})
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
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Manage Tour Inventory</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Listings actively published on the marketplace.</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
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
                    {activitiesList.map((act) => (
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
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 inline-block"
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

      {/* Add New Tour Experience Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-100">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider block">Admin Inventory</span>
                <h3 className="text-xl font-extrabold text-gray-900">Add New Tour Experience</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-4 text-xs font-medium text-gray-700">
              
              <div>
                <label className="font-bold text-gray-900 block mb-1">Tour Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Sacred Monkey Forest & Waterfall Private Tour"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 font-semibold text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-900 block mb-1">Location Name *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Ubud, Gianyar"
                    value={formData.locationName}
                    onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-900 block mb-1">Destination Region</label>
                  <select 
                    value={formData.destinationSlug}
                    onChange={(e) => setFormData({ ...formData, destinationSlug: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="ubud">Ubud</option>
                    <option value="nusa-penida">Nusa Penida</option>
                    <option value="uluwatu">Uluwatu</option>
                    <option value="mount-batur">Mount Batur</option>
                    <option value="canggu">Canggu & Seminyak</option>
                    <option value="nusa-lembongan">Nusa Lembongan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-gray-900 block mb-1">Category</label>
                  <select 
                    value={formData.categorySlug}
                    onChange={(e) => setFormData({ ...formData, categorySlug: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="adventure">Adventure</option>
                    <option value="water-sports">Water Sports</option>
                    <option value="culture">Culture</option>
                    <option value="day-trips">Day Trips</option>
                    <option value="wellness">Wellness</option>
                    <option value="food-culinary">Food & Cooking</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-900 block mb-1">Original Price ($)</label>
                  <input 
                    type="number"
                    value={formData.priceOriginal}
                    onChange={(e) => setFormData({ ...formData, priceOriginal: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-900 block mb-1">Discounted Price ($) *</label>
                  <input 
                    type="number"
                    required
                    value={formData.priceDiscounted}
                    onChange={(e) => setFormData({ ...formData, priceDiscounted: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 font-extrabold text-emerald-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-gray-900 block mb-1">Duration (Hours)</label>
                  <input 
                    type="number"
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-900 block mb-1">Badge Tag</label>
                  <select 
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="Bestseller">Bestseller</option>
                    <option value="Likely to Sell Out">Likely to Sell Out</option>
                    <option value="Top Rated">Top Rated</option>
                    <option value="Popular">Popular</option>
                    <option value="Special Deal">Special Deal</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-900 block mb-1">Traveler Vibe</label>
                  <select 
                    value={formData.travelerType}
                    onChange={(e) => setFormData({ ...formData, travelerType: e.target.value as any })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="Adventure">Adventure</option>
                    <option value="Couples">Couples</option>
                    <option value="Families">Families</option>
                    <option value="Culture">Culture</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-900 block mb-1">Cover Image URL *</label>
                <input 
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-900 block mb-1">Short Description *</label>
                <textarea 
                  rows={2}
                  required
                  placeholder="A short summary of the experience for search result cards..."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/20 transition-all cursor-pointer"
                >
                  {submitting ? 'Publishing...' : 'Publish Tour Experience'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
