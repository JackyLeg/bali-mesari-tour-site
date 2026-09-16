'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/data';
import { BlogPost } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Clock, User, ArrowRight, BookOpen, Search, X } from 'lucide-react';

const CATEGORIES = ['All', 'Travel Tips', 'Destinations', 'Culture', 'Adventure', 'Food & Drink', 'Wellness'];

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    getBlogPosts().then(setPosts);
  }, []);

  const filtered = posts.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesQuery = !query.trim() ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Get unique categories from actual posts + preset list
  const postCategories = Array.from(new Set(posts.map((p) => p.category)));
  const allCategories = ['All', ...Array.from(new Set([...postCategories, ...CATEGORIES.slice(1)]))];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-24 pb-20">

        {/* Banner */}
        <div className="bg-emerald-950 text-white py-12 px-4 sm:px-6 lg:px-8 mb-10">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
              <BookOpen className="w-4 h-4" />
              <span>Insider Bali Travel Guides</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">
              Bali Travel Guide & Expert Tips
            </h1>
            <p className="text-emerald-200/80 text-sm mb-8 max-w-xl mx-auto">
              Written by local Balinese tour experts. Discover hidden waterfalls, cultural etiquette, sunrise trek advice, and itinerary guides.
            </p>

            {/* Search */}
            <div className="max-w-lg mx-auto bg-white rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search guides and tips..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-grow text-sm font-medium text-gray-800 bg-transparent border-none outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-700">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold px-4 py-2 rounded-full border transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-500 hover:text-emerald-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p className="text-xs font-bold text-gray-500 mb-6">
            {filtered.length} article{filtered.length !== 1 ? 's' : ''} found
            {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
            {query && ` matching "${query}"`}
          </p>

          {/* Blog Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filtered.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-6 flex flex-col justify-between flex-grow">
                    <div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md">
                          {post.category}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-700" />
                          {post.readTime}
                        </span>
                      </div>

                      <h2 className="text-xl font-extrabold text-gray-900 leading-snug mb-3 hover:text-emerald-800 transition-colors">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h2>

                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-700" />
                        {post.author}
                      </span>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                      >
                        <span>Read Guide</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Articles Found</h3>
              <p className="text-xs text-gray-500 mb-5">Try a different search term or category.</p>
              <button
                onClick={() => { setQuery(''); setSelectedCategory('All'); }}
                className="px-5 py-2.5 bg-emerald-800 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
