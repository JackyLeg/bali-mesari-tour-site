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

/**
 * A single pricing tier within a catalog listing.
 *
 * Examples from real catalogs:
 *   { name: "Package A — East Side", description: "Diamond, Atuh, Kelingking", price: 80, unit: "/ person" }
 *   { name: "Full Day (up to 10 hrs)",  description: "Air-conditioned car + driver", price: 50, unit: "/ car" }
 *   { name: "ATV + Rafting",            description: "60 min ATV + 2 hr rafting",  price: 89, unit: "/ person" }
 */
export interface PricePackage {
  name: string;        // e.g. "Package A — East Side"
  description: string; // Short list of what's included in this tier
  price: number;       // USD price
  unit: string;        // "/ person" | "/ car" | "/ group" | "/ boat" | "/ hour"
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
  durationHours?: number;       // Optional — not all tours are time-based
  pickupAvailable: boolean;
  pickupLocations: string;
  meetingPoint: string;
  priceOriginal?: number;       // Only set if hasDiscount is true
  priceDiscounted: number;      // The "From $XX" shown on cards (min of packages if packages exist)
  pricePackages?: PricePackage[]; // Multi-tier pricing (Package A/B/C, per-car rates, etc.)
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
