'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ActivityCard from '@/components/common/ActivityCard';
import { Activity, Destination } from '@/types';
import { getDestinations, getActivities } from '@/lib/data';
import { MapPin, Compass, Sparkles, CheckCircle2 } from 'lucide-react';

export default function DestinationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [destination, setDestination] = useState<Destination | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const allDests = await getDestinations();
      const match = allDests.find((d) => d.slug === slug) || null;
      setDestination(match);

      if (match) {
        const allActs = await getActivities({ destinationSlug: match.slug });
        setActivities(allActs);
      }
      setLoading(false);
    }
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Header />
        <div className="flex-grow flex items-center justify-center py-32 text-gray-400 font-bold text-sm">
          Loading destination...
        </div>
        <Footer />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Header />
        <div className="flex-grow text-center py-32 px-4">
          <h1 className="text-2xl font-bold text-gray-800">Destination Not Found</h1>
          <p className="text-gray-500 text-sm mt-2">The requested Bali destination is not listed.</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-2.5 bg-emerald-800 text-white font-bold rounded-xl text-xs"
          >
            Back Home
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-20">
        
        {/* Destination Hero Banner */}
        <div className="relative py-24 px-4 sm:px-6 lg:px-8 bg-emerald-950 text-white overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 scale-105"
            style={{ backgroundImage: `url('${destination.imageUrl}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/60 to-black/30" />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-300 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20 mb-4 backdrop-blur-sm">
              <MapPin className="w-3.5 h-3.5" />
              {destination.name}, Bali
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Things to Do in {destination.name}
            </h1>
            <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
              {destination.description}
            </p>
          </div>
        </div>

        {/* Product Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                Top Experiences in {destination.name}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Showing {activities.length} tours and activities in {destination.name}
              </p>
            </div>
          </div>

          {activities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((act) => (
                <ActivityCard key={act.id} activity={act} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
              <Compass className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900">More Tours Coming Soon</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-6">
                We are adding new local tour operators in {destination.name}. Browse all Bali tours in the meantime.
              </p>
              <button 
                onClick={() => router.push('/activities')}
                className="px-5 py-2.5 bg-emerald-800 text-white text-xs font-bold rounded-xl"
              >
                Browse All Bali Activities
              </button>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
