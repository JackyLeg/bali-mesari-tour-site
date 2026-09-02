import React from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getBlogPosts } from '@/lib/data';
import { Clock, User, ArrowRight, BookOpen } from 'lucide-react';

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        
        {/* Banner */}
        <div className="bg-emerald-950 text-white py-12 px-4 sm:px-6 lg:px-8 mb-12">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
              <BookOpen className="w-4 h-4" />
              <span>Insider Bali Travel Guides</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              Bali Travel Guide & Expert Tips
            </h1>
            <p className="text-emerald-200/80 text-sm mt-2 max-w-xl mx-auto">
              Written by local Balinese tour experts. Discover hidden waterfalls, cultural etiquette, sunrise trek advice, and itinerary guides.
            </p>
          </div>
        </div>

        {/* Blog Post Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post) => (
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
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
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
        </div>

      </main>

      <Footer />
    </div>
  );
}
