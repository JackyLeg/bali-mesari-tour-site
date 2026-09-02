'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Compass, 
  MapPin, 
  Search, 
  Menu, 
  X, 
  PhoneCall, 
  ShieldCheck, 
  ChevronDown, 
  User, 
  Globe, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'IDR' | 'AUD' | 'EUR'>('USD');
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          <nav className="hidden md:flex items-center gap-7">
            <Link 
              href="/activities" 
              className={`text-sm font-semibold transition-colors hover:text-amber-500 ${isScrolled ? 'text-gray-700' : 'text-white/90'}`}
            >
              Explore Tours
            </Link>

            <Link 
              href="/destinations/ubud" 
              className={`text-sm font-semibold transition-colors hover:text-amber-500 ${isScrolled ? 'text-gray-700' : 'text-white/90'}`}
            >
              Destinations
            </Link>

            <Link 
              href="/activities?badge=Special+Deal" 
              className={`text-sm font-semibold flex items-center gap-1.5 transition-colors hover:text-amber-500 ${isScrolled ? 'text-emerald-700' : 'text-amber-300'}`}
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              Special Deals
            </Link>

            <Link 
              href="/blog" 
              className={`text-sm font-semibold transition-colors hover:text-amber-500 ${isScrolled ? 'text-gray-700' : 'text-white/90'}`}
            >
              Travel Guide
            </Link>

            <Link 
              href="/admin" 
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                isScrolled 
                  ? 'border-gray-200 text-gray-600 hover:border-emerald-600 hover:text-emerald-700' 
                  : 'border-white/30 text-white/80 hover:border-white hover:text-white'
              }`}
            >
              Admin Portal
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
                <div className="absolute right-0 mt-2 w-28 bg-white rounded-xl shadow-xl border border-gray-100 py-1 text-xs text-gray-800 z-50">
                  {(['USD', 'IDR', 'AUD', 'EUR'] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => {
                        setCurrency(curr);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-emerald-50 hover:text-emerald-700 ${currency === curr ? 'font-bold text-emerald-700 bg-emerald-50/50' : ''}`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct WhatsApp / Support */}
            <a 
              href="https://wa.me/6281234567890?text=Hello%20Bali%20Mesari%20Tour,%20I%20want%20to%20ask%20about%20booking" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-amber-400 hover:bg-amber-300 px-3.5 py-2 rounded-xl shadow-sm hover:shadow transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>WhatsApp Support</span>
            </a>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
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
          <nav className="flex flex-col gap-3">
            <Link 
              href="/activities" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-50 text-gray-800 flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              All Tours & Activities
            </Link>

            <Link 
              href="/destinations/ubud" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-50 text-gray-800 flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              Bali Destinations
            </Link>

            <Link 
              href="/activities?badge=Special+Deal" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-50 text-emerald-700 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Special Deals & Offers
            </Link>

            <Link 
              href="/blog" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-50 text-gray-800 flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-emerald-600" />
              Travel Guides & Tips
            </Link>

            <Link 
              href="/admin" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-50 text-gray-600 flex items-center gap-2"
            >
              <User className="w-4 h-4 text-emerald-600" />
              Admin Portal
            </Link>

            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <a 
                href="https://wa.me/6281234567890?text=Hello%20Bali%20Mesari%20Tour" 
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
