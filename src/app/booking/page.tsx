'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BookingPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/activities');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="text-center px-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 text-3xl">
          🌴
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 mb-2">Redirecting to Tours...</h1>
        <p className="text-sm text-gray-500">Please select a tour to begin your booking.</p>
      </div>
    </div>
  );
}
