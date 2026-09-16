import React from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getDestinations } from '@/lib/data';
import { MapPin, ArrowRight, Compass } from 'lucide-react';

export default async function DestinationsPage() {
  const destinations = await getDestinations();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-24 pb-20">

        {/* Banner */}
        <div className="bg-emerald-950 text-white py-12 px-4 sm:px-6 lg:px-8 mb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
              <Compass className="w-4 h-4" />
              <span>Explore By Location</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
              Bali Destinations
            </h1>
            <p className="text-emerald-200/80 text-sm max-w-xl">
              From sacred jungle temples to dramatic ocean cliffs — explore Bali's most iconic regions and find the perfect tour for you.
            </p>
          </div>
        </div>

        {/* Destination Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((dest) => (
              <Link
                key={dest.id}
                href={`/destinations/${dest.slug}`}
                className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 bg-gray-200 aspect-[4/3] flex flex-col justify-end"
              >
                {/* Background Image */}
                <img
                  src={dest.imageUrl}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/40 to-transparent" />

                {/* Featured Badge */}
                {dest.isFeatured && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-400 text-emerald-950 shadow-md">
                      Featured
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="relative z-10 p-6">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{dest.experienceCount}+ Experiences</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">{dest.name}</h2>
                  <p className="text-emerald-200/80 text-xs font-medium mt-1 mb-4 line-clamp-2">
                    {dest.tagline}
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 transition-colors">
                    <span>Explore Tours</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
