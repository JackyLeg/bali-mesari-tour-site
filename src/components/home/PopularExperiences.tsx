'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity } from '@/types';
import ActivityCard from '@/components/common/ActivityCard';
import { getActivities } from '@/lib/data';
import { ArrowRight, Sparkles } from 'lucide-react';

interface PopularExperiencesProps {
  activities: Activity[];
}

export default function PopularExperiences({ activities: initialActivities }: PopularExperiencesProps) {
  const [activitiesList, setActivitiesList] = useState<Activity[]>(initialActivities);

  useEffect(() => {
    async function loadActivities() {
      const list = await getActivities();
      setActivitiesList(list);
    }
    loadActivities();
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">
              <Sparkles className="w-4 h-4 fill-amber-400" />
              <span>Top Rated Experiences</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Popular Things to Do in Bali
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Handpicked activities loved by thousands of travelers this season.
            </p>
          </div>

          <Link 
            href="/activities" 
            className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-800 hover:text-emerald-950 mt-4 md:mt-0 group"
          >
            <span>Explore All Experiences</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Activity Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activitiesList.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>

      </div>
    </section>
  );
}
