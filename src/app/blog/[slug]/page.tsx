'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ActivityCard from '@/components/common/ActivityCard';
import { BlogPost, Activity } from '@/types';
import { getBlogPostBySlug, getActivities } from '@/lib/data';
import { Clock, User, Calendar, ArrowLeft } from 'lucide-react';

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedActivities, setRelatedActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getBlogPostBySlug(slug);
      if (data) {
        setPost(data);
        const allActs = await getActivities();
        setRelatedActivities(allActs.slice(0, 2));
      }
      setLoading(false);
    }
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Header />
        <div className="flex-grow flex items-center justify-center py-32 text-gray-400 font-bold text-sm">
          Loading article...
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Header />
        <div className="flex-grow text-center py-32 px-4">
          <h1 className="text-2xl font-bold text-gray-800">Article Not Found</h1>
          <button 
            onClick={() => router.push('/blog')}
            className="mt-6 px-6 py-2.5 bg-emerald-800 text-white font-bold rounded-xl text-xs"
          >
            Back to Travel Guides
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <button 
            onClick={() => router.back()} 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog Guides
          </button>

          {/* Article Header */}
          <div className="mb-8">
            <span className="text-xs font-extrabold uppercase text-amber-600 bg-amber-50 px-3 py-1 rounded-full mb-3 inline-block">
              {post.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 pb-6 border-b border-gray-200">
              <span className="flex items-center gap-1 text-gray-800">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                By {post.author}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                {post.publishedDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                {post.readTime}
              </span>
            </div>
          </div>

          {/* Featured Image */}
          <div className="aspect-[16/9] rounded-3xl overflow-hidden shadow-lg mb-8 bg-gray-200">
            <img 
              src={post.imageUrl} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Article Body */}
          <article className="prose max-w-none text-gray-700 text-sm leading-relaxed mb-12 space-y-4 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-base font-medium text-gray-900 leading-relaxed">
              {post.excerpt}
            </p>
            <p>
              When planning a trip to Bali, timing and local knowledge make all the difference between a good trip and an unforgettable lifetime memory. From navigating morning traffic near Ubud to finding secret snorkeling spots in Nusa Penida, local Balinese guides know how to maximize every single hour.
            </p>
            <h3 className="text-lg font-extrabold text-gray-900 pt-2">Key Recommendations:</h3>
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li>Book popular activities like Mount Batur sunrise treks at least 3-5 days in advance.</li>
              <li>Always carry modest clothing or a sarong when visiting sacred Balinese temples.</li>
              <li>Prefer private drivers over mass tour buses for personalized photo stops and flexibility.</li>
            </ul>
          </article>

          {/* Related Recommended Tours */}
          {relatedActivities.length > 0 && (
            <div className="pt-8 border-t border-gray-200">
              <h3 className="text-xl font-extrabold text-gray-900 mb-6">Recommended Related Tours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedActivities.map((act) => (
                  <ActivityCard key={act.id} activity={act} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
