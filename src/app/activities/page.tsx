'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ActivityCard from '@/components/common/ActivityCard';
import { Activity, Category, Destination } from '@/types';
import { INITIAL_ACTIVITIES, INITIAL_CATEGORIES, INITIAL_DESTINATIONS, getActivities } from '@/lib/data';
import {
  Search,
  Filter,
  X,
  MapPin,
  Star,
  SlidersHorizontal,
  Compass,
  DollarSign,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';

// ─── Shared Filter Panel (used by both desktop sidebar and mobile drawer) ─────

interface FilterPanelProps {
  selectedDestination: string;
  setSelectedDestination: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  selectedTravelerType: string;
  setSelectedTravelerType: (v: string) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  clearAllFilters: () => void;
}

function FilterPanel({
  selectedDestination, setSelectedDestination,
  selectedCategory, setSelectedCategory,
  selectedTravelerType, setSelectedTravelerType,
  maxPrice, setMaxPrice,
  minRating, setMinRating,
  clearAllFilters,
}: FilterPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
          <span>Filters</span>
        </h3>
        <button
          onClick={clearAllFilters}
          className="text-xs font-bold text-amber-600 hover:text-amber-700 underline"
        >
          Reset All
        </button>
      </div>

      {/* Destination */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
          Destination
        </label>
        <select
          value={selectedDestination}
          onChange={(e) => setSelectedDestination(e.target.value)}
          className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 outline-none cursor-pointer hover:border-emerald-500"
        >
          <option value="">All Bali Locations</option>
          {INITIAL_DESTINATIONS.map((d) => (
            <option key={d.id} value={d.slug}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
          Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 outline-none cursor-pointer hover:border-emerald-500"
        >
          <option value="">All Categories</option>
          {INITIAL_CATEGORIES.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Traveler Type */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
          Traveler Vibe
        </label>
        <div className="flex flex-wrap gap-1.5">
          {['Couples', 'Families', 'Adventure', 'Culture', 'Luxury'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedTravelerType(selectedTravelerType === type ? '' : type)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                selectedTravelerType === type
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Max Price */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="uppercase tracking-wider text-gray-400">Max Price</span>
          <span className="text-emerald-800 font-extrabold">
            {maxPrice >= 120 ? 'Any price' : `$${maxPrice} / person`}
          </span>
        </div>
        <input
          type="range"
          min="20"
          max="120"
          step="5"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-emerald-700 cursor-pointer"
        />
      </div>

      {/* Min Rating */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
          Minimum Rating
        </label>
        <div className="flex items-center gap-2">
          {[0, 4.5, 4.8, 4.9].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                minRating === r
                  ? 'bg-amber-400 text-emerald-950 border-amber-400 shadow-sm'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {r === 0 ? 'Any' : `${r}+ ★`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Search/Filter Content ───────────────────────────────────────────────

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [selectedDestination, setSelectedDestination] = useState(searchParams.get('destination') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedTravelerType, setSelectedTravelerType] = useState(searchParams.get('travelerType') || '');
  const [selectedBadge, setSelectedBadge] = useState(searchParams.get('badge') || '');
  const [maxPrice, setMaxPrice] = useState<number>(120);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'recommended' | 'popular' | 'rating' | 'price-low' | 'price-high'>('recommended');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [filteredActivities, setFilteredActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);

  useEffect(() => {
    async function fetchActivities() {
      let list = await getActivities();

      if (query.trim()) {
        const q = query.toLowerCase();
        list = list.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.locationName.toLowerCase().includes(q) ||
            a.shortDescription.toLowerCase().includes(q)
        );
      }
      if (selectedDestination) list = list.filter((a) => a.destinationSlug === selectedDestination);
      if (selectedCategory) list = list.filter((a) => a.categorySlug === selectedCategory);
      if (selectedTravelerType) list = list.filter((a) => a.travelerType === selectedTravelerType);
      if (selectedBadge) list = list.filter((a) => a.badge === selectedBadge);
      if (maxPrice < 120) list = list.filter((a) => a.priceDiscounted <= maxPrice);
      if (minRating > 0) list = list.filter((a) => a.rating >= minRating);

      if (sortBy === 'price-low') list.sort((a, b) => a.priceDiscounted - b.priceDiscounted);
      else if (sortBy === 'price-high') list.sort((a, b) => b.priceDiscounted - a.priceDiscounted);
      else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
      else if (sortBy === 'popular') list.sort((a, b) => b.reviewCount - a.reviewCount);

      setFilteredActivities(list);
    }
    fetchActivities();
  }, [query, selectedDestination, selectedCategory, selectedTravelerType, selectedBadge, maxPrice, minRating, sortBy]);

  const clearAllFilters = () => {
    setQuery('');
    setSelectedDestination('');
    setSelectedCategory('');
    setSelectedTravelerType('');
    setSelectedBadge('');
    setMaxPrice(120);
    setMinRating(0);
    setSortBy('recommended');
    setMobileFiltersOpen(false);
    router.push('/activities');
  };

  const activeFilterCount = [
    selectedDestination, selectedCategory, selectedTravelerType, selectedBadge,
    maxPrice < 120 ? '1' : '', minRating > 0 ? '1' : '',
  ].filter(Boolean).length;

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50">

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] bg-white shadow-2xl flex flex-col lg:hidden animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-extrabold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                Filter Tours
              </h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-5">
              <FilterPanel
                selectedDestination={selectedDestination}
                setSelectedDestination={setSelectedDestination}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedTravelerType={selectedTravelerType}
                setSelectedTravelerType={setSelectedTravelerType}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                minRating={minRating}
                setMinRating={setMinRating}
                clearAllFilters={clearAllFilters}
              />
            </div>
            <div className="p-5 border-t border-gray-100">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow hover:bg-emerald-700 transition-colors"
              >
                Show {filteredActivities.length} Experiences
              </button>
            </div>
          </div>
        </>
      )}

      {/* Top Banner */}
      <div className="bg-emerald-950 text-white py-10 px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
            <Compass className="w-4 h-4" />
            <span>Marketplace Inventory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Bali Tours & Experiences
          </h1>
          <p className="text-emerald-200/80 text-sm mt-1 max-w-xl">
            Compare prices, check availability, read verified traveler reviews, and book directly with local Balinese experts.
          </p>

          {/* Search Bar */}
          <div className="mt-6 max-w-2xl bg-white rounded-2xl p-2 shadow-lg border border-white/20 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
            <input
              type="text"
              placeholder="Search by tour name, activity, or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none py-2"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Sort / Results bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            {/* Mobile filter trigger */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 text-xs font-bold bg-emerald-800 text-white px-3.5 py-2 rounded-xl relative"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-emerald-950 text-[9px] font-extrabold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <span className="text-sm font-bold text-gray-900">
              Showing <span className="text-emerald-800">{filteredActivities.length}</span> experiences
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 outline-none cursor-pointer hover:border-emerald-500"
            >
              <option value="recommended">Recommended</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <FilterPanel
                selectedDestination={selectedDestination}
                setSelectedDestination={setSelectedDestination}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedTravelerType={selectedTravelerType}
                setSelectedTravelerType={setSelectedTravelerType}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                minRating={minRating}
                setMinRating={setMinRating}
                clearAllFilters={clearAllFilters}
              />
            </div>
          </aside>

          {/* Activity Grid */}
          <main className="lg:col-span-9">
            {filteredActivities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActivities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm my-6">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No Experiences Found</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
                  We couldn't find any tours matching your filter criteria. Try clearing some filters or searching for another keyword.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 bg-emerald-800 text-white font-bold text-xs rounded-xl shadow hover:bg-emerald-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}

export default function ActivitiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<div className="p-20 text-center text-sm font-bold text-gray-400">Loading experiences...</div>}>
          <SearchContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
