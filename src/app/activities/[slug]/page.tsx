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
  Info,
  MessageSquarePlus,
  X
} from 'lucide-react';
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

  const totalPrice = activity.priceDiscounted * participants;

  const handleBookNow = () => {
    const bookingParams = new URLSearchParams({
      activityId: activity.id,
      activityTitle: activity.title,
      slug: activity.slug,
      date: selectedDate,
      participants: participants.toString(),
      pricePerPerson: activity.priceDiscounted.toString(),
      totalPrice: totalPrice.toString(),
      pickup: includePickup ? 'yes' : 'no'
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

        {/* Hero Gallery Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 rounded-3xl overflow-hidden shadow-lg aspect-[16/9] lg:aspect-[21/9]">
            <div className="lg:col-span-2 relative h-full bg-gray-200">
              <img 
                src={activity.images[0]} 
                alt={activity.title}
                className="w-full h-full object-cover"
              />
              {activity.badge && (
                <div className="absolute top-4 left-4">
                  <span className="text-xs font-extrabold px-3 py-1.5 rounded-full bg-amber-400 text-emerald-950 shadow-md">
                    {activity.badge}
                  </span>
                </div>
              )}
            </div>

            <div className="hidden lg:grid grid-rows-2 gap-3 h-full">
              <div className="relative h-full bg-gray-200 overflow-hidden">
                <img 
                  src={activity.images[1] || activity.images[0]} 
                  alt={activity.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative h-full bg-gray-200 overflow-hidden">
                <img 
                  src={activity.images[2] || activity.images[0]} 
                  alt={activity.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
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
                    <span>Duration: {activity.durationHours} Hours</span>
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
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">Starting From</span>
                    <div className="flex items-baseline gap-2">
                      {activity.priceOriginal && (
                        <span className="text-sm text-gray-400 line-through font-medium">
                          ${activity.priceOriginal}
                        </span>
                      )}
                      <span className="text-3xl font-extrabold text-emerald-900">
                        ${activity.priceDiscounted}
                      </span>
                      <span className="text-xs text-gray-500">/ person</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Best Price Guarantee
                  </span>
                </div>

                {/* Booking Options Form */}
                <div className="space-y-4">
                  
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
                    <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Number of Participants</span>
                    </label>
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-2">
                      <span className="text-xs font-semibold text-gray-800 ml-2">Guests</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setParticipants(Math.max(1, participants - 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 flex items-center justify-center text-sm"
                        >
                          -
                        </button>
                        <span className="text-sm font-extrabold text-gray-900 w-4 text-center">{participants}</span>
                        <button
                          type="button"
                          onClick={() => setParticipants(participants + 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 flex items-center justify-center text-sm"
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
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600">Total Price</span>
                  <span className="text-2xl font-extrabold text-emerald-900">${totalPrice}</span>
                </div>

                {/* Primary CTA */}
                <button
                  onClick={handleBookNow}
                  className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
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
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Total ({participants} guests)</span>
          <span className="text-xl font-extrabold text-emerald-900">${totalPrice}</span>
        </div>
        <button
          onClick={handleBookNow}
          className="px-6 py-3 bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md"
        >
          Book Now
        </button>
      </div>

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
