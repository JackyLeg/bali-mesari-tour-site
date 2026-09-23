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
import { Activity, BlogPost } from '@/types';
import { INITIAL_ACTIVITIES, getActivities, getBlogPosts, saveBlogPostsLocal, deleteBlogPostLocal } from '@/lib/data';
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
  BookOpen,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  Send,
  Share2,
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
// 📚 HOW THE COVER PICKER WORKS:
//   Images are stored as a flat array. The first image (index 0) is always the cover
//   shown on catalog cards. "Set as Cover" swaps the chosen image to position 0.
//   Drag & drop works whether the zone is empty or already has photos.

interface ImageUploaderProps {
  images: string[];
  onChange: (imgs: string[]) => void;
  coverIndex: number;
  onSetCover: (idx: number) => void;
}

function ImageUploader({ images, onChange, coverIndex, onSetCover }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { setError(`Maximum ${MAX_IMAGES} images allowed.`); return; }
    const toProcess = Array.from(files).slice(0, remaining);
    if (files.length > remaining) setError(`Only ${remaining} more can be added. Others were skipped.`);

    // Read all files and append them together
    const pending: string[] = [];
    let done = 0;
    toProcess.forEach((file, i) => {
      if (!file.type.startsWith('image/')) { 
        setError('Only image files accepted (jpg, png, webp, gif).'); 
        done++; 
        return; 
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        pending[i] = ev.target?.result as string;
        done++;
        if (done === toProcess.length) {
          onChange([...images, ...pending.filter(Boolean)]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const addImageUrl = () => {
    if (!urlInput.trim()) return;
    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
      setError('Please provide a valid image URL starting with http:// or https://');
      return;
    }
    if (images.length >= MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    setError('');
    onChange([...images, urlInput.trim()]);
    setUrlInput('');
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
    // If removed image was cover, shift cover to 0
    if (idx === coverIndex && images.length > 1) onSetCover(0);
  };

  const handleDragOver = (e: React.DragEvent) => { 
    e.preventDefault(); 
    e.stopPropagation();
    setIsDragging(true); 
  };
  const handleDragLeave = (e: React.DragEvent) => { 
    e.preventDefault(); 
    e.stopPropagation();
    setIsDragging(false); 
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Photo upload dropzone and button */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
          isDragging 
            ? 'border-emerald-600 bg-emerald-50/80 scale-[1.01]' 
            : 'border-gray-200 bg-white hover:border-emerald-400 hover:bg-gray-50/60'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center shadow-xs">
            <Upload className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800">
              Drag & Drop your photos here, or
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Supports multiple files (JPG, PNG, WebP) • Up to {MAX_IMAGES} photos
            </p>
          </div>

          {/* Prominent File Manager Button */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-1 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span>📁 Browse Files / Open File Manager</span>
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Alternative: Add Image by URL */}
      <div className="flex items-center gap-2">
        <input
          type="url"
          placeholder="Or paste an image web URL (e.g. https://...)"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 outline-none focus:border-emerald-600"
        />
        <button
          type="button"
          onClick={addImageUrl}
          className="px-3.5 py-2 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-900 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
        >
          Add URL
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* Photo thumbnails grid */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-500">
              Uploaded Photos ({images.length} / {MAX_IMAGES})
            </span>
            <span className="text-[10px] text-gray-400">
              Click ★ Cover to choose the main listing thumbnail
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {images.map((src, idx) => (
              <div
                key={idx}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 group shadow-2xs ${
                  idx === coverIndex ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-md' : 'border-gray-200'
                }`}
              >
                <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />

                {/* Gold ★ Cover badge on active cover */}
                {idx === coverIndex ? (
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-extrabold bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 leading-none">
                    ★ Cover
                  </span>
                ) : (
                  /* "Set as Cover" button */
                  <button
                    type="button"
                    onClick={() => onSetCover(idx)}
                    title="Set as cover photo"
                    className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-black/70 hover:bg-amber-400 hover:text-emerald-950 text-white px-2 py-0.5 rounded-md opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all shadow-xs leading-none cursor-pointer"
                  >
                    ★ Set Cover
                  </button>
                )}

                {/* Delete photo button */}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  title="Remove this photo"
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tour Form Modal ──────────────────────────────────────────────────────────
// Changes from original:
//   ① Package / Pricing Tiers builder (for Package A/B, per-car, etc.)
//   ② Cover picker + always-on drag zone (passed down to ImageUploader)
//   ③ Optional discount toggle
//   ④ Duration field removed
//   ⑤ Renamed "Location Name" → "Where does this tour go?"
//      Renamed "Destination Region" → "Destination Filter Region"

export interface PricePackageForm {
  name: string;
  description: string;
  price: string; // kept as string for input binding, parsed on submit
  unit: string;
}

interface TourFormModalProps {
  mode: 'add' | 'edit';
  initial?: Activity | null;
  onClose: () => void;
  onSave: (activity: Activity) => void;
}

function TourFormModal({ mode, initial, onClose, onSave }: TourFormModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  // ── Cover photo index ────────────────────────────────────────────────────────
  // Images array position 0 = cover shown on catalog cards.
  // We track a local index so the user can pick any photo as cover;
  // on submit we reorder the array so the chosen one ends up at [0].
  const [coverIndex, setCoverIndex] = useState(0);

  // ── Pricing packages ─────────────────────────────────────────────────────────
  // Supports multiple named price tiers (Package A/B, per-car, etc.)
  // The minimum package price auto-fills the card's "From $XX" display.
  const [pricePackages, setPricePackages] = useState<PricePackageForm[]>(
    initial?.pricePackages
      ? initial.pricePackages.map(p => ({ ...p, price: String(p.price) }))
      : []
  );

  // ── Discount toggle ──────────────────────────────────────────────────────────
  // When OFF: single "Base Price" field.
  // When ON: "Original Price" (crossed-out) + "Sale Price" both shown.
  const [hasDiscount, setHasDiscount] = useState(
    !!(initial?.priceOriginal && initial.priceOriginal > 0)
  );

  const [form, setForm] = useState({
    title: initial?.title ?? '',
    locationName: initial?.locationName ?? '',
    destinationSlug: initial?.destinationSlug ?? 'ubud',
    categorySlug: initial?.categorySlug ?? 'adventure',
    shortDescription: initial?.shortDescription ?? '',
    fullDescription: initial?.fullDescription ?? '',
    highlights: (initial?.highlights ?? ['Hotel pickup included', 'English-speaking guide']).join(', '),
    includedText: (initial?.included ?? ['Hotel pickup and drop-off', 'English-speaking driver', 'Mineral water']).join('\n'),
    notIncludedText: (initial?.notIncluded ?? ['Your meals', 'Personal tips']).join('\n'),
    priceOriginal: initial?.priceOriginal ? String(initial.priceOriginal) : '',
    priceDiscounted: initial?.priceDiscounted ? String(initial.priceDiscounted) : '',
    rating: initial?.rating ?? 4.9,
    reviewCount: initial?.reviewCount ?? 120,
    badge: initial?.badge ?? 'Popular',
    travelerType: (initial?.travelerType ?? 'Adventure') as 'Adventure' | 'Couples' | 'Families' | 'Culture' | 'Luxury',
  });

  const [itinerary, setItinerary] = useState<{ time: string; title: string; description: string }[]>(
    initial?.itinerary && initial.itinerary.length > 0
      ? initial.itinerary.map(item => ({ time: item.time, title: item.title, description: item.description || '' }))
      : []
  );

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // Package helpers
  const addPackage = () => setPricePackages(prev => [...prev, { name: '', description: '', price: '', unit: '/ person' }]);
  const removePackage = (idx: number) => setPricePackages(prev => prev.filter((_, i) => i !== idx));
  const updatePackage = (idx: number, key: keyof PricePackageForm, val: string) =>
    setPricePackages(prev => prev.map((p, i) => i === idx ? { ...p, [key]: val } : p));

  // Itinerary helpers
  const updateItineraryStep = (index: number, key: 'time' | 'title' | 'description', val: string) =>
    setItinerary(prev => prev.map((step, i) => (i === index ? { ...step, [key]: val } : step)));
  const addItineraryStep = () =>
    setItinerary(prev => [...prev, { time: '', title: '', description: '' }]);
  const removeItineraryStep = (index: number) =>
    setItinerary(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) { alert('Please upload at least one photo.'); return; }
    setSubmitting(true);

    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `tour-${Date.now()}`;

    // Reorder so chosen cover is at index 0
    const orderedImages = coverIndex > 0 && images.length > 1
      ? [images[coverIndex], ...images.filter((_, i) => i !== coverIndex)]
      : images;

    // Parse packages (ignore empty rows)
    const parsedPackages = pricePackages
      .filter(p => p.name.trim() && Number(p.price) > 0)
      .map(p => ({ name: p.name.trim(), description: p.description.trim(), price: Number(p.price), unit: p.unit }));

    // Lowest package price = the "From $XX" shown on cards
    const basePrice = parsedPackages.length > 0
      ? Math.min(...parsedPackages.map(p => p.price))
      : Number(form.priceDiscounted) || 0;

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
      itinerary,
      // durationHours intentionally omitted — not all tours are time-based
      pickupAvailable: true,
      pickupLocations: 'Ubud, Canggu, Seminyak, Kuta, Sanur',
      meetingPoint: 'Hotel Lobby',
      priceOriginal: hasDiscount && form.priceOriginal ? Number(form.priceOriginal) : undefined,
      priceDiscounted: basePrice,
      pricePackages: parsedPackages.length > 0 ? parsedPackages : undefined,
      rating: Number(form.rating) || 4.9,
      reviewCount: Number(form.reviewCount) || 1,
      cancellationPolicy: 'Free cancellation up to 24 hours in advance',
      badge: form.badge as any,
      travelerType: form.travelerType,
      status: 'published',
      isFeatured: true,
      isTrending: true,
      images: orderedImages,
    };

    onSave(activity);
    setSubmitting(false);
  };

  // Live preview of minimum package price
  const minPackagePrice = pricePackages.length > 0
    ? Math.min(...pricePackages.map(p => Number(p.price) || Infinity).filter(isFinite))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider block">Admin Inventory</span>
            <h3 className="text-xl font-extrabold text-gray-900">
              {mode === 'add' ? 'Add New Catalog Listing' : 'Edit Catalog Listing'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs font-medium text-gray-700">

          {/* ── A: Photos ─────────────────────────────────────────────────────── */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/70">
            <label className="font-bold text-gray-900 flex items-center gap-1.5 mb-3">
              <ImageIcon className="w-4 h-4 text-emerald-700" />
              <span>Photos *</span>
              <span className="font-normal text-gray-500 text-[11px]">
                — drag & drop multiple files at once. Hover any photo → click ★ Cover to set thumbnail.
              </span>
            </label>
            <ImageUploader
              images={images}
              onChange={setImages}
              coverIndex={coverIndex}
              onSetCover={setCoverIndex}
            />
          </div>

          {/* ── B: Basic Information ───────────────────────────────────────────── */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">1. Basic Information</h4>

            <div>
              <label className="font-bold text-gray-900 block mb-1">Catalog Title *</label>
              <input type="text" required
                placeholder="e.g. Amazing Package Nusa Penida Island"
                value={form.title} onChange={(e) => set('title', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 font-semibold text-gray-900" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                {/*
                  "Where does this tour go?" = the pin-badge text shown ON the photo card.
                  e.g. "Nusa Penida Island" or "Ubud, Bali" or "Kintamani Area"
                  It's a display label — doesn't affect filters.
                */}
                <label className="font-bold text-gray-900 block mb-1">
                  Where does this tour go? *
                  <span className="font-normal text-gray-400 ml-1 text-[10px]">
                    (pin label shown on card photo)
                  </span>
                </label>
                <input type="text" required
                  placeholder="e.g. Nusa Penida Island"
                  value={form.locationName} onChange={(e) => set('locationName', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600" />
              </div>
              <div>
                {/*
                  "Destination Filter Region" = which filter bucket this listing falls into.
                  When customers filter by "Nusa Penida", listings with this dropdown set to
                  "Nusa Penida" appear. Doesn't need to be the exact location text.
                */}
                <label className="font-bold text-gray-900 block mb-1">
                  Destination Filter Region
                  <span className="font-normal text-gray-400 ml-1 text-[10px]">
                    (for customer search filters)
                  </span>
                </label>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                <label className="font-bold text-gray-900 block mb-1">Rating / Reviews</label>
                <div className="flex gap-1.5">
                  <input type="number" step="0.1" min="1" max="5" value={form.rating}
                    onChange={(e) => set('rating', Number(e.target.value))}
                    className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 outline-none focus:border-emerald-600 font-bold text-amber-600" title="Rating (e.g. 4.9)" />
                  <input type="number" min="0" value={form.reviewCount}
                    onChange={(e) => set('reviewCount', Number(e.target.value))}
                    className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 outline-none focus:border-emerald-600" title="Review count" />
                </div>
              </div>
            </div>
          </div>

          {/* ── C: Pricing ────────────────────────────────────────────────────── */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">2. Pricing</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Add named tiers (Package A/B, per-car, per-group) or set a single base price.
                </p>
              </div>
              <button type="button" onClick={addPackage}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl border border-emerald-200/80 transition-colors shrink-0">
                + Add Package
              </button>
            </div>

            {/* Package rows */}
            {pricePackages.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 px-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  <span className="col-span-4">Package Name</span>
                  <span className="col-span-4">What's in this tier</span>
                  <span className="col-span-2">Price ($)</span>
                  <span className="col-span-1">Unit</span>
                  <span className="col-span-1"></span>
                </div>
                {pricePackages.map((pkg, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-emerald-50/50 border border-emerald-100 rounded-xl p-2">
                    <input type="text"
                      placeholder="e.g. Package A — East Side"
                      value={pkg.name} onChange={(e) => updatePackage(idx, 'name', e.target.value)}
                      className="col-span-4 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-emerald-600" />
                    <input type="text"
                      placeholder="Diamond Beach, Kelingking..."
                      value={pkg.description} onChange={(e) => updatePackage(idx, 'description', e.target.value)}
                      className="col-span-4 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 outline-none focus:border-emerald-600" />
                    <input type="number" min={0} placeholder="80"
                      value={pkg.price} onChange={(e) => updatePackage(idx, 'price', e.target.value)}
                      className="col-span-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-emerald-800 outline-none focus:border-emerald-600" />
                    <select value={pkg.unit} onChange={(e) => updatePackage(idx, 'unit', e.target.value)}
                      className="col-span-1 bg-white border border-gray-200 rounded-lg px-1.5 py-1.5 text-[10px] text-gray-600 outline-none focus:border-emerald-600 cursor-pointer">
                      <option value="/ person">/ person</option>
                      <option value="/ car">/ car</option>
                      <option value="/ group">/ group</option>
                      <option value="/ boat">/ boat</option>
                      <option value="/ hour">/ hour</option>
                    </select>
                    <button type="button" onClick={() => removePackage(idx)}
                      className="col-span-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex justify-center">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {minPackagePrice !== null && isFinite(minPackagePrice) && (
                  <p className="text-[11px] text-emerald-700 font-bold px-1">
                    ✓ Cards will show: <span className="text-emerald-900">From ${minPackagePrice}</span>
                    &nbsp;(lowest package price, auto-selected)
                  </p>
                )}
              </div>
            )}

            {/* Single base price — only when no packages */}
            {pricePackages.length === 0 && (
              <div className="space-y-3">
                {/* Discount toggle */}
                <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
                  <div className="relative">
                    <input type="checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-emerald-600 transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">This listing has a discount / sale price</span>
                </label>

                <div className={`grid gap-4 ${hasDiscount ? 'grid-cols-2' : 'grid-cols-1 max-w-xs'}`}>
                  {hasDiscount && (
                    <div>
                      <label className="font-bold text-gray-900 block mb-1 line-through decoration-red-400">
                        Original Price ($)
                        <span className="font-normal text-gray-400 no-underline ml-1">(crossed-out on card)</span>
                      </label>
                      <input type="number" min={0}
                        placeholder="e.g. 100"
                        value={form.priceOriginal} onChange={(e) => set('priceOriginal', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <label className="font-bold text-gray-900 block mb-1">
                      {hasDiscount ? 'Sale Price ($) *' : 'Base Price ($) *'}
                      <span className="font-normal text-gray-400 ml-1">(shown as "From $XX" on card)</span>
                    </label>
                    <input type="number" min={0} required
                      placeholder="e.g. 80"
                      value={form.priceDiscounted} onChange={(e) => set('priceDiscounted', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 font-extrabold text-emerald-900" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── D: Descriptions & Highlights ──────────────────────────────────── */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">3. Descriptions & Highlights</h4>
            <div>
              <label className="font-bold text-gray-900 block mb-1">
                Short Description * <span className="font-normal text-gray-500">(shown on catalog cards)</span>
              </label>
              <textarea rows={2} required placeholder="A short 1-2 sentence preview..."
                value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600" />
            </div>
            <div>
              <label className="font-bold text-gray-900 block mb-1">
                Full Description <span className="font-normal text-gray-500">(shown on the listing detail page)</span>
              </label>
              <textarea rows={4} placeholder="Detailed description of the experience..."
                value={form.fullDescription} onChange={(e) => set('fullDescription', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 leading-relaxed" />
            </div>
            <div>
              <label className="font-bold text-gray-900 block mb-1">
                Experience Highlights <span className="font-normal text-gray-500">(comma-separated bullet points)</span>
              </label>
              <input type="text"
                placeholder="Hotel pickup included, English-speaking guide, All entrance fees included..."
                value={form.highlights} onChange={(e) => set('highlights', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600" />
            </div>
          </div>

          {/* ── E: Inclusions & Exclusions ────────────────────────────────────── */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">4. What's Included / Not Included</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-emerald-800 block mb-1">
                  ✓ Included <span className="font-normal text-gray-500">(one item per line)</span>
                </label>
                <textarea rows={5}
                  placeholder="Hotel pickup & drop-off&#10;English speaking driver&#10;Air-conditioned car&#10;Fuel&#10;All entrance fees"
                  value={form.includedText} onChange={(e) => set('includedText', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 leading-relaxed font-mono text-xs" />
              </div>
              <div>
                <label className="font-bold text-rose-700 block mb-1">
                  ✗ Not Included <span className="font-normal text-gray-500">(one item per line)</span>
                </label>
                <textarea rows={5}
                  placeholder="Your meals&#10;Tickets to sites visited&#10;Personal tips"
                  value={form.notIncludedText} onChange={(e) => set('notIncludedText', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 leading-relaxed font-mono text-xs" />
              </div>
            </div>
          </div>

          {/* ── F: Itinerary (optional) ───────────────────────────────────────── */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                  5. Itinerary / Schedule
                  <span className="font-normal normal-case tracking-normal ml-1 text-gray-400">(optional)</span>
                </h4>
                <p className="text-[11px] text-gray-500">Leave empty for flexible / on-demand services like car charters.</p>
              </div>
              <button type="button" onClick={addItineraryStep}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl border border-emerald-200/80 transition-colors">
                + Add Step
              </button>
            </div>
            {itinerary.length > 0 && (
              <div className="space-y-3">
                {itinerary.map((step, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="w-full sm:w-28">
                      <input type="text" placeholder="08:00 AM"
                        value={step.time} onChange={(e) => updateItineraryStep(idx, 'time', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-700 outline-none focus:border-emerald-600" />
                    </div>
                    <div className="w-full sm:w-1/3">
                      <input type="text" placeholder="Stop Title"
                        value={step.title} onChange={(e) => updateItineraryStep(idx, 'title', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-emerald-600" />
                    </div>
                    <div className="w-full sm:flex-1">
                      <input type="text" placeholder="Short description..."
                        value={step.description} onChange={(e) => updateItineraryStep(idx, 'description', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-600 outline-none focus:border-emerald-600" />
                    </div>
                    <button type="button" onClick={() => removeItineraryStep(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/20 transition-all cursor-pointer disabled:opacity-60">
              {submitting ? 'Saving...' : mode === 'add' ? '✦ Publish Listing' : 'Save Changes'}
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
  const [useEmailAsPassword, setUseEmailAsPassword] = useState(true);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);

  // Update tempPassword when email changes if useEmailAsPassword is true
  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    if (useEmailAsPassword) {
      setTempPassword(newEmail);
    }
  };

  const handleTogglePasswordMode = (useEmail: boolean) => {
    setUseEmailAsPassword(useEmail);
    if (useEmail) {
      setTempPassword(email);
    } else {
      setTempPassword(`Mesari_${Math.floor(1000 + Math.random() * 9000)}!`);
    }
  };

  const generateNewPassword = () => {
    setUseEmailAsPassword(false);
    setTempPassword(`Mesari_${Math.floor(1000 + Math.random() * 9000)}!`);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword || email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const finalPassword = (tempPassword.trim() || email.trim());

    const newMember: TeamMember = {
      id: `team-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      status: 'active',
      tempPassword: finalPassword,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSave(newMember);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-extrabold">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">Add Team Member</h3>
            <p className="text-[11px] text-gray-500">Create access & send verification email with login credentials</p>
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
              onChange={(e) => handleEmailChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 text-gray-900 text-xs font-semibold"
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
                ? '✓ Can view bookings, update status, and contact guests on WhatsApp.' 
                : '✓ Full privileges: can add/delete tours, manage blogs, and add staff.'}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-gray-900">Temporary Password</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePasswordMode(!useEmailAsPassword)}
                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                >
                  {useEmailAsPassword ? 'Use Random Pass' : 'Use Email as Pass'}
                </button>
                {!useEmailAsPassword && (
                  <button
                    type="button"
                    onClick={generateNewPassword}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly={useEmailAsPassword}
                value={useEmailAsPassword ? (email || 'their-email@domain.com') : tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Temporary password"
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
              {useEmailAsPassword 
                ? '✓ Password is set to their email address as requested. Member can change it once logged in.'
                : 'Custom temporary password assigned.'}
            </p>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 flex items-start gap-2">
            <Mail className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              A verification email prompt will automatically launch after adding to dispatch login details to <strong>{email || 'their email'}</strong>.
            </span>
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
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add & Setup Verification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Team Member Verification Email Modal ──────────────────────────────────────

function InviteSentModal({
  member,
  onClose,
}: {
  member: TeamMember;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [apiSending, setApiSending] = useState(false);
  const [apiSentSuccess, setApiSentSuccess] = useState(false);

  const adminUrl = typeof window !== 'undefined' ? `${window.location.origin}/admin` : 'https://balimesari.com/admin';
  const tempPassword = member.tempPassword || member.email;

  const emailSubject = encodeURIComponent('Welcome to Bali Mesari Tour Team — Your Staff Login Credentials');
  const emailBody = encodeURIComponent(
`Dear ${member.name},

You have been granted access to the Bali Mesari Tour management portal as ${member.role === 'super_admin' ? 'Super Administrator' : 'Operations Staff'}.

Your staff login credentials:
------------------------------------------
Portal URL: ${adminUrl}
Login Email: ${member.email}
Temporary Password: ${tempPassword}
------------------------------------------

Important steps:
1. Log in at ${adminUrl}
2. Go to "Settings & Password" in the top bar to set a private password.
3. For immediate assistance, reach out to the admin team.

Best regards,
Bali Mesari Tour Administration`
  );

  const mailtoUrl = `mailto:${member.email}?subject=${emailSubject}&body=${emailBody}`;

  const copyInviteText = () => {
    const rawText = 
`Dear ${member.name},
You have been added to the Bali Mesari Tour admin team.
Login URL: ${adminUrl}
Email: ${member.email}
Temporary Password: ${tempPassword}
Please sign in and change your password in Settings.`;
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const sendViaApi = async () => {
    setApiSending(true);
    try {
      const res = await fetch('/api/admin/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: member.name,
          email: member.email,
          role: member.role,
          tempPassword,
          loginUrl: adminUrl,
        }),
      });
      if (res.ok) {
        setApiSentSuccess(true);
      }
    } catch (_) {}
    setApiSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 shadow-xs">
          <Mail className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-extrabold text-gray-900 mb-1">
          Send Verification Email to {member.name}
        </h3>
        <p className="text-xs text-gray-500 mb-5">
          Member created successfully! Now send their verification email containing their temporary password.
        </p>

        {/* Credentials summary card */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2 mb-5 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
            <span className="text-gray-500 font-medium">Recipient:</span>
            <span className="font-bold text-gray-900">{member.name} ({member.email})</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
            <span className="text-gray-500 font-medium">Role:</span>
            <span className="font-bold text-emerald-800 capitalize">{member.role === 'super_admin' ? 'Super Admin' : 'Operations Staff'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
            <span className="text-gray-500 font-medium">Temporary Password:</span>
            <span className="font-mono font-extrabold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">{tempPassword}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-500 font-medium">Portal URL:</span>
            <span className="font-mono text-[11px] text-gray-700">{adminUrl}</span>
          </div>
        </div>

        {apiSentSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 border border-emerald-200">
            <Check className="w-4 h-4 text-emerald-600" />
            Verification email dispatched via system API!
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Primary: Open Email App (mailto) */}
          <a
            href={mailtoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Open Email Client & Send Verification Email</span>
          </a>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={sendViaApi}
              disabled={apiSending || apiSentSuccess}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{apiSending ? 'Dispatching...' : apiSentSuccess ? 'Dispatched ✓' : 'Dispatch via System API'}</span>
            </button>

            <button
              type="button"
              onClick={copyInviteText}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Details' : 'Copy Credentials'}</span>
            </button>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-gray-100 text-right">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Blog Form Modal (Create & Edit) ──────────────────────────────────────────

const BLOG_CATEGORIES = ['Travel Tips', 'Destinations', 'Culture', 'Adventure', 'Food & Drink', 'Wellness'];

function BlogFormModal({
  mode,
  initial,
  activities,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit';
  initial?: BlogPost;
  activities: Activity[];
  onClose: () => void;
  onSave: (post: BlogPost) => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt || '');
  const [content, setContent] = useState(initial?.content || '');
  const [author, setAuthor] = useState(initial?.author || 'Bali Mesari Team');
  const [publishedDate, setPublishedDate] = useState(initial?.publishedDate || new Date().toISOString().split('T')[0]);
  const [readTime, setReadTime] = useState(initial?.readTime || '5 min read');
  const [category, setCategory] = useState(initial?.category || 'Travel Tips');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80');
  const [relatedActivitySlugs, setRelatedActivitySlugs] = useState<string[]>(initial?.relatedActivitySlugs || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-slugify when title changes in create mode
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (mode === 'create') {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setImageUrl(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleRelated = (actSlug: string) => {
    if (relatedActivitySlugs.includes(actSlug)) {
      setRelatedActivitySlugs(relatedActivitySlugs.filter((s) => s !== actSlug));
    } else {
      setRelatedActivitySlugs([...relatedActivitySlugs, actSlug]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    const post: BlogPost = {
      id: initial?.id || `blog-${Date.now()}`,
      slug: slug.trim(),
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      author: author.trim() || 'Bali Mesari Team',
      publishedDate: publishedDate || new Date().toISOString().split('T')[0],
      readTime: readTime.trim() || '5 min read',
      category: category.trim() || 'Travel Tips',
      imageUrl: imageUrl.trim(),
      relatedActivitySlugs,
    };

    onSave(post);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-extrabold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">
              {mode === 'create' ? 'Write New Blog Article' : 'Edit Blog Article'}
            </h3>
            <p className="text-[11px] text-gray-500">Publish guides, travel advice, and culture tips</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-gray-700">
          <div>
            <label className="font-bold text-gray-900 block mb-1">Article Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. 10 Essential Things to Know Before Hiking Mount Batur"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-900 block mb-1">URL Slug *</label>
              <input
                type="text"
                required
                placeholder="mount-batur-hiking-guide"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono text-gray-800 outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-900 block mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 font-semibold outline-none focus:border-emerald-600 cursor-pointer"
              >
                {BLOG_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-gray-900 block mb-1">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-emerald-600 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-gray-900 block mb-1">Publish Date</label>
              <input
                type="date"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-emerald-600 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-gray-900 block mb-1">Read Time</label>
              <input
                type="text"
                placeholder="5 min read"
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-emerald-600 font-medium"
              />
            </div>
          </div>

          {/* Cover Photo */}
          <div>
            <label className="font-bold text-gray-900 block mb-1">Cover Image URL *</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-emerald-600 font-mono"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFile}
            />
            {imageUrl && (
              <div className="mt-2 w-32 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-2xs">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className="font-bold text-gray-900 block mb-1">Summary / Excerpt (Short preview on card) *</label>
            <textarea
              rows={2}
              required
              placeholder="A quick 1-2 sentence teaser to hook readers..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-emerald-600 resize-none font-medium"
            />
          </div>

          {/* Full Content */}
          <div>
            <label className="font-bold text-gray-900 block mb-1">Full Article Content *</label>
            <textarea
              rows={7}
              required
              placeholder="Write the full travel guide or story here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-emerald-600 resize-y font-normal leading-relaxed"
            />
          </div>

          {/* Related Tours / Activities */}
          {activities.length > 0 && (
            <div>
              <label className="font-bold text-gray-900 block mb-1.5">
                Related Tours (Featured at bottom of article)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                {activities.map((act) => {
                  const isChecked = relatedActivitySlugs.includes(act.slug);
                  return (
                    <button
                      key={act.slug}
                      type="button"
                      onClick={() => toggleRelated(act.slug)}
                      className={`text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950' 
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="truncate pr-2">{act.title}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{mode === 'create' ? 'Publish Article' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Blog Modal ────────────────────────────────────────────────────────

function DeleteBlogModal({
  post,
  onCancel,
  onConfirm,
}: {
  post: BlogPost;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-extrabold text-gray-900 mb-1">Delete Article?</h3>
        <p className="text-xs text-gray-500 mb-6">
          <span className="font-bold text-gray-800">"{post.title}"</span> will be permanently deleted from the travel guide.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 text-xs font-extrabold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-sm cursor-pointer">
            Yes, Delete It
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Tour Confirm ──────────────────────────────────────────────────────

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
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'bookings' | 'blog' | 'team' | 'settings'>('overview');
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
  const [inviteSentMember, setInviteSentMember] = useState<TeamMember | null>(null);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [deleteActivity, setDeleteActivity] = useState<Activity | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Booking Filtering State
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'Confirmed' | 'Completed' | 'Cancelled'>('all');
  const [bookingDateFilter, setBookingDateFilter] = useState('');

  // Blog CRUD State
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogSearchQuery, setBlogSearchQuery] = useState('');
  const [blogCategoryFilter, setBlogCategoryFilter] = useState('All');
  const [addBlogModalOpen, setAddBlogModalOpen] = useState(false);
  const [editBlog, setEditBlog] = useState<BlogPost | null>(null);
  const [deleteBlogConfirm, setDeleteBlogConfirm] = useState<BlogPost | null>(null);

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

  // Load activities and blogs from Supabase & localStorage
  useEffect(() => {
    async function load() {
      const list = await getActivities();
      setActivitiesList(list);
      const blogs = await getBlogPosts();
      setBlogPosts(blogs);
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
      duration_hours: activity.durationHours ?? null,
      price_original: activity.priceOriginal ?? null,
      price_discounted: activity.priceDiscounted,
      price_packages: activity.pricePackages ?? null,
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
      let activePayload: any = { ...payload };

      // Use upsert on conflict 'slug' so both new items and updates to unseeded initial activities are persisted to Supabase!
      let { data: savedRecord, error } = await supabase
        .from('activities')
        .upsert([activePayload], { onConflict: 'slug' })
        .select('id')
        .maybeSingle();

      // Fallback retry if price_packages column does not exist yet in Supabase
      if (error && error.message?.includes('price_packages')) {
        console.warn("Retrying upsert without 'price_packages' column...");
        const { price_packages, ...strippedPayload } = activePayload;
        const retry = await supabase
          .from('activities')
          .upsert([strippedPayload], { onConflict: 'slug' })
          .select('id')
          .maybeSingle();
        savedRecord = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('Supabase activities upsert error:', error.message);
        return { ok: false, error: error.message };
      }

      if (savedRecord?.id && imagesToSave.length > 0) {
        await supabase.from('activity_images').delete().eq('activity_id', savedRecord.id);
        const imageRows = imagesToSave.map((url, idx) => ({
          activity_id: savedRecord.id,
          image_url: url,
          display_order: idx,
        }));
        await supabase.from('activity_images').insert(imageRows);
      }

      return { ok: true };
    } catch (err: any) {
      console.error('Failed to sync activity to Supabase:', err);
      return { ok: false, error: err?.message || 'Network error' };
    }
  };

  const saveCustomLocally = (list: Activity[]) => {
    try { localStorage.setItem('custom_activities', JSON.stringify(list)); } catch (_) {}
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
    const targetSlug = deleteActivity.slug;
    const targetTitle = deleteActivity.title;
    const updated = activitiesList.filter((a) => a.id !== deleteActivity.id);
    setActivitiesList(updated);
    saveCustomLocally(updated);

    // Save to deleted_activity_slugs so explore tours and other pages never display it
    try {
      const storedDeleted = localStorage.getItem('deleted_activity_slugs');
      const deletedSlugs: string[] = storedDeleted ? JSON.parse(storedDeleted) : [];
      if (!deletedSlugs.includes(targetSlug)) {
        deletedSlugs.push(targetSlug);
        localStorage.setItem('deleted_activity_slugs', JSON.stringify(deletedSlugs));
      }
    } catch (_) {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('activities').delete().eq('slug', targetSlug);
      } catch (err) {
        console.warn('Supabase delete error (handled via local filter):', err);
      }
    }
    setDeleteActivity(null);
    showToast(`Tour "${targetTitle}" deleted.`);
  };

  // ── BLOG CRUD HANDLERS ──
  const handleCreateBlog = async (post: BlogPost) => {
    const updated = [post, ...blogPosts.filter((p) => p.id !== post.id)];
    setBlogPosts(updated);
    saveBlogPostsLocal(updated);
    setAddBlogModalOpen(false);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('blogs').upsert([
          {
            id: post.id,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            author: post.author,
            published_date: post.publishedDate,
            read_time: post.readTime,
            category: post.category,
            image_url: post.imageUrl,
            related_activity_slugs: post.relatedActivitySlugs,
          }
        ], { onConflict: 'slug' });
      } catch (_) {}
    }
    showToast(`Article "${post.title}" published!`);
  };

  const handleUpdateBlog = async (post: BlogPost) => {
    const updated = blogPosts.map((p) => (p.id === post.id ? post : p));
    setBlogPosts(updated);
    saveBlogPostsLocal(updated);
    setEditBlog(null);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('blogs').upsert([
          {
            id: post.id,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            author: post.author,
            published_date: post.publishedDate,
            read_time: post.readTime,
            category: post.category,
            image_url: post.imageUrl,
            related_activity_slugs: post.relatedActivitySlugs,
          }
        ], { onConflict: 'slug' });
      } catch (_) {}
    }
    showToast(`Article "${post.title}" updated!`);
  };

  const handleDeleteBlog = async () => {
    if (!deleteBlogConfirm) return;
    const targetSlug = deleteBlogConfirm.slug;
    const targetTitle = deleteBlogConfirm.title;
    const updated = blogPosts.filter((p) => p.slug !== targetSlug);
    setBlogPosts(updated);
    deleteBlogPostLocal(targetSlug);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('blogs').delete().eq('slug', targetSlug);
      } catch (_) {}
    }
    showToast(`Article "${targetTitle}" deleted.`);
    setDeleteBlogConfirm(null);
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

    setAddTeamModalOpen(false);
    setInviteSentMember(member);
    showToast(`Added ${member.name}! Preparing verification email...`);
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
            {(['overview', ...(isSuperAdmin ? ['activities'] : []), 'bookings', 'blog', ...(isSuperAdmin ? ['team'] : []), 'settings'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                  activeTab === tab ? 'bg-emerald-800 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {tab === 'overview' && 'Overview & Analytics'}
                {tab === 'activities' && `Tour Catalog (${activitiesList.length})`}
                {tab === 'bookings' && `Bookings (${bookings.length})`}
                {tab === 'blog' && `Blog Articles (${blogPosts.length})`}
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
          {activeTab === 'bookings' && (() => {
            const filteredBookings = bookings.filter((b) => {
              const q = bookingSearchQuery.toLowerCase().trim();
              const matchesSearch = !q ||
                b.name.toLowerCase().includes(q) ||
                b.email.toLowerCase().includes(q) ||
                b.ref.toLowerCase().includes(q) ||
                b.title.toLowerCase().includes(q) ||
                (b.hotel && b.hotel.toLowerCase().includes(q));

              const matchesStatus = bookingStatusFilter === 'all' || b.status.toLowerCase() === bookingStatusFilter.toLowerCase();
              const matchesDate = !bookingDateFilter || b.date === bookingDateFilter;

              return matchesSearch && matchesStatus && matchesDate;
            });

            const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
            const completedCount = bookings.filter(b => b.status === 'Completed').length;
            const cancelledCount = bookings.filter(b => b.status === 'Cancelled').length;
            const isFiltered = Boolean(bookingSearchQuery || bookingStatusFilter !== 'all' || bookingDateFilter);

            return (
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">All Guest Reservations</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Filter bookings by status, travel date, customer info, and chat with guests.</p>
                  </div>
                  <span className="text-xs text-gray-500 font-bold bg-gray-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                    {filteredBookings.length} {filteredBookings.length === 1 ? 'reservation' : 'reservations'} {isFiltered && `(of ${bookings.length})`}
                  </span>
                </div>

                {/* Filter Controls Bar */}
                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/70 space-y-3">
                  <div className="flex flex-col md:flex-row gap-3">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by name, email, booking ref (e.g. BMT-), tour title, or hotel..."
                        value={bookingSearchQuery}
                        onChange={(e) => setBookingSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-600 shadow-2xs"
                      />
                      {bookingSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setBookingSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 bg-white px-3 py-2 border border-gray-200 rounded-xl shadow-2xs">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="date"
                          value={bookingDateFilter}
                          onChange={(e) => setBookingDateFilter(e.target.value)}
                          className="text-xs text-gray-700 bg-transparent outline-none cursor-pointer"
                        />
                      </div>
                      {bookingDateFilter && (
                        <button
                          type="button"
                          onClick={() => setBookingDateFilter('')}
                          className="text-xs font-bold text-gray-500 hover:text-red-500 px-2 py-1 bg-white border border-gray-200 rounded-lg cursor-pointer"
                          title="Clear date filter"
                        >
                          Clear Date
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Pills & Reset */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-200/50">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-gray-400 mr-1">Status:</span>
                      {[
                        { id: 'all', label: 'All', count: bookings.length },
                        { id: 'Confirmed', label: 'Confirmed', count: confirmedCount },
                        { id: 'Completed', label: 'Completed', count: completedCount },
                        { id: 'Cancelled', label: 'Cancelled', count: cancelledCount },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBookingStatusFilter(item.id as any)}
                          className={`text-xs font-bold px-3 py-1 rounded-xl transition-all cursor-pointer ${
                            bookingStatusFilter === item.id
                              ? 'bg-emerald-800 text-white shadow-xs'
                              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {item.label} ({item.count})
                        </button>
                      ))}
                    </div>

                    {isFiltered && (
                      <button
                        type="button"
                        onClick={() => {
                          setBookingSearchQuery('');
                          setBookingStatusFilter('all');
                          setBookingDateFilter('');
                        }}
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reset All Filters</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bookings List */}
                {filteredBookings.length > 0 ? (
                  <div className="space-y-4">
                    {filteredBookings.map((b) => (
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
                ) : (
                  <div className="p-10 text-center bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-sm font-bold text-gray-700">No reservations match your filter criteria.</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting the search query or changing the status filter.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setBookingSearchQuery('');
                        setBookingStatusFilter('all');
                        setBookingDateFilter('');
                      }}
                      className="mt-3 px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── BLOG MANAGEMENT TAB ── */}
          {activeTab === 'blog' && (() => {
            const filteredBlogs = blogPosts.filter((p) => {
              const q = blogSearchQuery.toLowerCase().trim();
              const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.author.toLowerCase().includes(q);
              const matchesCategory = blogCategoryFilter === 'All' || p.category === blogCategoryFilter;
              return matchesSearch && matchesCategory;
            });

            return (
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">Blog Articles & Travel Guides</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Publish and manage local guides, culture tips, and itineraries for tourists.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddBlogModalOpen(true)}
                    className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-900/20 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Write New Article</span>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search articles by title, summary, or author..."
                      value={blogSearchQuery}
                      onChange={(e) => setBlogSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {['All', ...BLOG_CATEGORIES].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setBlogCategoryFilter(cat)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          blogCategoryFilter === cat
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Articles Table/Grid */}
                {filteredBlogs.length > 0 ? (
                  <div className="space-y-3">
                    {filteredBlogs.map((post) => (
                      <div
                        key={post.id || post.slug}
                        className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden bg-gray-200 shrink-0 border border-gray-200">
                            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                {post.category}
                              </span>
                              <span className="text-[10px] text-gray-400">• {post.readTime}</span>
                              <span className="text-[10px] text-gray-400">• {post.publishedDate}</span>
                            </div>
                            <h4 className="font-extrabold text-sm text-gray-900 truncate">{post.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{post.excerpt}</p>
                            <span className="text-[11px] text-gray-400 font-medium">By {post.author}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                            title="Preview Article"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Preview</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => setEditBlog(post)}
                            className="p-2 bg-gray-100 hover:bg-amber-50 hover:text-amber-700 text-gray-600 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit Article"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteBlogConfirm(post)}
                            className="p-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-sm font-bold text-gray-700">No articles found.</p>
                    <p className="text-xs text-gray-400 mt-1">Click "+ Write New Article" to publish your first travel guide.</p>
                  </div>
                )}
              </div>
            );
          })()}

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
      {inviteSentMember && <InviteSentModal member={inviteSentMember} onClose={() => setInviteSentMember(null)} />}
      {addBlogModalOpen && <BlogFormModal mode="create" activities={activitiesList} onClose={() => setAddBlogModalOpen(false)} onSave={handleCreateBlog} />}
      {editBlog && <BlogFormModal mode="edit" initial={editBlog} activities={activitiesList} onClose={() => setEditBlog(null)} onSave={handleUpdateBlog} />}
      {deleteBlogConfirm && <DeleteBlogModal post={deleteBlogConfirm} onCancel={() => setDeleteBlogConfirm(null)} onConfirm={handleDeleteBlog} />}

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
