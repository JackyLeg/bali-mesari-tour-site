import React from 'react';
import Link from 'next/link';
import { Heart, Users, Flame, Compass, Crown } from 'lucide-react';

export default function TravelerTypes() {
  const types = [
    {
      id: 'couples',
      title: 'For Couples & Honeymooners',
      subtitle: 'Romantic sunset cruises, private candlelit beach dinners, couples spa',
      icon: Heart,
      color: 'bg-rose-50 border-rose-100 text-rose-600',
      tag: 'Couples'
    },
    {
      id: 'families',
      title: 'For Families with Kids',
      subtitle: 'Safe rafting, water parks, monkey sanctuaries, and cultural shows',
      icon: Users,
      color: 'bg-blue-50 border-blue-100 text-blue-600',
      tag: 'Families'
    },
    {
      id: 'adventure',
      title: 'For Thrill & Adventure Seekers',
      subtitle: 'Volcano sunrise trekking, ATV quad biking, manta ray snorkeling',
      icon: Flame,
      color: 'bg-amber-50 border-amber-100 text-amber-600',
      tag: 'Adventure'
    },
    {
      id: 'culture',
      title: 'For Culture & Heritage Lovers',
      subtitle: 'Sacred water blessings, temple architecture, traditional woodcarving',
      icon: Compass,
      color: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      tag: 'Culture'
    },
  ];

  return (
    <section className="py-16 bg-white border-t border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block mb-1">
            Personalized Discovery
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Bali for Every Traveler Style
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Whether you are traveling as a couple, with family, or seeking high adrenaline, we match your travel vibe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {types.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={`/activities?travelerType=${item.tag}`}
                className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl ${item.color} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-800 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center text-xs font-bold text-emerald-800 group-hover:text-emerald-950">
                  <span>Browse Experiences →</span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
