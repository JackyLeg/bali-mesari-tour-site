'use client';

import React from 'react';
import Link from 'next/link';
import { Category } from '@/types';
import { Compass, Waves, Landmark, Car, Sparkles, Utensils, ArrowRight } from 'lucide-react';

interface CategoryGridProps {
  categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass': return <Compass className="w-5 h-5" />;
      case 'Waves': return <Waves className="w-5 h-5" />;
      case 'Landmark': return <Landmark className="w-5 h-5" />;
      case 'Car': return <Car className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Utensils': return <Utensils className="w-5 h-5" />;
      default: return <Compass className="w-5 h-5" />;
    }
  };

  return (
    <section className="py-16 bg-sand-brand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block mb-1">
              Curated Collections
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Explore Bali by Category
            </h2>
          </div>
          <Link 
            href="/activities" 
            className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-800 hover:text-emerald-950 mt-3 md:mt-0 group"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/activities?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-white border border-gray-100 flex flex-col h-48"
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url('${cat.imageUrl}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Card Overlay Content */}
              <div className="relative z-10 p-4 mt-auto flex flex-col justify-end">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center mb-2 shadow-sm">
                  {getIcon(cat.iconName)}
                </div>
                <h3 className="text-sm font-bold text-white leading-snug group-hover:text-amber-300 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] font-medium text-emerald-200/90 mt-0.5">
                  {cat.experienceCount}+ Experiences
                </p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
