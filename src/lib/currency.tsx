'use client';

/**
 * 📚 HOW THIS WORKS — Currency Context (src/lib/currency.tsx)
 *
 * This file implements a React "Context" — a way to share data across
 * the entire component tree without passing props down manually through
 * every component layer (called "prop drilling").
 *
 * THE FLOW:
 *   1. CurrencyProvider wraps the entire app in layout.tsx
 *   2. It fetches the live USD→IDR exchange rate from an API
 *   3. It stores the user's chosen currency (USD or IDR) in localStorage
 *      so their preference is remembered across page refreshes
 *   4. Any component anywhere in the app can call useCurrency() to:
 *      - Read the current currency ("USD" or "IDR")
 *      - Get the live exchange rate
 *      - Format a USD price into the correct currency string
 *      - Toggle between USD and IDR
 *
 * EXAMPLE USAGE in any component:
 *   const { format, currency } = useCurrency();
 *   // If currency is USD: format(35) → "$35"
 *   // If currency is IDR: format(35) → "Rp 567,000"
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type CurrencyCode = 'USD' | 'IDR';

interface CurrencyContextValue {
  /** Currently selected currency code */
  currency: CurrencyCode;
  /** Live USD to IDR exchange rate (e.g. 16200) */
  rate: number;
  /** Whether the exchange rate is still loading */
  loading: boolean;
  /** Switch between USD and IDR */
  toggleCurrency: () => void;
  /** Set a specific currency */
  setCurrency: (code: CurrencyCode) => void;
  /**
   * Format a USD price into the user's preferred currency.
   *
   * 📚 EXAMPLE:
   *   format(35)      → "$35" (USD mode)
   *   format(35)      → "Rp 567,000" (IDR mode, if rate = 16200)
   *   format(35, true) → "$35 / Rp 567,000" (show both)
   */
  format: (usdAmount: number, showBoth?: boolean) => string;
  /** Convert a USD amount to IDR number (for calculations) */
  toIDR: (usdAmount: number) => number;
}

// ─── Default context values ───────────────────────────────────────────────────

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'USD',
  rate: 16200,         // Fallback rate if API is unavailable
  loading: true,
  toggleCurrency: () => {},
  setCurrency: () => {},
  format: (amount) => `$${amount}`,
  toIDR: (amount) => amount * 16200,
});

// ─── Constants ────────────────────────────────────────────────────────────────

// How long to cache the exchange rate in localStorage before fetching again.
// 1 hour = 3600000 ms. Exchange rates don't change every second, so caching
// reduces API calls and makes the app faster.
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

const CACHE_KEY = 'bmt_exchange_rate_cache';
const CURRENCY_PREF_KEY = 'bmt_currency_preference';

// Fallback rate in case the API is down (approximate mid-2026 rate)
const FALLBACK_RATE_IDR = 16200;

// ─── Exchange Rate Fetching ────────────────────────────────────────────────────

interface RateCache {
  rate: number;
  fetchedAt: number; // Unix timestamp ms
}

/**
 * Fetches the live USD→IDR exchange rate.
 *
 * 📚 HOW THE CACHING WORKS:
 *   1. First, check localStorage for a cached rate
 *   2. If the cache is less than 1 hour old, use it (fast, no API call)
 *   3. If the cache is stale or missing, fetch from the API and cache the result
 *
 * WHY CACHE?
 *   - Free API plans have monthly call limits (e.g. 1500/month)
 *   - Exchange rates don't change every second
 *   - localStorage is instant; API calls take 100-500ms
 *
 * @returns The current USD to IDR exchange rate
 */
async function fetchLiveRate(): Promise<number> {
  // Check cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rate, fetchedAt }: RateCache = JSON.parse(cached);
      const ageMs = Date.now() - fetchedAt;
      if (ageMs < CACHE_DURATION_MS) {
        // Cache is fresh — use it without hitting the API
        return rate;
      }
    }
  } catch {
    // localStorage might not be available (e.g. private browsing with restrictions)
  }

  // Cache is stale or missing — fetch from API
  const apiKey = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;

  if (!apiKey || apiKey === 'your_api_key_here') {
    // No API key configured — return fallback rate
    console.warn('[Currency] No NEXT_PUBLIC_EXCHANGE_RATE_API_KEY set. Using fallback rate.');
    return FALLBACK_RATE_IDR;
  }

  try {
    // exchangerate-api.com provides free tier with 1500 requests/month
    // Response example: { "conversion_rates": { "IDR": 16200.5, ... } }
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/IDR`,
      { next: { revalidate: 3600 } } // Next.js ISR cache for 1 hour on server
    );

    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data = await response.json();
    const rate = Math.round(data.conversion_rate as number);

    // Save to localStorage cache
    const cache: RateCache = { rate, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

    return rate;
  } catch (err) {
    console.warn('[Currency] Failed to fetch exchange rate, using fallback:', err);
    return FALLBACK_RATE_IDR;
  }
}

// ─── CurrencyProvider Component ───────────────────────────────────────────────

/**
 * Wrap your app with this provider in layout.tsx.
 * All child components can then use useCurrency() to access currency data.
 *
 * 📚 WHY USE A CONTEXT PROVIDER?
 *   Without a context, you'd have to pass `currency` and `rate` as props
 *   through every parent component: layout → page → section → card → price.
 *   With context, any component can access it directly in one line.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [rate, setRate] = useState<number>(FALLBACK_RATE_IDR);
  const [loading, setLoading] = useState<boolean>(true);

  // On first render: load saved currency preference + fetch live rate
  useEffect(() => {
    // Restore user's preferred currency from localStorage
    try {
      const saved = localStorage.getItem(CURRENCY_PREF_KEY) as CurrencyCode | null;
      if (saved === 'USD' || saved === 'IDR') {
        setCurrencyState(saved);
      }
    } catch {}

    // Fetch the live exchange rate
    fetchLiveRate()
      .then(setRate)
      .finally(() => setLoading(false));
  }, []);

  // Toggle between USD and IDR
  const toggleCurrency = useCallback(() => {
    setCurrencyState((prev) => {
      const next: CurrencyCode = prev === 'USD' ? 'IDR' : 'USD';
      try { localStorage.setItem(CURRENCY_PREF_KEY, next); } catch {}
      return next;
    });
  }, []);

  // Set a specific currency
  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    try { localStorage.setItem(CURRENCY_PREF_KEY, code); } catch {}
  }, []);

  /**
   * Convert USD amount to IDR number.
   * Example: toIDR(35) → 567000 (if rate = 16200)
   */
  const toIDR = useCallback(
    (usdAmount: number) => Math.round(usdAmount * rate),
    [rate]
  );

  /**
   * Format a USD price into a human-readable string.
   *
   * 📚 HOW Intl.NumberFormat WORKS:
   *   It's a built-in browser API for locale-aware number formatting.
   *   'id-ID' is the locale for Indonesian Rupiah.
   *   'en-US' is the locale for US Dollars.
   *   It automatically handles thousands separators: 567000 → "567,000" (en-US)
   *                                                             → "567.000" (id-ID)
   *
   * @param usdAmount - Price in USD
   * @param showBoth - If true, shows both currencies (e.g. "$35 / Rp 567,000")
   */
  const format = useCallback(
    (usdAmount: number, showBoth = false): string => {
      const usdStr = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(usdAmount);

      const idrAmount = Math.round(usdAmount * rate);
      const idrStr = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(idrAmount);

      if (showBoth) {
        return `${usdStr} / ${idrStr}`;
      }

      return currency === 'IDR' ? idrStr : usdStr;
    },
    [currency, rate]
  );

  const value: CurrencyContextValue = {
    currency,
    rate,
    loading,
    toggleCurrency,
    setCurrency,
    format,
    toIDR,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// ─── useCurrency Hook ─────────────────────────────────────────────────────────

/**
 * Hook to access currency state and utilities from any component.
 *
 * 📚 USAGE:
 *   import { useCurrency } from '@/lib/currency';
 *
 *   function PriceTag({ usdPrice }: { usdPrice: number }) {
 *     const { format, currency } = useCurrency();
 *     return <span>{format(usdPrice)}</span>;
 *   }
 */
export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}

export type { CurrencyCode, CurrencyContextValue };
