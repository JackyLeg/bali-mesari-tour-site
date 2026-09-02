import React from 'react';
import Link from 'next/link';
import { Destination } from '@/types';
import { MapPin, ArrowRight } from 'lucide-react';

interface DestinationSectionProps {
  destinations: Destination[];
}

export default function DestinationSection({ destinations }: DestinationSectionProps) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block mb-1">
              Island Regions
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Explore Bali by Destination
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose your favorite region from rainforest sanctuaries to cliffside waves.
            </p>
          </div>
        </div>

        {/* Destination Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <Link
              key={dest.id}
              href={`/destinations/${dest.slug}`}
              className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 bg-emerald-950 aspect-[16/10] flex flex-col justify-end p-6 border border-gray-100"
            >
              {/* Background Photo */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${dest.imageUrl}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-black/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />

              {/* Card Content */}
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{dest.experienceCount}+ Tours Available</span>
                </div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                  {dest.name}
                </h3>
                <p className="text-xs text-emerald-100/80 font-medium line-clamp-2 mt-1 mb-3">
                  {dest.description}
                </p>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl group-hover:bg-amber-400 group-hover:text-emerald-950 transition-all">
                  <span>Explore {dest.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
