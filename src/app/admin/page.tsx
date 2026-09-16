'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Upload,
  ImageIcon,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Booking {
  ref: string;
  name: string;
  email: string;
  title: string;
  date: string;
  guests: number;
  total: number;
  status: string;
  hotel?: string;
}

const MOCK_BOOKINGS: Booking[] = [
  { ref: 'BMT-849201', name: 'Sarah Jenkins', email: 'sarah@example.com', title: 'Mount Batur Sunrise Trekking', date: '2026-09-05', guests: 2, total: 70, status: 'Confirmed' },
  { ref: 'BMT-712390', name: 'Markus Weber', email: 'markus@example.com', title: 'Nusa Penida All-Inclusive Day Tour', date: '2026-09-06', guests: 4, total: 232, status: 'Confirmed' },
  { ref: 'BMT-509182', name: 'Elena Rostova', email: 'elena@example.com', title: 'Best of Ubud Private Day Tour', date: '2026-09-07', guests: 2, total: 84, status: 'Confirmed' },
  { ref: 'BMT-338210', name: 'David Miller', email: 'david@example.com', title: 'Ayung River Rafting & Bali Swing', date: '2026-09-08', guests: 3, total: 87, status: 'Completed' },
];

const EMPTY_FORM = {
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
};

const ACCEPTED_TYPES = 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif';
const MAX_IMAGES = 10;

// ─── Image Upload Component ───────────────────────────────────────────────────

interface ImageUploaderProps {
  images: string[]; // base64 data URLs
  onChange: (imgs: string[]) => void;
}

function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError('');
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    const toProcess = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      setError(`Only ${remaining} more image(s) allowed. Others were ignored.`);
    }

    toProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are accepted (jpg, png, webp, gif).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        onChange([...images, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {images.map((src, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
              <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-amber-400 text-emerald-950 px-1.5 py-0.5 rounded-md">Cover</span>
              )}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {/* Add more slot */}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-500 flex items-center justify-center text-gray-400 hover:text-emerald-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Drop Zone (shown when no images yet) */}
      {images.length === 0 && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-gray-700">Click or drag & drop images</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, GIF — up to {MAX_IMAGES} photos</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />{error}
        </p>
      )}

      {/* Counter */}
      <p className="text-[11px] text-gray-400 font-medium">{images.length} / {MAX_IMAGES} images uploaded</p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ─── Tour Form Modal ──────────────────────────────────────────────────────────

interface TourFormModalProps {
  mode: 'add' | 'edit';
  initial?: Activity | null;
  onClose: () => void;
  onSave: (activity: Activity) => void;
}

function TourFormModal({ mode, initial, onClose, onSave }: TourFormModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    locationName: initial?.locationName ?? '',
    destinationSlug: initial?.destinationSlug ?? 'ubud',
    categorySlug: initial?.categorySlug ?? 'adventure',
    shortDescription: initial?.shortDescription ?? '',
    fullDescription: initial?.fullDescription ?? '',
    highlights: (initial?.highlights ?? ['Experienced local guide', 'Hotel pickup included', 'Sacred photos']).join(', '),
    durationHours: initial?.durationHours ?? 6,
    priceOriginal: initial?.priceOriginal ?? 50,
    priceDiscounted: initial?.priceDiscounted ?? 35,
    badge: initial?.badge ?? 'Popular',
    travelerType: (initial?.travelerType ?? 'Adventure') as 'Adventure' | 'Couples' | 'Families' | 'Culture' | 'Luxury',
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      alert('Please upload at least one image.');
      return;
    }
    setSubmitting(true);

    const slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `tour-${Date.now()}`;

    const activity: Activity = {
      id: initial?.id ?? `act-${Date.now()}`,
      title: form.title,
      slug: initial?.slug ?? slug,
      locationName: form.locationName,
      destinationSlug: form.destinationSlug,
      categorySlug: form.categorySlug,
      shortDescription: form.shortDescription || form.title,
      fullDescription: form.fullDescription || form.shortDescription || form.title,
      highlights: form.highlights.split(',').map((s) => s.trim()).filter(Boolean),
      included: initial?.included ?? ['Hotel pickup and drop-off', 'English-speaking driver', 'Mineral water', 'Insurance'],
      notIncluded: initial?.notIncluded ?? ['Personal tips & souvenirs'],
      itinerary: initial?.itinerary ?? [
        { time: '08:00 AM', title: 'Hotel Pickup', description: 'Driver arrives at your hotel lobby.' },
        { time: '09:30 AM', title: 'Activity Start', description: 'Guided experience begins.' },
        { time: '01:00 PM', title: 'Lunch & Drop-off', description: 'Return back to hotel.' },
      ],
      durationHours: Number(form.durationHours),
      pickupAvailable: true,
      pickupLocations: 'Ubud, Canggu, Seminyak, Kuta, Sanur',
      meetingPoint: 'Hotel Lobby',
      priceOriginal: Number(form.priceOriginal),
      priceDiscounted: Number(form.priceDiscounted),
      rating: initial?.rating ?? 5.0,
      reviewCount: initial?.reviewCount ?? 1,
      cancellationPolicy: 'Free cancellation up to 24 hours in advance',
      badge: form.badge as any,
      travelerType: form.travelerType,
      status: 'published',
      isFeatured: true,
      isTrending: true,
      images,
    };

    onSave(activity);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-gray-100">

        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider block">Admin Inventory</span>
            <h3 className="text-xl font-extrabold text-gray-900">
              {mode === 'add' ? 'Add New Tour Experience' : 'Edit Tour Experience'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-gray-700">

          {/* Images */}
          <div>
            <label className="font-bold text-gray-900 block mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
              Tour Photos * <span className="font-normal text-gray-400">(up to 10 — first is cover)</span>
            </label>
            <ImageUploader images={images} onChange={setImages} />
          </div>

          {/* Title */}
          <div>
            <label className="font-bold text-gray-900 block mb-1">Tour Title *</label>
            <input
              type="text" required
              placeholder="e.g. Sacred Monkey Forest & Waterfall Private Tour"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 font-semibold text-gray-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-900 block mb-1">Location Name *</label>
              <input
                type="text" required
                placeholder="e.g. Ubud, Gianyar"
                value={form.locationName}
                onChange={(e) => set('locationName', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="font-bold text-gray-900 block mb-1">Destination Region</label>
              <select
                value={form.destinationSlug}
                onChange={(e) => set('destinationSlug', e.target.value)}
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
                value={form.categorySlug}
                onChange={(e) => set('categorySlug', e.target.value)}
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
                type="number" min={0}
                value={form.priceOriginal}
                onChange={(e) => set('priceOriginal', Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="font-bold text-gray-900 block mb-1">Discounted Price ($) *</label>
              <input
                type="number" min={0} required
                value={form.priceDiscounted}
                onChange={(e) => set('priceDiscounted', Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 font-extrabold text-emerald-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-gray-900 block mb-1">Duration (Hours)</label>
              <input
                type="number" min={1}
                value={form.durationHours}
                onChange={(e) => set('durationHours', Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="font-bold text-gray-900 block mb-1">Badge Tag</label>
              <select
                value={form.badge}
                onChange={(e) => set('badge', e.target.value)}
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
                value={form.travelerType}
                onChange={(e) => set('travelerType', e.target.value as any)}
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
            <label className="font-bold text-gray-900 block mb-1">Short Description *</label>
            <textarea
              rows={2} required
              placeholder="A short summary for search result cards..."
              value={form.shortDescription}
              onChange={(e) => set('shortDescription', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="font-bold text-gray-900 block mb-1">Highlights <span className="font-normal text-gray-400">(comma-separated)</span></label>
            <input
              type="text"
              placeholder="Experienced local guide, Hotel pickup included..."
              value={form.highlights}
              onChange={(e) => set('highlights', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Saving...' : mode === 'add' ? 'Publish Tour Experience' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ activity, onCancel, onConfirm }: { activity: Activity; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-extrabold text-gray-900 mb-1">Delete Tour?</h3>
        <p className="text-xs text-gray-500 mb-6">
          <span className="font-bold text-gray-800">"{activity.title}"</span> will be permanently removed from the catalog. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-xs font-extrabold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm"
          >
            Yes, Delete It
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'bookings'>('overview');
  const [activitiesList, setActivitiesList] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [deleteActivity, setDeleteActivity] = useState<Activity | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load activities (static + localStorage custom)
  useEffect(() => {
    async function load() {
      const list = await getActivities();
      setActivitiesList(list);
    }
    load();

    // Load real bookings from localStorage
    try {
      const stored = localStorage.getItem('bookings');
      if (stored) {
        const real: Booking[] = JSON.parse(stored);
        setBookings((prev) => {
          const existingRefs = new Set(prev.map((b) => b.ref));
          const newOnes = real.filter((b) => !existingRefs.has(b.ref));
          return [...newOnes, ...prev];
        });
      }
    } catch (_) {}
  }, []);

  // ── Persist custom activities to localStorage ──
  const saveCustomActivities = (list: Activity[]) => {
    // Only persist non-INITIAL ones
    const initialSlugs = new Set(INITIAL_ACTIVITIES.map((a) => a.slug));
    const custom = list.filter((a) => !initialSlugs.has(a.slug));
    try {
      localStorage.setItem('custom_activities', JSON.stringify(custom));
    } catch (_) {}
  };

  // ── CREATE ──
  const handleCreate = (activity: Activity) => {
    const updated = [activity, ...activitiesList.filter((a) => a.id !== activity.id)];
    setActivitiesList(updated);
    saveCustomActivities(updated);

    if (isSupabaseConfigured && supabase) {
      supabase.from('activities').insert([{
        title: activity.title, slug: activity.slug,
        location_name: activity.locationName,
        short_description: activity.shortDescription,
        full_description: activity.fullDescription,
        duration_hours: activity.durationHours,
        price_original: activity.priceOriginal,
        price_discounted: activity.priceDiscounted,
        badge: activity.badge, traveler_type: activity.travelerType,
        status: 'published',
      }]).then(() => {});
    }

    setAddModalOpen(false);
    showToast('Tour published successfully!');
  };

  // ── UPDATE ──
  const handleUpdate = (activity: Activity) => {
    const updated = activitiesList.map((a) => (a.id === activity.id ? activity : a));
    setActivitiesList(updated);
    saveCustomActivities(updated);
    setEditActivity(null);
    showToast('Tour updated successfully!');
  };

  // ── DELETE ──
  const handleDelete = () => {
    if (!deleteActivity) return;
    const updated = activitiesList.filter((a) => a.id !== deleteActivity.id);
    setActivitiesList(updated);
    saveCustomActivities(updated);
    setDeleteActivity(null);
    showToast('Tour deleted.', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-800 text-white' : 'bg-red-500 text-white'
        }`}>
          <CheckCircle2 className="w-4 h-4" />
          {toast.msg}
        </div>
      )}

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
            <div className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              isSupabaseConfigured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <Database className="w-4 h-4" />
              <span>{isSupabaseConfigured ? 'Supabase DB Connected' : 'Local Fallback Data Mode'}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 mb-8 pb-3">
            {(['overview', 'activities', 'bookings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === tab
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab === 'overview' && 'Overview & Analytics'}
                {tab === 'activities' && `Tour Catalog (${activitiesList.length})`}
                {tab === 'bookings' && `Bookings (${bookings.length})`}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: <DollarSign className="w-5 h-5" />, color: 'emerald', label: 'Total Revenue', value: '$14,280', sub: '↑ +18% from last month' },
                  { icon: <ShoppingBag className="w-5 h-5" />, color: 'amber', label: 'Total Bookings', value: bookings.length.toString(), sub: '98% completion rate' },
                  { icon: <Star className="w-5 h-5" />, color: 'blue', label: 'Average Rating', value: '4.9 / 5.0', sub: 'Based on 1,840+ reviews' },
                  { icon: <Users className="w-5 h-5" />, color: 'purple', label: 'Verified Local Drivers', value: '28 Operators', sub: 'Active across Bali' },
                ].map((c, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className={`w-10 h-10 rounded-2xl bg-${c.color}-50 text-${c.color}-600 flex items-center justify-center mb-3`}>
                      {c.icon}
                    </div>
                    <span className="text-xs font-bold text-gray-400 block uppercase">{c.label}</span>
                    <span className="text-2xl font-extrabold text-gray-900">{c.value}</span>
                    <span className="text-[11px] text-emerald-600 font-bold mt-1 block">{c.sub}</span>
                  </div>
                ))}
              </div>

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
                      {bookings.slice(0, 8).map((b) => (
                        <tr key={b.ref} className="hover:bg-gray-50">
                          <td className="py-3 font-mono font-bold text-emerald-800">{b.ref}</td>
                          <td className="py-3 font-bold text-gray-900">{b.name}</td>
                          <td className="py-3 max-w-[180px] truncate">{b.title}</td>
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

          {/* ── ACTIVITIES TAB ── */}
          {activeTab === 'activities' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Manage Tour Inventory</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Listings actively published on the marketplace.</p>
                </div>
                <button
                  onClick={() => setAddModalOpen(true)}
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
                      <th className="pb-3 w-8"></th>
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
                      <tr key={act.id} className="hover:bg-gray-50 group">
                        {/* Thumbnail */}
                        <td className="py-2 pr-2">
                          {act.images?.[0] ? (
                            <img
                              src={act.images[0]}
                              alt={act.title}
                              className="w-9 h-9 rounded-lg object-cover border border-gray-100"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                        </td>
                        <td className="py-2 font-bold text-gray-900 max-w-[180px] truncate">{act.title}</td>
                        <td className="py-2">{act.locationName}</td>
                        <td className="py-2 capitalize">{act.categorySlug}</td>
                        <td className="py-2 font-bold text-emerald-900">${act.priceDiscounted}</td>
                        <td className="py-2">★ {act.rating} ({act.reviewCount})</td>
                        <td className="py-2">
                          {act.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                              {act.badge}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View */}
                            <a
                              href={`/activities/${act.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View on site"
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                            {/* Edit */}
                            <button
                              onClick={() => setEditActivity(act)}
                              title="Edit tour"
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => setDeleteActivity(act)}
                              title="Delete tour"
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── BOOKINGS TAB ── */}
          {activeTab === 'bookings' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900">All Guest Reservations</h3>
                <span className="text-xs text-gray-400 font-semibold">{bookings.length} total</span>
              </div>
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.ref} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-mono font-bold text-emerald-800 text-xs">{b.ref}</span>
                      <h4 className="font-extrabold text-sm text-gray-900 mt-0.5">{b.name} — {b.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Date: {b.date} • Guests: {b.guests} • Total: ${b.total}
                        {b.hotel ? ` • Hotel: ${b.hotel}` : ''}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-800 text-white text-xs font-bold rounded-xl self-start sm:self-auto shrink-0">
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── MODALS ── */}
      {addModalOpen && (
        <TourFormModal
          mode="add"
          onClose={() => setAddModalOpen(false)}
          onSave={handleCreate}
        />
      )}
      {editActivity && (
        <TourFormModal
          mode="edit"
          initial={editActivity}
          onClose={() => setEditActivity(null)}
          onSave={handleUpdate}
        />
      )}
      {deleteActivity && (
        <DeleteConfirmModal
          activity={deleteActivity}
          onCancel={() => setDeleteActivity(null)}
          onConfirm={handleDelete}
        />
      )}

      <Footer />
    </div>
  );
}
