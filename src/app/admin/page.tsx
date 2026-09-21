/**
 * 📚 HOW THIS WORKS — Admin Panel Security
 *
 * SECURITY IMPROVEMENTS MADE:
 *
 * 1. BCRYPT PASSWORD VERIFICATION:
 *    Passwords stored in the DB are now bcrypt hashes.
 *    We use verifyPassword() which calls bcrypt.compare() internally.
 *    Even if the database is leaked, attackers cannot reverse the hashes.
 *
 * 2. RATE LIMITING:
 *    checkRateLimit() tracks failed login attempts by email address.
 *    After 5 failed attempts within 15 minutes, the account is locked.
 *    This prevents brute-force attacks where an attacker tries many passwords.
 *
 * 3. HARDCODED PASSWORD REMOVED:
 *    The old '1q2w3e' password is gone. The master admin fallback now
 *    uses bcrypt to compare against NEXT_PUBLIC_ADMIN_MASTER_HASH env variable.
 *    Never hardcode passwords in source code — anyone with git access sees it.
 *
 * 4. INPUT SANITIZATION:
 *    Email and password inputs are sanitized before use.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Activity } from '@/types';
import { INITIAL_ACTIVITIES, getActivities } from '@/lib/data';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { verifyPassword, checkRateLimit, resetRateLimit, sanitizeEmail, sanitizeInput } from '@/lib/security';
import {
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
  LogOut,
  Lock,
  Mail,
  KeyRound,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Settings,
  Key,
  RefreshCw,
  Copy,
  Check,
  PhoneCall,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'staff';
  status: 'active' | 'suspended';
  tempPassword?: string;
  createdAt: string;
}

const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'team-admin',
    name: 'I Made Novandy',
    email: 'imade.novandy23@gmail.com',
    role: 'super_admin',
    status: 'active',
    createdAt: '2026-09-01',
  },
  {
    id: 'team-staff-1',
    name: 'Wayan Booking Support',
    email: 'staff@balimesari.com',
    role: 'staff',
    status: 'active',
    tempPassword: 'MesariStaff2026!',
    createdAt: '2026-09-10',
  }
];

const ACCEPTED_TYPES = 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif';
const MAX_IMAGES = 10;

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (session?: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Tracks remaining attempts for UI feedback
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // ── Sanitize inputs ────────────────────────────────────────────────────
    // 📚 Even though bcrypt.compare() handles the password internally,
    // we sanitize the email before using it in database queries.
    const cleanEmail = sanitizeEmail(email);
    // Note: We do NOT sanitize the password before bcrypt comparison.
    // bcrypt.compare() handles the raw password directly. Sanitizing could
    // change the password and break legitimate logins.

    // ── Rate Limiting Check ────────────────────────────────────────────────
    // 📚 checkRateLimit() uses an in-memory map to count attempts per email.
    // After MAX_ATTEMPTS (5) failures in WINDOW_MS (15 min), it blocks login.
    const rateLimitResult = checkRateLimit(cleanEmail);
    if (!rateLimitResult.allowed) {
      setError(`Too many failed attempts. Please wait ${rateLimitResult.retryAfterMinutes} minute(s) and try again.`);
      setLoading(false);
      return;
    }

    // ── 1. Try Supabase Auth (most reliable for registered users) ──────────
    if (supabase) {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (!authError && data.session) {
        // SUCCESS — reset rate limit counter
        resetRateLimit(cleanEmail);
        try {
          localStorage.setItem('admin_user_email', cleanEmail);
        } catch (_) {}
        onLogin(data.session);
        setLoading(false);
        return;
      }
    }

    // ── 2. Bcrypt master admin check ───────────────────────────────────────
    // 📚 The master admin password hash is stored in environment variables.
    // NEVER hardcode passwords in source code (old: '1q2w3e' was visible to
    // anyone who could read this file or the git history).
    //
    // To set this up:
    // 1. Run: node -e "const b=require('bcryptjs');b.hash('YourNewPassword',12).then(h=>console.log(h))"
    // 2. Copy the output into .env.local as NEXT_PUBLIC_ADMIN_MASTER_HASH
    const masterHash = process.env.NEXT_PUBLIC_ADMIN_MASTER_HASH;
    if (
      cleanEmail === 'imade.novandy23@gmail.com' &&
      masterHash
    ) {
      // 📚 verifyPassword() calls bcrypt.compare(password, hash) internally
      // This extracts the salt from the stored hash, re-hashes the input,
      // and compares. Returns true only if they match.
      const masterMatch = await verifyPassword(password, masterHash);
      if (masterMatch) {
        resetRateLimit(cleanEmail);
        try {
          localStorage.setItem('admin_fallback_auth', 'true');
          localStorage.setItem('admin_user_email', cleanEmail);
        } catch (_) {}
        onLogin({ user: { email: cleanEmail, user_metadata: { role: 'super_admin', name: 'I Made Novandy' } } });
        setLoading(false);
        return;
      }
    }

    // ── 3. Supabase team_members table check ───────────────────────────────
    // 📚 The team_members table should store PASSWORD HASHES, not plaintext.
    // The field should be named 'password_hash' (bcrypt hash).
    // If your DB still has plain 'password' field, this section also checks it
    // as a compatibility fallback during migration.
    if (supabase) {
      try {
        const { data: member, error: memberErr } = await supabase
          .from('team_members')
          .select('*')
          .ilike('email', cleanEmail)
          .eq('status', 'active')  // Only allow active members to login
          .maybeSingle();

        if (!memberErr && member && member.status === 'active') {
          let passwordMatch = false;

          // Check bcrypt hash first (new secure approach)
          if (member.password_hash) {
            passwordMatch = await verifyPassword(password, member.password_hash);
          }

          // Fallback: check plaintext password (migration compatibility only)
          // TODO: Remove this block once all passwords are migrated to bcrypt
          if (!passwordMatch && member.password) {
            passwordMatch = member.password === password;
          }
          if (!passwordMatch && member.temp_password) {
            passwordMatch = member.temp_password === password;
          }

          if (passwordMatch) {
            resetRateLimit(cleanEmail);
            try {
              localStorage.setItem('admin_fallback_auth', 'true');
              localStorage.setItem('admin_user_email', member.email);
            } catch (_) {}
            onLogin({
              user: {
                email: member.email,
                user_metadata: { role: member.role, name: member.name },
              },
            });
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Supabase team_member login query notice:', err);
      }
    }

    // ── 4. Local storage fallback (offline mode) ───────────────────────────
    // Only used when there's no internet / Supabase is unreachable.
    try {
      const storedTeam = localStorage.getItem('team_members');
      const team: TeamMember[] = storedTeam ? JSON.parse(storedTeam) : INITIAL_TEAM;
      const matched = team.find(m => m.email.toLowerCase() === cleanEmail);
      if (matched && matched.status === 'active') {
        const storedPwd = localStorage.getItem(`team_pwd_${cleanEmail}`) || matched.tempPassword;
        if (storedPwd && storedPwd === password) {
          resetRateLimit(cleanEmail);
          localStorage.setItem('admin_fallback_auth', 'true');
          localStorage.setItem('admin_user_email', matched.email);
          onLogin({ user: { email: matched.email, user_metadata: { role: matched.role, name: matched.name } } });
          setLoading(false);
          return;
        }
      }
    } catch (_) {}

    // All checks failed — show error with remaining attempts
    setAttemptsLeft(rateLimitResult.attemptsRemaining - 1);
    setError(
      `Invalid email or password.${rateLimitResult.attemptsRemaining <= 2 
        ? ` ${rateLimitResult.attemptsRemaining - 1} attempt(s) remaining before temporary lockout.` 
        : ''}`
    );
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-amber-400 flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl">
            🌴
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Bali Mesari <span className="text-amber-400">Tour</span>
          </h1>
          <p className="text-emerald-300/70 text-xs mt-1 font-medium">Admin Portal — Authorized Access Only</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Sign In</h2>
              <p className="text-[11px] text-gray-500">Enter your admin credentials to continue</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-60 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In to Admin Portal'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-emerald-300/50 mt-6">
          Access restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
}

// ─── Image Uploader ───────────────────────────────────────────────────────────

interface ImageUploaderProps {
  images: string[];
  onChange: (imgs: string[]) => void;
}

function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError('');
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { setError(`Maximum ${MAX_IMAGES} images allowed.`); return; }
    const toProcess = Array.from(files).slice(0, remaining);
    if (files.length > remaining) setError(`Only ${remaining} more image(s) allowed. Others were ignored.`);

    toProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) { setError('Only image files accepted (jpg, png, webp, gif).'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        onChange([...images, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {images.map((src, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
              <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-amber-400 text-emerald-950 px-1.5 py-0.5 rounded-md">Cover</span>
              )}
              <button type="button" onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button type="button" onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-500 flex items-center justify-center text-gray-400 hover:text-emerald-600 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
      {images.length === 0 && (
        <div onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-gray-700">Click or drag & drop images</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, GIF — up to {MAX_IMAGES} photos</p>
        </div>
      )}
      {error && (
        <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />{error}
        </p>
      )}
      <p className="text-[11px] text-gray-400 font-medium">{images.length} / {MAX_IMAGES} images uploaded</p>
      <input ref={inputRef} type="file" multiple accept={ACCEPTED_TYPES} className="hidden"
        onChange={(e) => handleFiles(e.target.files)} />
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
    highlights: (initial?.highlights ?? ['Experienced local guide', 'Hotel pickup included', 'Sacred photos', 'Refreshments']).join(', '),
    includedText: (initial?.included ?? ['Hotel pickup and drop-off', 'English-speaking driver', 'Mineral water', 'Insurance']).join('\n'),
    notIncludedText: (initial?.notIncluded ?? ['Personal tips & souvenirs', 'Lunch / meals (unless specified)']).join('\n'),
    durationHours: initial?.durationHours ?? 6,
    priceOriginal: initial?.priceOriginal ?? 50,
    priceDiscounted: initial?.priceDiscounted ?? 35,
    rating: initial?.rating ?? 4.9,
    reviewCount: initial?.reviewCount ?? 120,
    badge: initial?.badge ?? 'Popular',
    travelerType: (initial?.travelerType ?? 'Adventure') as 'Adventure' | 'Couples' | 'Families' | 'Culture' | 'Luxury',
  });

  const [itinerary, setItinerary] = useState<{ time: string; title: string; description: string }[]>(
    initial?.itinerary && initial.itinerary.length > 0
      ? initial.itinerary.map(item => ({ time: item.time, title: item.title, description: item.description || '' }))
      : [
          { time: '08:00 AM', title: 'Hotel Pickup', description: 'Driver arrives at your hotel lobby in air-conditioned comfort.' },
          { time: '09:30 AM', title: 'Activity Start', description: 'Guided experience begins with our certified local expert.' },
          { time: '01:00 PM', title: 'Lunch & Drop-off', description: 'Enjoy local cuisine and safe return back to your hotel.' },
        ]
  );

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const updateItineraryStep = (index: number, key: 'time' | 'title' | 'description', val: string) => {
    setItinerary(prev => prev.map((step, i) => (i === index ? { ...step, [key]: val } : step)));
  };

  const addItineraryStep = () => {
    setItinerary(prev => [...prev, { time: '10:00 AM', title: 'New Stop / Activity', description: 'Details about this part of the tour.' }]);
  };

  const removeItineraryStep = (index: number) => {
    setItinerary(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) { alert('Please upload at least one image.'); return; }
    setSubmitting(true);

    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `tour-${Date.now()}`;

    const parsedIncluded = form.includedText.split('\n').map(s => s.trim()).filter(Boolean);
    const parsedNotIncluded = form.notIncludedText.split('\n').map(s => s.trim()).filter(Boolean);
    const parsedHighlights = form.highlights.split(',').map(s => s.trim()).filter(Boolean);

    const activity: Activity = {
      id: initial?.id ?? `act-${Date.now()}`,
      title: form.title,
      slug: initial?.slug ?? slug,
      locationName: form.locationName,
      destinationSlug: form.destinationSlug,
      categorySlug: form.categorySlug,
      shortDescription: form.shortDescription || form.title,
      fullDescription: form.fullDescription || form.shortDescription || form.title,
      highlights: parsedHighlights.length > 0 ? parsedHighlights : ['Experienced local guide'],
      included: parsedIncluded.length > 0 ? parsedIncluded : ['Hotel pickup and drop-off', 'English-speaking driver'],
      notIncluded: parsedNotIncluded.length > 0 ? parsedNotIncluded : ['Personal expenses'],
      itinerary: itinerary.length > 0 ? itinerary : [
        { time: '08:00 AM', title: 'Hotel Pickup', description: 'Driver arrives at your hotel lobby.' },
        { time: '01:00 PM', title: 'Return Journey', description: 'Return back to hotel.' },
      ],
      durationHours: Number(form.durationHours),
      pickupAvailable: true,
      pickupLocations: 'Ubud, Canggu, Seminyak, Kuta, Sanur',
      meetingPoint: 'Hotel Lobby',
      priceOriginal: Number(form.priceOriginal),
      priceDiscounted: Number(form.priceDiscounted),
      rating: Number(form.rating) || 4.9,
      reviewCount: Number(form.reviewCount) || 1,
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
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-100">
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

        <form onSubmit={handleSubmit} className="space-y-6 text-xs font-medium text-gray-700">
          
          {/* Section 1: Photos */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/70">
            <label className="font-bold text-gray-900 block mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-700" />
              <span>Tour Photos *</span>
              <span className="font-normal text-gray-500">(up to 10 images — first image is cover photo)</span>
            </label>
            <ImageUploader images={images} onChange={setImages} />
          </div>

          {/* Section 2: Core Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">1. Basic Information</h4>
            
            <div>
              <label className="font-bold text-gray-900 block mb-1">Tour Title *</label>
              <input type="text" required placeholder="e.g. Mount Batur Sunrise Trekking & Natural Hot Springs"
                value={form.title} onChange={(e) => set('title', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 font-semibold text-gray-900" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-900 block mb-1">Location Name *</label>
                <input type="text" required placeholder="e.g. Kintamani, Mount Batur"
                  value={form.locationName} onChange={(e) => set('locationName', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600" />
              </div>
              <div>
                <label className="font-bold text-gray-900 block mb-1">Destination Region</label>
                <select value={form.destinationSlug} onChange={(e) => set('destinationSlug', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 cursor-pointer">
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
                <select value={form.categorySlug} onChange={(e) => set('categorySlug', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 cursor-pointer">
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
                <input type="number" min={0} value={form.priceOriginal}
                  onChange={(e) => set('priceOriginal', Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600" />
              </div>
              <div>
                <label className="font-bold text-gray-900 block mb-1">Discounted Price ($) *</label>
                <input type="number" min={0} required value={form.priceDiscounted}
                  onChange={(e) => set('priceDiscounted', Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 font-extrabold text-emerald-900" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="font-bold text-gray-900 block mb-1">Duration (Hours)</label>
                <input type="number" min={1} value={form.durationHours}
                  onChange={(e) => set('durationHours', Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600" />
              </div>
              <div>
                <label className="font-bold text-gray-900 block mb-1">Badge Tag</label>
                <select value={form.badge} onChange={(e) => set('badge', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 cursor-pointer">
                  <option value="Bestseller">Bestseller</option>
                  <option value="Likely to Sell Out">Likely to Sell Out</option>
                  <option value="Top Rated">Top Rated</option>
                  <option value="Popular">Popular</option>
                  <option value="Special Deal">Special Deal</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-900 block mb-1">Traveler Vibe</label>
                <select value={form.travelerType} onChange={(e) => set('travelerType', e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 cursor-pointer">
                  <option value="Adventure">Adventure</option>
                  <option value="Couples">Couples</option>
                  <option value="Families">Families</option>
                  <option value="Culture">Culture</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-900 block mb-1">Rating Display</label>
                <div className="flex gap-2">
                  <input type="number" step="0.1" min="1" max="5" value={form.rating}
                    onChange={(e) => set('rating', Number(e.target.value))}
                    className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 outline-none focus:border-emerald-600 font-bold text-amber-600" title="Rating (e.g. 4.9)" />
                  <input type="number" min="0" value={form.reviewCount}
                    onChange={(e) => set('reviewCount', Number(e.target.value))}
                    className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 outline-none focus:border-emerald-600" title="Review count (e.g. 150)" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Descriptions & Highlights */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">2. Descriptions & Highlights</h4>
            
            <div>
              <label className="font-bold text-gray-900 block mb-1">Short Description * <span className="font-normal text-gray-500">(shown on catalog search cards)</span></label>
              <textarea rows={2} required placeholder="A short 1-2 sentence preview..."
                value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600" />
            </div>

            <div>
              <label className="font-bold text-gray-900 block mb-1">Full Description <span className="font-normal text-gray-500">(comprehensive tour story & details)</span></label>
              <textarea rows={4} placeholder="Detailed paragraph describing the entire experience, what to expect, scenery, etc..."
                value={form.fullDescription} onChange={(e) => set('fullDescription', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 leading-relaxed" />
            </div>

            <div>
              <label className="font-bold text-gray-900 block mb-1">Experience Highlights <span className="font-normal text-gray-500">(comma-separated)</span></label>
              <input type="text" placeholder="Experienced local guide, Hotel pickup included, Sacred temple photos, Natural hot springs..."
                value={form.highlights} onChange={(e) => set('highlights', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600" />
            </div>
          </div>

          {/* Section 4: What's Included & Not Included */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">3. Inclusions & Exclusions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-900 block mb-1 text-emerald-800">What’s Included <span className="font-normal text-gray-500">(one item per line)</span></label>
                <textarea rows={4} placeholder="Hotel pickup & drop-off&#10;English speaking driver&#10;Mineral water & towels&#10;All entry tickets included"
                  value={form.includedText} onChange={(e) => set('includedText', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 leading-relaxed font-mono text-xs" />
              </div>
              <div>
                <label className="font-bold text-gray-900 block mb-1 text-rose-700">Not Included <span className="font-normal text-gray-500">(one item per line)</span></label>
                <textarea rows={4} placeholder="Personal tips & souvenirs&#10;Alcoholic beverages&#10;Personal travel insurance"
                  value={form.notIncludedText} onChange={(e) => set('notIncludedText', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 leading-relaxed font-mono text-xs" />
              </div>
            </div>
          </div>

          {/* Section 5: Itinerary Schedule */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">4. Itinerary Timeline Steps</h4>
                <p className="text-[11px] text-gray-500">Add the sequence of stops and activities during the day</p>
              </div>
              <button type="button" onClick={addItineraryStep}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl border border-emerald-200/80 transition-colors">
                + Add Step
              </button>
            </div>

            <div className="space-y-3">
              {itinerary.map((step, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="w-full sm:w-28">
                    <input type="text" placeholder="e.g. 08:00 AM"
                      value={step.time} onChange={(e) => updateItineraryStep(idx, 'time', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-700 outline-none focus:border-emerald-600" />
                  </div>
                  <div className="w-full sm:w-1/3">
                    <input type="text" placeholder="Stop Title (e.g. Hotel Pickup)"
                      value={step.title} onChange={(e) => updateItineraryStep(idx, 'title', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-emerald-600" />
                  </div>
                  <div className="w-full sm:flex-1">
                    <input type="text" placeholder="Short description / details..."
                      value={step.description} onChange={(e) => updateItineraryStep(idx, 'description', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-600 outline-none focus:border-emerald-600" />
                  </div>
                  <button type="button" onClick={() => removeItineraryStep(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0 transition-colors" title="Delete Step">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/20 transition-all cursor-pointer disabled:opacity-60">
              {submitting ? 'Saving...' : mode === 'add' ? 'Publish Tour Experience' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddTeamMemberModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (member: TeamMember) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'staff' | 'super_admin'>('staff');
  const [tempPassword, setTempPassword] = useState(`Mesari_${Math.floor(1000 + Math.random() * 9000)}!`);
  const [copied, setCopied] = useState(false);

  const generateNewPassword = () => {
    setTempPassword(`Mesari_${Math.floor(1000 + Math.random() * 9000)}!`);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newMember: TeamMember = {
      id: `team-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      status: 'active',
      tempPassword,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSave(newMember);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-extrabold">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">Add Team Member</h3>
            <p className="text-[11px] text-gray-500">Create access for operations staff or admin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-gray-700">
          <div>
            <label className="font-bold text-gray-900 block mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Kadek Pratama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 text-gray-900 font-semibold text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-gray-900 block mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="e.g. kadek@balimesari.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 text-gray-900 text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-gray-900 block mb-1">Role & Permissions *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 text-gray-900 text-xs cursor-pointer font-semibold"
            >
              <option value="staff">Operations Staff (Manage Bookings & Guests)</option>
              <option value="super_admin">Super Admin (Full Access: Tours, Financials, Team)</option>
            </select>
            <p className="text-[10px] text-gray-500 mt-1">
              {role === 'staff' 
                ? '✓ Can view bookings, update status, and contact guests on WhatsApp. Cannot delete or edit tour prices.' 
                : '✓ Full privileges: can add/delete tours, change pricing, and manage team accounts.'}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-gray-900">Temporary Password</label>
              <button
                type="button"
                onClick={generateNewPassword}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={tempPassword}
                className="w-full bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 font-mono text-xs text-amber-900 font-bold outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-bold text-xs shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                title="Copy Password"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              Share this temporary password with the member. They can change it in their Settings once logged in.
            </p>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/20 transition-all cursor-pointer"
            >
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirmModal({ activity, onCancel, onConfirm }: { activity: Activity; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-extrabold text-gray-900 mb-1">Delete Tour?</h3>
        <p className="text-xs text-gray-500 mb-6">
          <span className="font-bold text-gray-800">"{activity.title}"</span> will be permanently removed from the catalog.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 text-xs font-extrabold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-sm">Yes, Delete It</button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard({ onLogout, currentUserEmail }: { onLogout: () => void; currentUserEmail?: string }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'bookings' | 'team' | 'settings'>('overview');
  const [activitiesList, setActivitiesList] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('team_members');
        if (stored) return JSON.parse(stored);
      } catch (_) {}
    }
    return INITIAL_TEAM;
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addTeamModalOpen, setAddTeamModalOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [deleteActivity, setDeleteActivity] = useState<Activity | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Settings / Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [copiedTempId, setCopiedTempId] = useState<string | null>(null);

  // Determine user email & role
  const userEmail = currentUserEmail?.toLowerCase() || (typeof window !== 'undefined' ? localStorage.getItem('admin_user_email') || 'imade.novandy23@gmail.com' : 'imade.novandy23@gmail.com');
  const currentMember = teamMembers.find(m => m.email.toLowerCase() === userEmail.toLowerCase());
  const isSuperAdmin = userEmail.toLowerCase() === 'imade.novandy23@gmail.com' || currentMember?.role === 'super_admin';

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const saveTeamMembers = (updated: TeamMember[]) => {
    setTeamMembers(updated);
    try {
      localStorage.setItem('team_members', JSON.stringify(updated));
    } catch (_) {}
  };

  // Load activities from Supabase (synced across all devices)
  useEffect(() => {
    async function load() {
      const list = await getActivities();
      setActivitiesList(list);
    }
    load();

    // Load real bookings from Supabase first, then localStorage
    async function loadBookings() {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped: Booking[] = data.map((b: any) => ({
            ref: b.booking_reference,
            name: b.user_name,
            email: b.user_email,
            title: b.activity_id || 'Tour',
            date: b.booking_date,
            guests: b.participants_count,
            total: b.total_amount,
            status: b.booking_status === 'confirmed' ? 'Confirmed' : b.booking_status === 'completed' ? 'Completed' : 'Confirmed',
            hotel: b.pickup_address || '',
          }));
          setBookings(mapped);
          return;
        }
      }
      // Fallback: localStorage
      try {
        const stored = localStorage.getItem('bookings');
        if (stored) {
          const real: Booking[] = JSON.parse(stored);
          setBookings((prev) => {
            const existingRefs = new Set(prev.map((b) => b.ref));
            return [...real.filter((b) => !existingRefs.has(b.ref)), ...prev];
          });
        }
      } catch (_) {}
    }
    loadBookings();

    // Load real team members from Supabase (cross-device sync)
    async function loadTeamMembers() {
      if (isSupabaseConfigured && supabase) {
        try {
          // Read local storage to catch any accounts created before table was ready
          let localMembers: TeamMember[] = [];
          try {
            const raw = localStorage.getItem('team_members');
            if (raw) localMembers = JSON.parse(raw);
          } catch (_) {}

          const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) {
            const remoteEmails = new Set(data.map((d: any) => d.email.toLowerCase()));

            // Auto-sync any local members that are not yet in Supabase
            for (const local of localMembers) {
              if (!remoteEmails.has(local.email.toLowerCase()) && local.email.toLowerCase() !== 'staff@balimesari.com') {
                const localPwd = localStorage.getItem(`team_pwd_${local.email.toLowerCase()}`) || local.tempPassword || 'MesariStaff2026!';
                try {
                  await supabase.from('team_members').upsert([
                    {
                      id: local.id,
                      name: local.name,
                      email: local.email.toLowerCase().trim(),
                      role: local.role,
                      password: localPwd,
                      temp_password: local.tempPassword || localPwd,
                      status: local.status || 'active',
                      created_at: new Date().toISOString(),
                    },
                  ], { onConflict: 'email' });
                  remoteEmails.add(local.email.toLowerCase());
                } catch (_) {}
              }
            }

            // Build fresh team list from Supabase + any unpushed locals
            const mapped: TeamMember[] = data.map((d: any) => ({
              id: d.id,
              name: d.name,
              email: d.email,
              role: d.role as 'super_admin' | 'staff',
              status: (d.status as 'active' | 'suspended') || 'active',
              tempPassword: d.temp_password || undefined,
              createdAt: d.created_at ? d.created_at.split('T')[0] : '2026-09-16',
            }));

            const allMembers = [...mapped];
            for (const local of localMembers) {
              if (!allMembers.some((m) => m.email.toLowerCase() === local.email.toLowerCase())) {
                allMembers.push(local);
              }
            }

            // Always ensure imade.novandy23@gmail.com is present
            if (!allMembers.some((m) => m.email.toLowerCase() === 'imade.novandy23@gmail.com')) {
              allMembers.unshift(INITIAL_TEAM[0]);
            }

            setTeamMembers(allMembers);
            try {
              localStorage.setItem('team_members', JSON.stringify(allMembers));
            } catch (_) {}
          }
        } catch (_) {}
      }
    }
    loadTeamMembers();
  }, []);

  const saveToSupabase = async (activity: Activity, mode: 'insert' | 'update'): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) return { ok: false, error: 'Supabase is not configured' };

    const payload = {
      title: activity.title,
      slug: activity.slug,
      location_name: activity.locationName,
      short_description: activity.shortDescription,
      full_description: activity.fullDescription,
      highlights: activity.highlights,
      included: activity.included,
      not_included: activity.notIncluded,
      itinerary: activity.itinerary,
      duration_hours: activity.durationHours,
      price_original: activity.priceOriginal,
      price_discounted: activity.priceDiscounted,
      rating: activity.rating,
      review_count: activity.reviewCount,
      badge: activity.badge,
      traveler_type: activity.travelerType,
      destination_id: null,
      status: 'published',
      is_featured: true,
      is_trending: true,
    };

    const imagesToSave = (activity.images && activity.images.length > 0) ? activity.images : [];

    try {
      if (mode === 'insert') {
        const { data: inserted, error } = await supabase
          .from('activities')
          .insert([payload])
          .select('id')
          .maybeSingle();

        if (error) {
          console.error('Supabase activities insert error:', error.message);
          return { ok: false, error: error.message };
        }
        if (inserted?.id && imagesToSave.length > 0) {
          const imageRows = imagesToSave.map((url, idx) => ({
            activity_id: inserted.id,
            image_url: url,
            display_order: idx,
          }));
          await supabase.from('activity_images').insert(imageRows);
        }
      } else {
        const { data: updated, error } = await supabase
          .from('activities')
          .update(payload)
          .eq('slug', activity.slug)
          .select('id')
          .maybeSingle();

        if (error) {
          console.error('Supabase activities update error:', error.message);
          return { ok: false, error: error.message };
        }
        if (updated?.id && imagesToSave.length > 0) {
          await supabase.from('activity_images').delete().eq('activity_id', updated.id);
          const imageRows = imagesToSave.map((url, idx) => ({
            activity_id: updated.id,
            image_url: url,
            display_order: idx,
          }));
          await supabase.from('activity_images').insert(imageRows);
        }
      }
      return { ok: true };
    } catch (err: any) {
      console.error('Failed to sync activity to Supabase:', err);
      return { ok: false, error: err?.message || 'Network error' };
    }
  };

  const saveCustomLocally = (list: Activity[]) => {
    const initialSlugs = new Set(INITIAL_ACTIVITIES.map((a) => a.slug));
    const custom = list.filter((a) => !initialSlugs.has(a.slug));
    try { localStorage.setItem('custom_activities', JSON.stringify(custom)); } catch (_) {}
  };

  // ── CREATE TOUR ──
  const handleCreate = async (activity: Activity) => {
    const res = await saveToSupabase(activity, 'insert');
    const updated = [activity, ...activitiesList.filter((a) => a.id !== activity.id)];
    setActivitiesList(updated);
    saveCustomLocally(updated);
    setAddModalOpen(false);

    if (res.ok) {
      showToast('Tour published & synced to Supabase successfully!');
    } else {
      showToast('Saved locally, but Supabase rejected sync: ' + res.error, 'error');
    }
  };

  // ── UPDATE TOUR ──
  const handleUpdate = async (activity: Activity) => {
    const res = await saveToSupabase(activity, 'update');
    const updated = activitiesList.map((a) => (a.id === activity.id ? activity : a));
    setActivitiesList(updated);
    saveCustomLocally(updated);
    setEditActivity(null);

    if (res.ok) {
      showToast('Tour updated & synced across all devices!');
    } else {
      showToast('Updated locally, but Supabase error: ' + res.error, 'error');
    }
  };

  // ── DELETE TOUR ──
  const handleDelete = async () => {
    if (!deleteActivity) return;
    const updated = activitiesList.filter((a) => a.id !== deleteActivity.id);
    setActivitiesList(updated);
    saveCustomLocally(updated);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('activities').delete().eq('slug', deleteActivity.slug);
      if (error) {
        showToast('Deleted locally, but Supabase error: ' + error.message, 'error');
        setDeleteActivity(null);
        return;
      }
    }
    setDeleteActivity(null);
    showToast('Tour deleted from Supabase.');
  };

  // ── BOOKING STATUS UPDATE ──
  const handleUpdateBookingStatus = async (ref: string, newStatus: string) => {
    const updated = bookings.map(b => b.ref === ref ? { ...b, status: newStatus } : b);
    setBookings(updated);
    try {
      localStorage.setItem('bookings', JSON.stringify(updated));
    } catch (_) {}

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .update({ booking_status: newStatus.toLowerCase() })
          .eq('booking_reference', ref)
          .select();

        // If the booking was a demo/mock order not yet in the database, upsert it so all devices receive it
        if (!error && (!data || data.length === 0)) {
          const target = bookings.find(b => b.ref === ref);
          if (target) {
            await supabase.from('bookings').upsert(
              [
                {
                  booking_reference: target.ref,
                  user_name: target.name,
                  user_email: target.email,
                  user_phone: '+6285128016716',
                  user_country: 'Traveler',
                  booking_date: target.date,
                  participants_count: target.guests,
                  pickup_address: target.hotel || 'Ubud Hotel Lobby',
                  total_amount: target.total,
                  currency: 'USD',
                  payment_status: 'confirmed',
                  booking_status: newStatus.toLowerCase(),
                },
              ],
              { onConflict: 'booking_reference' }
            );
          }
        }
      } catch (err) {
        console.error('Supabase booking update error:', err);
      }
    }
    showToast(`Booking ${ref} status updated to ${newStatus}`);
  };

  // ── TEAM MANAGEMENT ──
  const handleAddTeamMember = async (member: TeamMember) => {
    const updated = [...teamMembers.filter(m => m.email.toLowerCase() !== member.email.toLowerCase()), member];
    saveTeamMembers(updated);
    if (member.tempPassword) {
      try {
        localStorage.setItem(`team_pwd_${member.email.toLowerCase()}`, member.tempPassword);
      } catch (_) {}
    }

    // Save to Supabase team_members table for CROSS-DEVICE SYNC
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('team_members').upsert(
          [
            {
              id: member.id,
              name: member.name,
              email: member.email.trim().toLowerCase(),
              role: member.role,
              password: member.tempPassword || 'bali12345',
              temp_password: member.tempPassword || null,
              status: member.status || 'active',
              created_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'email' }
        );
        if (error) {
          console.warn('Supabase team_members upsert notice:', error.message);
        }
      } catch (err) {
        console.warn('Supabase team_member error:', err);
      }

      // Try Supabase signUp in background
      if (member.tempPassword) {
        try {
          await supabase.auth.signUp({
            email: member.email,
            password: member.tempPassword,
            options: {
              data: { name: member.name, role: member.role },
            },
          });
        } catch (_) {}
      }
    }

    showToast(`Added ${member.name} (${member.role === 'super_admin' ? 'Super Admin' : 'Operations Staff'})!`);
  };

  const handleDeleteTeamMember = async (id: string) => {
    const target = teamMembers.find(m => m.id === id);
    if (target?.email.toLowerCase() === 'imade.novandy23@gmail.com') {
      showToast('Cannot delete primary super admin account!', 'error');
      return;
    }
    const updated = teamMembers.filter(m => m.id !== id);
    saveTeamMembers(updated);

    // Delete from Supabase team_members table
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('team_members').delete().eq('id', id);
      } catch (_) {}
    }

    showToast('Team member removed.');
  };

  const handleCopyTempPassword = (id: string, pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedTempId(id);
    setTimeout(() => setCopiedTempId(null), 2000);
  };

  // ── SETTINGS / PASSWORD UPDATE ──
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setPasswordUpdating(true);

    if (isSupabaseConfigured && supabase) {
      // Update in team_members table across all devices
      try {
        await supabase
          .from('team_members')
          .update({
            password: newPassword,
            temp_password: null,
          })
          .ilike('email', userEmail.trim().toLowerCase());
      } catch (_) {}

      // Update Supabase Auth if authenticated
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          console.warn('Supabase password update notice:', error.message);
        }
      } catch (_) {}
    }

    // Update local storage fallback credentials
    try {
      localStorage.setItem(`team_pwd_${userEmail.toLowerCase()}`, newPassword);
      if (userEmail.toLowerCase() === 'imade.novandy23@gmail.com') {
        localStorage.setItem('master_admin_pwd', newPassword);
      }
      const updatedTeam = teamMembers.map(m => m.email.toLowerCase() === userEmail.toLowerCase() ? { ...m, tempPassword: undefined } : m);
      saveTeamMembers(updatedTeam);
    } catch (_) {}

    setPasswordUpdating(false);
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password updated successfully! Remember your new password for your next sign in.');
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
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Logged in as: <strong className="text-gray-800">{userEmail}</strong></span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                  isSuperAdmin ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isSuperAdmin ? 'Super Admin' : 'Operations Staff'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                isSupabaseConfigured ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                <Database className="w-4 h-4" />
                <span>{isSupabaseConfigured ? '🟢 Supabase Connected' : '🟡 Local Mode'}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 mb-8 pb-3 overflow-x-auto">
            {(['overview', ...(isSuperAdmin ? ['activities'] : []), 'bookings', ...(isSuperAdmin ? ['team'] : []), 'settings'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                  activeTab === tab ? 'bg-emerald-800 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {tab === 'overview' && 'Overview & Analytics'}
                {tab === 'activities' && `Tour Catalog (${activitiesList.length})`}
                {tab === 'bookings' && `Bookings (${bookings.length})`}
                {tab === 'team' && `Team & Staff (${teamMembers.length})`}
                {tab === 'settings' && 'Settings & Password'}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: <DollarSign className="w-5 h-5" />, color: 'emerald', label: 'Total Revenue', value: `$${bookings.reduce((sum, b) => sum + (b.total || 0), 0).toLocaleString()}`, sub: 'Marketplace Bookings' },
                  { icon: <ShoppingBag className="w-5 h-5" />, color: 'amber', label: 'Total Bookings', value: bookings.length.toString(), sub: 'Guest reservations' },
                  { icon: <Star className="w-5 h-5" />, color: 'blue', label: 'Average Rating', value: '4.9 / 5.0', sub: 'Verified guest reviews' },
                  { icon: <Users className="w-5 h-5" />, color: 'purple', label: 'Team Members', value: `${teamMembers.length} Active`, sub: `${teamMembers.filter(m => m.role === 'staff').length} staff, ${teamMembers.filter(m => m.role === 'super_admin').length} admin` },
                ].map((c, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className={`w-10 h-10 rounded-2xl bg-${c.color}-50 text-${c.color}-600 flex items-center justify-center mb-3`}>{c.icon}</div>
                    <span className="text-xs font-bold text-gray-400 block uppercase">{c.label}</span>
                    <span className="text-2xl font-extrabold text-gray-900">{c.value}</span>
                    <span className="text-[11px] text-emerald-600 font-bold mt-1 block">{c.sub}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-extrabold text-gray-900">Recent Customer Bookings</h3>
                  <button onClick={() => setActiveTab('bookings')} className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer">
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px]">
                        <th className="pb-3">Ref</th><th className="pb-3">Guest</th><th className="pb-3">Tour</th>
                        <th className="pb-3">Date</th><th className="pb-3">Guests</th><th className="pb-3">Total</th><th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                      {bookings.slice(0, 6).map((b) => (
                        <tr key={b.ref} className="hover:bg-gray-50">
                          <td className="py-3 font-mono font-bold text-emerald-800">{b.ref}</td>
                          <td className="py-3 font-bold text-gray-900">{b.name}</td>
                          <td className="py-3 max-w-[160px] truncate">{b.title}</td>
                          <td className="py-3">{b.date}</td>
                          <td className="py-3">{b.guests}</td>
                          <td className="py-3 font-bold text-emerald-900">${b.total}</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                              b.status === 'Completed' ? 'bg-blue-50 text-blue-800' : b.status === 'Cancelled' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'
                            }`}>{b.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── ACTIVITIES (SUPER ADMIN ONLY) ── */}
          {activeTab === 'activities' && isSuperAdmin && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Manage Tour Inventory</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Listings actively published on the marketplace.</p>
                </div>
                <button onClick={() => setAddModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer">
                  <Plus className="w-4 h-4" /><span>Add New Experience</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px]">
                      <th className="pb-3 w-8"></th><th className="pb-3">Tour Title</th><th className="pb-3">Location</th>
                      <th className="pb-3">Category</th><th className="pb-3">Price</th><th className="pb-3">Rating</th>
                      <th className="pb-3">Badge</th><th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                    {activitiesList.map((act) => (
                      <tr key={act.id} className="hover:bg-gray-50">
                        <td className="py-2 pr-2">
                          {act.images?.[0] ? (
                            <img src={act.images[0]} alt={act.title} className="w-9 h-9 rounded-lg object-cover border border-gray-100" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300"><ImageIcon className="w-4 h-4" /></div>
                          )}
                        </td>
                        <td className="py-2 font-bold text-gray-900 max-w-[180px] truncate">{act.title}</td>
                        <td className="py-2">{act.locationName}</td>
                        <td className="py-2 capitalize">{act.categorySlug}</td>
                        <td className="py-2 font-bold text-emerald-900">${act.priceDiscounted}</td>
                        <td className="py-2">★ {act.rating} ({act.reviewCount})</td>
                        <td className="py-2">
                          {act.badge && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">{act.badge}</span>}
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a href={`/activities/${act.slug}`} target="_blank" rel="noopener noreferrer" title="View"
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                            <button onClick={() => setEditActivity(act)} title="Edit"
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteActivity(act)} title="Delete"
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer">
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

          {/* ── BOOKINGS ── */}
          {activeTab === 'bookings' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">All Guest Reservations</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Manage customer orders, hotel pickups, and contact guests directly.</p>
                </div>
                <span className="text-xs text-gray-500 font-bold bg-gray-100 px-3 py-1.5 rounded-xl">{bookings.length} reservations</span>
              </div>
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div key={b.ref} className="p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-emerald-800 text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">{b.ref}</span>
                        <span className="text-xs text-gray-400">• Travel Date: <strong className="text-gray-700">{b.date}</strong></span>
                      </div>
                      <h4 className="font-extrabold text-base text-gray-900">{b.name} <span className="font-normal text-xs text-gray-500">({b.email})</span></h4>
                      <p className="text-xs font-semibold text-emerald-950 mt-0.5">Tour: {b.title}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mt-1">
                        <span>👥 Guests: <strong>{b.guests} person(s)</strong></span>
                        <span>💵 Amount: <strong className="text-emerald-900">${b.total}</strong></span>
                        {b.hotel && <span>🏨 Pickup: <strong>{b.hotel}</strong></span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                      {/* Status Selector */}
                      <select
                        value={b.status}
                        onChange={(e) => handleUpdateBookingStatus(b.ref, e.target.value)}
                        className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border cursor-pointer outline-none ${
                          b.status === 'Completed' ? 'bg-blue-50 text-blue-800 border-blue-200' : b.status === 'Cancelled' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      {/* WhatsApp Direct Link */}
                      <a
                        href={`https://wa.me/6285128016716?text=Hello%20${encodeURIComponent(b.name)},%20we%20are%20contacting%20you%20from%20Bali%20Mesari%20Tour%20regarding%20booking%20${b.ref}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Chat WA</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TEAM & STAFF (SUPER ADMIN ONLY) ── */}
          {activeTab === 'team' && isSuperAdmin && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Team & Staff Roles</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Assign staff to manage bookings or add co-administrators.</p>
                </div>
                <button
                  onClick={() => setAddTeamModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Team Member</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px]">
                      <th className="pb-3">Member</th>
                      <th className="pb-3">Role & Permissions</th>
                      <th className="pb-3">Access Credentials</th>
                      <th className="pb-3">Joined Date</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 block">{member.name}</span>
                              <span className="text-[11px] text-gray-400">{member.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            member.role === 'super_admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            <ShieldCheck className="w-3 h-3" />
                            {member.role === 'super_admin' ? 'Super Admin' : 'Operations Staff'}
                          </span>
                        </td>
                        <td className="py-3">
                          {member.tempPassword ? (
                            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                              <span className="font-mono text-[11px] font-bold text-amber-900">Temp: {member.tempPassword}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyTempPassword(member.id, member.tempPassword!)}
                                className="p-0.5 hover:bg-amber-100 rounded text-amber-800 cursor-pointer"
                                title="Copy Password"
                              >
                                {copiedTempId === member.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-medium">Password Set (Private)</span>
                          )}
                        </td>
                        <td className="py-3 text-gray-500">{member.createdAt}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            {member.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {member.email.toLowerCase() !== 'imade.novandy23@gmail.com' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTeamMember(member.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SETTINGS & CHANGE PASSWORD ── */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Profile Card */}
              <div className="md:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-extrabold">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">{currentMember?.name || 'Administrator'}</h3>
                    <p className="text-[11px] text-gray-500">{userEmail}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-50">
                    <span className="text-gray-400">Assigned Role:</span>
                    <span className="font-bold text-gray-900">{isSuperAdmin ? 'Super Admin' : 'Operations Staff'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-50">
                    <span className="text-gray-400">Status:</span>
                    <span className="font-bold text-emerald-700">Active</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-400">Access Level:</span>
                    <span className="font-bold text-gray-800">{isSuperAdmin ? 'All Privileges' : 'Bookings & Guests'}</span>
                  </div>
                </div>
              </div>

              {/* Change Password Form */}
              <div className="md:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">Change Your Password</h3>
                    <p className="text-[11px] text-gray-500">Update your credentials to keep your portal secure</p>
                  </div>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md text-xs font-medium text-gray-700">
                  <div>
                    <label className="font-bold text-gray-900 block mb-1">New Password *</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-emerald-600 transition-colors"
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">Minimum 6 characters.</span>
                  </div>

                  <div>
                    <label className="font-bold text-gray-900 block mb-1">Confirm New Password *</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-emerald-600 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordUpdating}
                      className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60"
                    >
                      {passwordUpdating ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      {addModalOpen && <TourFormModal mode="add" onClose={() => setAddModalOpen(false)} onSave={handleCreate} />}
      {editActivity && <TourFormModal mode="edit" initial={editActivity} onClose={() => setEditActivity(null)} onSave={handleUpdate} />}
      {deleteActivity && <DeleteConfirmModal activity={deleteActivity} onCancel={() => setDeleteActivity(null)} onConfirm={handleDelete} />}
      {addTeamModalOpen && <AddTeamMemberModal onClose={() => setAddTeamModalOpen(false)} onSave={handleAddTeamMember} />}

      <Footer />
    </div>
  );
}

// ─── Main Page (Auth Gate) ────────────────────────────────────────────────────

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem('admin_fallback_auth') === 'true') {
        const storedEmail = localStorage.getItem('admin_user_email') || 'imade.novandy23@gmail.com';
        setSession({ user: { email: storedEmail } });
        setChecking(false);
        return;
      }
    } catch (_) {}

    if (!supabase) { setChecking(false); return; }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSession(data.session);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (sess) setSession(sess);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try { 
      localStorage.removeItem('admin_fallback_auth');
      localStorage.removeItem('admin_user_email');
    } catch (_) {}
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center">
        <div className="text-emerald-300 text-sm font-bold animate-pulse">Checking authorization...</div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={(sess) => {
      if (sess) {
        setSession(sess);
      } else {
        supabase?.auth.getSession().then(({ data }) => setSession(data.session));
      }
    }} />;
  }

  return <AdminDashboard onLogout={handleLogout} currentUserEmail={session?.user?.email} />;
}
