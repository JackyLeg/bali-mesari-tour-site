import React from 'react';
import { ShieldCheck, PhoneCall, HeartHandshake, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LocalAdvantage() {
  const advantages = [
    {
      title: 'Direct Local Bali Operators',
      description: 'Zero intermediary markups. You book directly with local Balinese drivers, boat captains, and certified mountain guides.',
      icon: HeartHandshake,
    },
    {
      title: '24/7 WhatsApp Local Concierge',
      description: 'Need a last-minute schedule change or hotel pickup adjustment? Our team in Bali is available 24/7 on WhatsApp.',
      icon: PhoneCall,
    },
    {
      title: 'Customizable Private Itineraries',
      description: 'Unlike rigid mass tour buses, our private drivers customize stops based on your pace, photos, and preferences.',
      icon: MapPin,
    },
    {
      title: '100% Guaranteed Cancellation Protection',
      description: 'Plans change? Cancel up to 24 hours in advance for a full instant refund with zero hidden cancellation fees.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="py-20 bg-emerald-900 text-white relative overflow-hidden">
      
      {/* Background Decorative Accents */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-800/40 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading & Copy */}
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 bg-emerald-950/80 px-3.5 py-1.5 rounded-full border border-emerald-700/60 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              The Bali Mesari Difference
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Experience Bali Like a Local, Not a Tourist
            </h2>
            <p className="text-emerald-100/90 text-sm leading-relaxed mb-6">
              Global online travel agencies treat Bali as just another pin on the map. We live here, know the secret waterfalls, know when the temples are quietest, and ensure your money stays in the local Balinese community.
            </p>

            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-extrabold text-xl shrink-0">
                🌴
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-300">100% Balinese Owned & Managed</p>
                <p className="text-emerald-200/80 mt-0.5">Supporting local families across Ubud, Penida, & Kintamani.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Grid of 4 Core Values */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {advantages.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className="bg-emerald-950/80 border border-emerald-800/80 p-6 rounded-3xl backdrop-blur-sm hover:border-amber-400/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-emerald-200/80 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
