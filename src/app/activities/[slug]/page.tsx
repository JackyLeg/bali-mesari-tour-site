'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ActivityCard from '@/components/common/ActivityCard';
import { Activity, Review } from '@/types';
import { getActivityBySlug, getActivities, getReviewsForActivity } from '@/lib/data';
import { 
  Star, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  PhoneCall, 
  Share2, 
  Heart,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Info,
  MessageSquarePlus,
  X
} from 'lucide-react';
import { useCurrency } from '@/lib/currency';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

function WriteReviewModal({
  activityId,
  activityTitle,
  defaultUserName = '',
  defaultBookingRef = '',
  onClose,
  onReviewSubmitted,
}: {
  activityId: string;
  activityTitle: string;
  defaultUserName?: string;
  defaultBookingRef?: string;
  onClose: () => void;
  onReviewSubmitted: (newReview: Review) => void;
}) {
  const [userName, setUserName] = useState(defaultUserName);
  const [userCountry, setUserCountry] = useState('Indonesia');
  const [travelerType, setTravelerType] = useState('Couple');
  const [bookingRef, setBookingRef] = useState(defaultBookingRef);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const reviewPayload = {
      activity_id: activityId,
      user_name: userName.trim() || 'Verified Guest',
      user_country: userCountry.trim() || 'Traveler',
      rating,
      comment: comment.trim(),
      traveler_type: travelerType,
    };

    let newReviewId = `rev-${Date.now()}`;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .insert([reviewPayload])
          .select('id')
          .maybeSingle();

        if (!error && data?.id) {
          newReviewId = data.id;
        }
      } catch (err) {
        console.error('Supabase review insert error:', err);
      }
    }

    const createdReview: Review = {
      id: newReviewId,
      activityId,
      userName: reviewPayload.user_name,
      userCountry: reviewPayload.user_country,
      rating,
      comment: reviewPayload.comment,
      date: new Date().toISOString().split('T')[0],
      travelerType: travelerType as any,
    };

    onReviewSubmitted(createdReview);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block mb-1">Customer Feedback</span>
          <h3 className="text-xl font-extrabold text-gray-900">Write a Review</h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{activityTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-gray-700">
          <div>
            <label className="font-bold text-gray-900 block mb-1.5">Your Overall Rating *</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${(hoverRating ?? rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-gray-600 ml-2">
                {rating === 5 ? 'Exceptional (5/5)' : rating === 4 ? 'Very Good (4/5)' : rating === 3 ? 'Good (3/5)' : `${rating}/5`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-900 block mb-1">Your Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-emerald-600 text-gray-900 font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-gray-900 block mb-1">Country of Origin *</label>
              <input
                type="text"
                required
                placeholder="e.g. Australia, Germany, USA"
                value={userCountry}
                onChange={(e) => setUserCountry(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-emerald-600 text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-900 block mb-1">Traveler Type</label>
              <select
                value={travelerType}
                onChange={(e) => setTravelerType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-emerald-600 text-gray-800 cursor-pointer"
              >
                <option value="Couple">Couple</option>
                <option value="Family">Family with Kids</option>
                <option value="Solo">Solo Traveler</option>
                <option value="Friends">Group of Friends</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-gray-900 block mb-1">Booking Ref <span className="font-normal text-gray-400">(Optional)</span></label>
              <input
                type="text"
                placeholder="e.g. BMT-849201"
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-emerald-600 text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-900 block mb-1">Your Review & Experience *</label>
            <textarea
              rows={4}
              required
              placeholder="Tell other travelers about your tour experience, guide, scenery, and tips..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-emerald-600 leading-relaxed text-gray-900"
            />
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
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Verified Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarActivities, setSimilarActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Currency & Formatter
  const { format, currency } = useCurrency();

  // Carousel & Lightbox State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Selected Package Tier State
  const [selectedPackageIndex, setSelectedPackageIndex] = useState<number>(0);

  // Booking Widget State
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [participants, setParticipants] = useState<number>(2);
  const [includePickup, setIncludePickup] = useState<boolean>(true);

  // Share state
  const [shareCopied, setShareCopied] = useState(false);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [initialReviewName, setInitialReviewName] = useState('');
  const [initialReviewRef, setInitialReviewRef] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      if (search.get('review') === 'true' || search.get('action') === 'review') {
        const prefillName = search.get('name') || '';
        const prefillRef = search.get('ref') || '';
        if (prefillName) setInitialReviewName(prefillName);
        if (prefillRef) setInitialReviewRef(prefillRef);
        setReviewModalOpen(true);
      }
    }
  }, []);

  const handleReviewSubmitted = (newReview: Review) => {
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);

    // Recalculate average rating
    const avg = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
    if (activity) {
      setActivity({
        ...activity,
        rating: Number(avg.toFixed(1)),
        reviewCount: (activity.reviewCount || 0) + 1,
      });
    }

    setToastMsg('Thank you! Your verified traveler review has been published.');
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const act = await getActivityBySlug(slug);
      if (act) {
        setActivity(act);
        const [revs, allActs] = await Promise.all([
          getReviewsForActivity(act.id),
          getActivities(),
        ]);
        setReviews(revs);
        setSimilarActivities(allActs.filter((a) => a.id !== act.id).slice(0, 3));
      }
      setLoading(false);
    }
    loadData();
    // Default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Header />
        <div className="flex-grow flex items-center justify-center py-32 text-gray-400 font-bold text-sm">
          Loading tour details...
        </div>
        <Footer />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Header />
        <div className="flex-grow text-center py-32 px-4">
          <h1 className="text-2xl font-bold text-gray-800">Activity Not Found</h1>
          <p className="text-gray-500 text-sm mt-2">The tour experience you are looking for may have been updated.</p>
          <button 
            onClick={() => router.push('/activities')}
            className="mt-6 px-6 py-2.5 bg-emerald-800 text-white font-bold rounded-xl text-xs"
          >
            Back to Marketplace
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const images = (activity.images && activity.images.length > 0)
    ? activity.images
    : ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80'];

  const hasPackages = Boolean(activity.pricePackages && activity.pricePackages.length > 0);
  const currentPackage = hasPackages && activity.pricePackages
    ? (activity.pricePackages[selectedPackageIndex] || activity.pricePackages[0])
    : null;

  const unitPrice = currentPackage ? currentPackage.price : activity.priceDiscounted;
  const isFlatPrice = currentPackage
    ? (currentPackage.unit.includes('car') || currentPackage.unit.includes('group') || currentPackage.unit.includes('boat'))
    : false;
  const totalPrice = isFlatPrice ? unitPrice : (unitPrice * participants);

  const handleBookNow = () => {
    const bookingParams = new URLSearchParams({
      activityId: activity.id,
      activityTitle: activity.title,
      slug: activity.slug,
      date: selectedDate,
      participants: participants.toString(),
      pricePerPerson: unitPrice.toString(),
      totalPrice: totalPrice.toString(),
      pickup: includePickup ? 'yes' : 'no',
      ...(currentPackage ? {
        packageName: currentPackage.name,
        packageDescription: currentPackage.description || '',
        packageUnit: currentPackage.unit || '/ person',
      } : {}),
    });
    router.push(`/checkout?${bookingParams.toString()}`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = { title: activity.title, text: activity.shortDescription, url };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      }
    } catch (_) {
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        
        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <button onClick={() => router.push('/')} className="hover:text-emerald-800">Home</button>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => router.push('/activities')} className="hover:text-emerald-800">Activities</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 font-bold truncate max-w-xs">{activity.title}</span>
          </div>
        </div>

        {/* Interactive Image Showcase & Carousel */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 border border-neutral-800">
            
            {/* Ambient Blurred Background (matches current picture tone) */}
            <div 
              className="absolute inset-0 bg-cover bg-center blur-2xl opacity-25 scale-110 pointer-events-none transition-all duration-700"
              style={{ backgroundImage: `url(${images[currentImageIndex]})` }}
            />

            {/* Main Image Display Stage (object-contain ensures original uncropped aspect ratio) */}
            <div className="relative z-10 w-full flex items-center justify-center min-h-[340px] sm:min-h-[440px] lg:min-h-[500px] max-h-[560px] p-2 sm:p-4">
              <img 
                src={images[currentImageIndex]} 
                alt={`${activity.title} - Photo ${currentImageIndex + 1}`}
                onClick={() => setLightboxOpen(true)}
                className="max-h-[320px] sm:max-h-[420px] lg:max-h-[480px] w-auto max-w-full object-contain mx-auto rounded-2xl shadow-xl transition-all duration-300 cursor-zoom-in hover:brightness-105"
              />

              {/* Badge Overlay */}
              {activity.badge && (
                <div className="absolute top-4 left-4 z-20">
                  <span className="text-xs font-extrabold px-3 py-1.5 rounded-full bg-amber-400 text-emerald-950 shadow-lg">
                    {activity.badge}
                  </span>
                </div>
              )}

              {/* Top Right Controls: Photo Counter & Fullscreen Lightbox Button */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-md">
                  📷 {currentImageIndex + 1} / {images.length}
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-md border border-white/20 transition-all hover:scale-105 cursor-pointer"
                  title="View full natural photo"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Carousel Previous & Next Controls (shown if > 1 image) */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                    className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Navigation Strip (for all images, especially when 3 or more) */}
            {images.length > 1 && (
              <div className="relative z-10 bg-black/40 backdrop-blur-md border-t border-white/10 px-4 py-3">
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 max-w-full scrollbar-thin">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative shrink-0 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
                        currentImageIndex === idx 
                          ? 'ring-3 ring-amber-400 scale-105 opacity-100 shadow-md' 
                          : 'opacity-50 hover:opacity-100 hover:scale-102 ring-1 ring-white/20'
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-16 h-12 sm:w-20 sm:h-14 object-cover" 
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Title + Main Content + Sticky Booking Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Main Details Column */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Product Header */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>{activity.locationName}</span>
                  <span className="text-gray-300">•</span>
                  <span>{activity.travelerType} Preference</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug mb-3">
                    {activity.title}
                  </h1>
                  <button
                    onClick={handleShare}
                    title="Share this tour"
                    className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 px-3 py-2 rounded-xl transition-colors mt-1"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{shareCopied ? 'Link Copied!' : 'Share'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-700 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-1">
                    <div className="flex text-amber-400">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                    <span className="text-sm font-extrabold">{activity.rating}</span>
                    <span className="text-gray-400">({activity.reviewCount.toLocaleString()} reviews)</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <span>
                      {activity.durationHours && activity.durationHours > 0 
                        ? `Duration: ${activity.durationHours} Hours` 
                        : 'Duration: Flexible / Custom'}
                    </span>
                  </div>

                  {activity.pickupAvailable && (
                    <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Hotel Pickup Included</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Highlights */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Experience Highlights</span>
                </h3>
                <ul className="space-y-3">
                  {activity.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm font-medium text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Description */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-base font-extrabold text-gray-900 mb-3">Full Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {activity.fullDescription}
                </p>
              </div>

              {/* Itinerary Timeline */}
              {activity.itinerary && activity.itinerary.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="text-base font-extrabold text-gray-900 mb-6">Itinerary Schedule</h3>
                  <div className="relative pl-6 border-l-2 border-emerald-100 space-y-6">
                    {activity.itinerary.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-700 ring-4 ring-white" />
                        <span className="text-xs font-bold text-amber-600 block mb-0.5">{step.time}</span>
                        <h4 className="text-sm font-bold text-gray-900">{step.title}</h4>
                        {step.description && (
                          <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                  <h4 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>What’s Included</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-600">
                    {activity.included.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>Not Included</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-600">
                    {activity.notIncluded.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Reviews Breakdown */}
              <div id="reviews" className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">Verified Traveler Reviews</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{reviews.length} authentic ratings from recent guests</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setReviewModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      <MessageSquarePlus className="w-4 h-4 text-emerald-700" />
                      <span>Write a Review</span>
                    </button>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-gray-900">{activity.rating}</span>
                      <span className="text-xs text-gray-400"> / 5.0</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-bold text-xs text-gray-900 block">{rev.userName}</span>
                          <span className="text-[11px] text-gray-400">{rev.userCountry} • {rev.travelerType}</span>
                        </div>
                        <div className="flex text-amber-400 text-xs">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed font-medium">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Sticky Booking Widget (Desktop) */}
            <aside className="lg:col-span-4">
              <div className="sticky top-28 bg-white p-6 rounded-3xl border border-gray-100 shadow-xl space-y-6">
                
                {/* Price Display */}
                <div className="flex items-baseline justify-between pb-4 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      {currentPackage ? 'Selected Package Rate' : 'Starting From'}
                    </span>
                    <div className="flex items-baseline gap-2">
                      {!currentPackage && activity.priceOriginal && (
                        <span className="text-sm text-gray-400 line-through font-medium">
                          {format(activity.priceOriginal)}
                        </span>
                      )}
                      <span className="text-3xl font-extrabold text-emerald-900">
                        {format(unitPrice)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {currentPackage ? currentPackage.unit : '/ person'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Best Price Guarantee
                  </span>
                </div>

                {/* Booking Options Form */}
                <div className="space-y-4">
                  
                  {/* Select Package (when admin lists multiple packages) */}
                  {hasPackages && activity.pricePackages && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Choose Tour Package</span>
                        </label>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {activity.pricePackages.length} Packages Available
                        </span>
                      </div>

                      <div className="space-y-2">
                        {activity.pricePackages.map((pkg, idx) => {
                          const isSelected = selectedPackageIndex === idx;
                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedPackageIndex(idx)}
                              className={`p-3 rounded-2xl border-2 transition-all cursor-pointer relative ${
                                isSelected
                                  ? 'border-emerald-700 bg-emerald-50/70 shadow-sm'
                                  : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50/50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5">
                                  <div className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border transition-all shrink-0 ${
                                    isSelected ? 'border-emerald-700 bg-emerald-700' : 'border-gray-400 bg-white'
                                  }`}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  <div>
                                    <span className={`text-xs font-bold block leading-tight ${isSelected ? 'text-emerald-950 font-extrabold' : 'text-gray-800'}`}>
                                      {pkg.name}
                                    </span>
                                    {pkg.description && (
                                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                                        {pkg.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className={`text-sm font-extrabold block ${isSelected ? 'text-emerald-800' : 'text-gray-900'}`}>
                                    {format(pkg.price)}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-semibold block">
                                    {pkg.unit || '/ person'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Select Date */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Select Travel Date</span>
                    </label>
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Select Participants */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Number of Participants</span>
                      </label>
                      {isFlatPrice && (
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          (Price covers whole group/car)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-2">
                      <span className="text-xs font-semibold text-gray-800 ml-2">Guests</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setParticipants(Math.max(1, participants - 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 flex items-center justify-center text-sm cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-sm font-extrabold text-gray-900 w-4 text-center">{participants}</span>
                        <button
                          type="button"
                          onClick={() => setParticipants(participants + 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 flex items-center justify-center text-sm cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pickup Option */}
                  {activity.pickupAvailable && (
                    <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-emerald-900 block">Hotel Pickup & Return</span>
                        <span className="text-[11px] text-emerald-700">Free from major tourist zones</span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={includePickup}
                        onChange={(e) => setIncludePickup(e.target.checked)}
                        className="w-4 h-4 accent-emerald-700 cursor-pointer"
                      />
                    </div>
                  )}

                </div>

                {/* Total Summary */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-600 block">Total Price</span>
                      <span className="text-[11px] text-gray-400">
                        {isFlatPrice 
                          ? `Flat package rate (${participants} guest${participants > 1 ? 's' : ''})`
                          : `Calculated for ${participants} guest${participants > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <span className="text-2xl font-extrabold text-emerald-900">
                      {format(totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Primary CTA */}
                <button
                  onClick={handleBookNow}
                  className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  Book Experience Now
                </button>

                {/* Trust Points */}
                <div className="space-y-2 text-[11px] font-medium text-gray-500 pt-2">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Free cancellation up to 24h prior</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5 text-amber-500" />
                    <span>Instant WhatsApp confirmation voucher</span>
                  </div>
                </div>

              </div>
            </aside>

          </div>
        </div>

        {/* Similar Experiences Section */}
        {similarActivities.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-gray-200">
            <h3 className="text-xl font-extrabold text-gray-900 mb-6">You May Also Like</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarActivities.map((act) => (
                <ActivityCard key={act.id} activity={act} />
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Mobile Sticky Bottom CTA Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-4 shadow-2xl flex items-center justify-between">
        <div className="max-w-[65%]">
          <span className="text-[10px] uppercase font-bold text-gray-400 block truncate">
            {currentPackage ? currentPackage.name : `Total (${participants} guests)`}
          </span>
          <span className="text-xl font-extrabold text-emerald-900">
            {format(totalPrice)}
          </span>
        </div>
        <button
          onClick={handleBookNow}
          className="px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
        >
          Book Now
        </button>
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white max-w-7xl mx-auto w-full pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-300">
                Photo {currentImageIndex + 1} of {images.length}
              </span>
              <span className="text-xs text-amber-400 font-semibold">• Natural Aspect Ratio</span>
            </div>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Image Stage */}
          <div className="relative flex-grow flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
            <img 
              src={images[currentImageIndex]} 
              alt={activity.title}
              className="max-h-[80vh] max-w-[95vw] object-contain rounded-2xl shadow-2xl select-none"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  aria-label="Next"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Footer Thumbnails */}
          {images.length > 1 && (
            <div className="max-w-4xl mx-auto w-full pb-2 overflow-x-auto flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative shrink-0 rounded-lg overflow-hidden transition-all cursor-pointer ${
                    currentImageIndex === idx ? 'ring-2 ring-amber-400 scale-105 opacity-100' : 'opacity-40 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-12 h-9 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {reviewModalOpen && activity && (
        <WriteReviewModal
          activityId={activity.id}
          activityTitle={activity.title}
          defaultUserName={initialReviewName}
          defaultBookingRef={initialReviewRef}
          onClose={() => setReviewModalOpen(false)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      <Footer />
    </div>
  );
}
