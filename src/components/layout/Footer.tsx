import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Sparkles, 
  PhoneCall, 
  Mail, 
  Heart,
  Award,
  CheckCircle2
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-emerald-950 text-white pt-16 pb-8 border-t border-emerald-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trust Badges Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-emerald-800/60 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/80 border border-emerald-700 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-300">Verified Local Guides</h4>
              <p className="text-xs text-emerald-200/80 mt-0.5">Licensed & local Balinese experts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/80 border border-emerald-700 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-300">Flexible Cancellation</h4>
              <p className="text-xs text-emerald-200/80 mt-0.5">Full refund up to 24h before</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/80 border border-emerald-700 flex items-center justify-center text-amber-400 shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-300">24/7 Local Support</h4>
              <p className="text-xs text-emerald-200/80 mt-0.5">Instant WhatsApp assist in Bali</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/80 border border-emerald-700 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-300">Best Price Guarantee</h4>
              <p className="text-xs text-emerald-200/80 mt-0.5">Direct local operator rates</p>
            </div>
          </div>
        </div>

        {/* Navigation & Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-400 flex items-center justify-center font-bold text-xl">
                🌴
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                Bali Mesari <span className="text-amber-400">Tour</span>
              </span>
            </Link>
            <p className="text-emerald-200/80 text-sm leading-relaxed mb-6 max-w-sm">
              Discover authentic Bali experiences crafted by local experts. From volcano sunrise treks to island cruises, we bring you the heart of Bali.
            </p>

            <div className="flex items-center gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-emerald-900 hover:bg-amber-400 hover:text-emerald-950 flex items-center justify-center transition-colors text-emerald-200 text-xs font-bold">
                IG
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-emerald-900 hover:bg-amber-400 hover:text-emerald-950 flex items-center justify-center transition-colors text-emerald-200 text-xs font-bold">
                FB
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-emerald-900 hover:bg-amber-400 hover:text-emerald-950 flex items-center justify-center transition-colors text-emerald-200 text-xs font-bold">
                YT
              </a>
            </div>
          </div>

          {/* Popular Destinations */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4">
              Destinations
            </h3>
            <ul className="space-y-2.5 text-sm text-emerald-200/80">
              <li><Link href="/destinations/ubud" className="hover:text-white transition-colors">Ubud Tours</Link></li>
              <li><Link href="/destinations/nusa-penida" className="hover:text-white transition-colors">Nusa Penida</Link></li>
              <li><Link href="/destinations/uluwatu" className="hover:text-white transition-colors">Uluwatu Temple</Link></li>
              <li><Link href="/destinations/mount-batur" className="hover:text-white transition-colors">Mount Batur</Link></li>
              <li><Link href="/destinations/canggu" className="hover:text-white transition-colors">Canggu & Seminyak</Link></li>
              <li><Link href="/destinations/nusa-lembongan" className="hover:text-white transition-colors">Nusa Lembongan</Link></li>
            </ul>
          </div>

          {/* Activity Categories */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4">
              Top Categories
            </h3>
            <ul className="space-y-2.5 text-sm text-emerald-200/80">
              <li><Link href="/activities?category=adventure" className="hover:text-white transition-colors">ATV & Volcano Treks</Link></li>
              <li><Link href="/activities?category=water-sports" className="hover:text-white transition-colors">Manta Ray Snorkeling</Link></li>
              <li><Link href="/activities?category=culture" className="hover:text-white transition-colors">Kecak Dance & Temples</Link></li>
              <li><Link href="/activities?category=day-trips" className="hover:text-white transition-colors">Private Car Drivers</Link></li>
              <li><Link href="/activities?category=wellness" className="hover:text-white transition-colors">Balinese Spa Retreats</Link></li>
              <li><Link href="/activities?category=food-culinary" className="hover:text-white transition-colors">Cooking Masterclasses</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4">
              Help & Support
            </h3>
            <ul className="space-y-2.5 text-sm text-emerald-200/80">
              <li><a href="https://wa.me/6281234567890" className="hover:text-white transition-colors flex items-center gap-1.5"><PhoneCall className="w-3.5 h-3.5 text-amber-400" /> WhatsApp Direct</a></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Bali Travel FAQ</Link></li>
              <li><Link href="/checkout" className="hover:text-white transition-colors">Booking Voucher Lookup</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors">Partner Operator Portal</Link></li>
              <li className="pt-2 text-xs text-emerald-300/60">Made with ❤️ in Bali, Indonesia</li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-emerald-900/80 flex flex-col md:flex-row items-center justify-between text-xs text-emerald-300/70 gap-4">
          <p>© {new Date().getFullYear()} Bali Mesari Tour. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span className="hover:underline cursor-pointer">Terms of Service</span>
            <span className="hover:underline cursor-pointer">Cancellation Guarantee</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
