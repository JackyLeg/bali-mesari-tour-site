export interface Destination {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  imageUrl: string;
  experienceCount: number;
  isFeatured?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName: string;
  imageUrl: string;
  experienceCount?: number;
}

export interface ItineraryItem {
  time: string;
  title: string;
  description?: string;
}

export interface Activity {
  id: string;
  title: string;
  slug: string;
  locationName: string;
  destinationSlug: string;
  categorySlug: string;
  shortDescription: string;
  fullDescription: string;
  highlights: string[];
  included: string[];
  notIncluded: string[];
  itinerary: ItineraryItem[];
  durationHours: number;
  pickupAvailable: boolean;
  pickupLocations: string;
  meetingPoint: string;
  priceOriginal?: number;
  priceDiscounted: number;
  rating: number;
  reviewCount: number;
  cancellationPolicy: string;
  badge?: 'Likely to Sell Out' | 'Bestseller' | 'Top Rated' | 'Popular' | 'Special Deal';
  travelerType: 'Couples' | 'Families' | 'Adventure' | 'Culture' | 'Luxury';
  status: 'published' | 'draft';
  isFeatured?: boolean;
  isTrending?: boolean;
  images: string[];
}

export interface Review {
  id: string;
  activityId: string;
  userName: string;
  userCountry: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  travelerType: string;
  date: string;
}

export interface Booking {
  id: string;
  bookingReference: string;
  activityId: string;
  activityTitle: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userCountry: string;
  bookingDate: string;
  timeSlot?: string;
  participantsCount: number;
  pickupAddress?: string;
  specialRequests?: string;
  totalAmount: number;
  currency: string;
  paymentStatus: 'confirmed' | 'pending' | 'refunded';
  bookingStatus: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedDate: string;
  readTime: string;
  imageUrl: string;
  category: string;
  relatedActivitySlugs: string[];
}
