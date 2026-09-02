'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Activity } from '@/types';
import { Star, Clock, MapPin, Heart, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const discountPercent = activity.priceOriginal
    ? Math.round(((activity.priceOriginal - activity.priceDiscounted) / activity.priceOriginal) * 100)
    : 0;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      
      {/* Thumbnail Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        <img
          src={activity.images[0]}
          alt={activity.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badge Tag */}
        {activity.badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm ${
              activity.badge === 'Likely to Sell Out'
                ? 'bg-rose-600 text-white'
                : activity.badge === 'Bestseller'
                ? 'bg-amber-500 text-emerald-950 font-extrabold'
                : activity.badge === 'Special Deal'
                ? 'bg-emerald-800 text-amber-300 font-extrabold'
                : 'bg-emerald-900/90 text-white'
            }`}>
              {activity.badge}
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-md flex items-center justify-center text-gray-700 hover:text-rose-500 transition-colors shadow-sm"
          aria-label="Wishlist activity"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Location Overlay */}
        <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1 text-[11px] font-semibold text-white bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span>{activity.locationName}</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        
        <div>
          {/* Rating & Reviews */}
          <div className="flex items-center gap-1.5 text-xs mb-1.5">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-bold text-gray-900">{activity.rating}</span>
            <span className="text-gray-400">({activity.reviewCount.toLocaleString()})</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500 text-[11px] font-medium">{activity.travelerType}</span>
          </div>

          {/* Activity Title */}
          <Link href={`/activities/${activity.slug}`}>
            <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-emerald-800 transition-colors mb-2">
              {activity.title}
            </h3>
          </Link>

          {/* Key Quick Attributes */}
          <div className="flex items-center gap-3 text-[11px] font-medium text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-700" />
              <span>{activity.durationHours} hrs</span>
            </div>
            {activity.pickupAvailable && (
              <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Pickup Available</span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">From</span>
            <div className="flex items-baseline gap-1.5">
              {activity.priceOriginal && (
                <span className="text-xs text-gray-400 line-through font-medium">
                  ${activity.priceOriginal}
                </span>
              )}
              <span className="text-lg font-extrabold text-emerald-900">
                ${activity.priceDiscounted}
              </span>
              <span className="text-[11px] text-gray-500">/ person</span>
            </div>
          </div>

          <Link
            href={`/activities/${activity.slug}`}
            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm group-hover:shadow"
          >
            Book Now
          </Link>
        </div>

      </div>

    </div>
  );
}
