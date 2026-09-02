import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import CategoryGrid from '@/components/home/CategoryGrid';
import PopularExperiences from '@/components/home/PopularExperiences';
import DestinationSection from '@/components/home/DestinationSection';
import TravelerTypes from '@/components/home/TravelerTypes';
import LocalAdvantage from '@/components/home/LocalAdvantage';
import { getActivities, getCategories, getDestinations } from '@/lib/data';

export default async function HomePage() {
  const [activities, categories, destinations] = await Promise.all([
    getActivities(),
    getCategories(),
    getDestinations(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      <main className="flex-grow">
        <Hero />
        <CategoryGrid categories={categories} />
        <PopularExperiences activities={activities} />
        <DestinationSection destinations={destinations} />
        <TravelerTypes />
        <LocalAdvantage />
      </main>
      <Footer />
    </div>
  );
}
