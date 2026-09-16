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
  Info
} from 'lucide-react';

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
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">Verified Traveler Reviews</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{reviews.length} authentic ratings from recent guests</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-gray-900">{activity.rating}</span>
                    <span className="text-xs text-gray-400"> / 5.0</span>
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

      <Footer />
    </div>
  );
}
