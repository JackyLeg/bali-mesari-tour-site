'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, Compass, Sparkles, Star } from 'lucide-react';

export default function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [destination, setDestination] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (destination) params.set('destination', destination);
    router.push(`/activities?${params.toString()}`);
  };

  const popularSearches = [
    { label: 'Mount Batur Sunrise', destination: 'mount-batur' },
    { label: 'Nusa Penida Manta', destination: 'nusa-penida' },
    { label: 'Ubud Rice Terraces', destination: 'ubud' },
    { label: 'Uluwatu Kecak Dance', destination: 'uluwatu' },
    { label: 'ATV Quad Biking', query: 'ATV' },
  ];

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-emerald-950">
      
      {/* Hero Background Image with Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=2000&q=85')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/60 to-black/40" />

      {/* Hero Content Box */}
      <div className="relative z-10 max-w-4xl mx-auto text-center w-full">
        
        {/* Rating Badge Header */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-semibold mb-6 shadow-lg">
          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
          </div>
          <span>Over 15,000+ Happy Travelers in Bali</span>
        </div>

        {/* Main Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md mb-4">
          Discover Bali <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">Your Way</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-emerald-100/90 font-medium max-w-2xl mx-auto mb-10 drop-shadow">
          Handcrafted tours, volcano sunrise treks, crystal beach snorkeling, and private drivers booked directly with local Balinese experts.
        </p>

        {/* Search Bar Component */}
        <div className="bg-white rounded-3xl p-3 shadow-2xl border border-white/40 max-w-3xl mx-auto">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-2">
            
            {/* Search Input / Keywords */}
            <div className="md:col-span-6 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-500 transition-colors">
              <Search className="w-5 h-5 text-emerald-700 shrink-0" />
              <input
                type="text"
                placeholder="What do you want to do? (e.g. Rafting, Sunrise, Kecak)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-sm font-medium bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Destination Selection */}
            <div className="md:col-span-4 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-500 transition-colors">
              <MapPin className="w-5 h-5 text-amber-600 shrink-0" />
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full text-sm font-medium bg-transparent border-none outline-none text-gray-800 cursor-pointer"
              >
                <option value="">All Bali Locations</option>
                <option value="ubud">Ubud</option>
                <option value="nusa-penida">Nusa Penida</option>
                <option value="uluwatu">Uluwatu</option>
                <option value="mount-batur">Mount Batur</option>
                <option value="canggu">Canggu & Seminyak</option>
                <option value="nusa-lembongan">Nusa Lembongan</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full h-full min-h-[48px] bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>

          </form>
        </div>

        {/* Quick Search Tag Pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold text-emerald-200/80 mr-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Popular:
          </span>
          {popularSearches.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (item.destination) {
                  router.push(`/activities?destination=${item.destination}`);
                } else if (item.query) {
                  router.push(`/activities?query=${encodeURIComponent(item.query)}`);
                }
              }}
              className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all"
            >
              {item.label}
            </button>
          ))}
        </div>

      </div>

    </section>
  );
}
