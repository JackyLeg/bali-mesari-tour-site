/**
 * 📚 HOW THIS WORKS — Header Component
 *
 * The Header uses useCurrency() from CurrencyContext.
 * When the user picks a currency from the dropdown or mobile toggle,
 * the context updates globally — so ALL price displays across the site
 * (activity cards, checkout, booking summary) update simultaneously.
 *
 * In addition, usePathname() tracks the active page to visually emphasize
 * the current location in both desktop and mobile navigation.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Compass, 
  MapPin, 
  Search, 
  Menu, 
  X, 
  PhoneCall, 
  ChevronDown, 
  Globe, 
  Sparkles,
} from 'lucide-react';
import { useCurrency } from '@/lib/currency';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const pathname = usePathname();

  const { currency, setCurrency } = useCurrency();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper to determine if link is active
  const isLinkActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-gradient-to-b from-black/60 to-transparent py-4 text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-amber-400 flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
              🌴
            </div>
            <div>
              <span className={`text-xl font-extrabold tracking-tight block ${isScrolled ? 'text-emerald-900' : 'text-white'}`}>
                Bali Mesari <span className="text-amber-500">Tour</span>
              </span>
              <span className={`text-[10px] tracking-wider uppercase font-semibold block -mt-1 ${isScrolled ? 'text-emerald-600' : 'text-emerald-200'}`}>
                Authentic Experiences
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-5">
            <Link 
              href="/activities" 
              className={`text-sm font-semibold transition-all px-3 py-1.5 rounded-full ${
                isLinkActive('/activities') && !pathname.includes('badge=Special')
                  ? isScrolled 
                    ? 'bg-emerald-50 text-emerald-800 font-extrabold shadow-xs ring-1 ring-emerald-200' 
                    : 'bg-white/20 text-white font-extrabold backdrop-blur-md ring-1 ring-white/30'
                  : isScrolled ? 'text-gray-700 hover:text-amber-600' : 'text-white/90 hover:text-amber-300'
              }`}
            >
              Explore Tours
            </Link>

            <Link 
              href="/destinations" 
              className={`text-sm font-semibold transition-all px-3 py-1.5 rounded-full ${
                isLinkActive('/destinations')
                  ? isScrolled 
                    ? 'bg-emerald-50 text-emerald-800 font-extrabold shadow-xs ring-1 ring-emerald-200' 
                    : 'bg-white/20 text-white font-extrabold backdrop-blur-md ring-1 ring-white/30'
                  : isScrolled ? 'text-gray-700 hover:text-amber-600' : 'text-white/90 hover:text-amber-300'
              }`}
            >
              Destinations
            </Link>

            <Link 
              href="/activities?badge=Special+Deal" 
              className={`text-sm font-semibold flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-full ${
                isScrolled ? 'text-emerald-700 hover:text-amber-600' : 'text-amber-300 hover:text-amber-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              Special Deals
            </Link>

            <Link 
              href="/blog" 
              className={`text-sm font-semibold transition-all px-3 py-1.5 rounded-full ${
                isLinkActive('/blog')
                  ? isScrolled 
                    ? 'bg-emerald-50 text-emerald-800 font-extrabold shadow-xs ring-1 ring-emerald-200' 
                    : 'bg-white/20 text-white font-extrabold backdrop-blur-md ring-1 ring-white/30'
                  : isScrolled ? 'text-gray-700 hover:text-amber-600' : 'text-white/90 hover:text-amber-300'
              }`}
            >
              Travel Guide
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Currency Selector */}
            <div className="relative">
              <button 
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                  isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{currency}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {currencyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1 text-xs text-gray-800 z-50">
                  {(['USD', 'IDR'] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => {
                        setCurrency(curr);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between ${currency === curr ? 'font-bold text-emerald-700 bg-emerald-50/50' : ''}`}
                    >
                      <span>{curr === 'USD' ? '🇺🇸 USD ($)' : '🇮🇩 IDR (Rp)'}</span>
                      {currency === curr && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold">Active</span>}
                    </button>
                  ))}
                  <div className="px-3 py-1.5 border-t border-gray-100 text-[10px] text-gray-400">
                    Auto currency conversion
                  </div>
                </div>
              )}
            </div>

            {/* Direct WhatsApp / Support */}
            <a 
              href="https://wa.me/6285128016716?text=Hello%20Bali%20Mesari%20Tour,%20I%20want%20to%20ask%20about%20booking" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-amber-400 hover:bg-amber-300 px-3.5 py-2 rounded-xl shadow-sm hover:shadow transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>WhatsApp Support</span>
            </a>
          </div>

          {/* Mobile Right Controls: Currency Quick Toggle + Search + Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Quick Currency Switcher on Mobile Bar */}
            <button
              onClick={() => setCurrency(currency === 'USD' ? 'IDR' : 'USD')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                isScrolled 
                  ? 'border-gray-200 bg-gray-50 text-emerald-900 shadow-xs' 
                  : 'border-white/30 bg-black/30 text-white backdrop-blur-md'
              }`}
              title="Switch currency USD / IDR"
            >
              <Globe className="w-3 h-3 text-amber-400" />
              <span>{currency === 'USD' ? '$ USD' : 'Rp IDR'}</span>
            </button>

            <Link 
              href="/activities"
              className={`p-2 rounded-lg ${isScrolled ? 'text-gray-700' : 'text-white'}`}
            >
              <Search className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg ${isScrolled ? 'text-gray-700' : 'text-white'}`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-100 shadow-xl px-4 pt-3 pb-6 text-gray-800 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-2">
            
            {/* Mobile Currency Switcher */}
            <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100 mb-2">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-700" />
                Display Currency:
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1 rounded-md text-xs font-extrabold transition-colors ${
                    currency === 'USD' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🇺🇸 USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('IDR')}
                  className={`px-3 py-1 rounded-md text-xs font-extrabold transition-colors ${
                    currency === 'IDR' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🇮🇩 IDR (Rp)
                </button>
              </div>
            </div>

            <Link 
              href="/activities" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                isLinkActive('/activities') && !pathname.includes('badge=Special')
                  ? 'bg-emerald-100 text-emerald-950 font-extrabold border-l-4 border-emerald-700'
                  : 'hover:bg-emerald-50 text-gray-800'
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              All Tours & Activities
            </Link>

            <Link 
              href="/destinations" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                isLinkActive('/destinations')
                  ? 'bg-emerald-100 text-emerald-950 font-extrabold border-l-4 border-emerald-700'
                  : 'hover:bg-emerald-50 text-gray-800'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              Bali Destinations
            </Link>

            <Link 
              href="/activities?badge=Special+Deal" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-50 text-emerald-800 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Special Deals & Offers
            </Link>

            <Link 
              href="/blog" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                isLinkActive('/blog')
                  ? 'bg-emerald-100 text-emerald-950 font-extrabold border-l-4 border-emerald-700'
                  : 'hover:bg-emerald-50 text-gray-800'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-600" />
              Travel Guides & Tips
            </Link>

            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2 mt-1">
              <a 
                href="https://wa.me/6285128016716?text=Hello%20Bali%20Mesari%20Tour" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-900 font-bold rounded-xl text-sm shadow-sm"
              >
                Instant WhatsApp Booking
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
