import { Activity, Category, Destination, Review, BlogPost, Booking } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';

export const INITIAL_DESTINATIONS: Destination[] = [
  {
    id: 'dest-1',
    slug: 'ubud',
    name: 'Ubud',
    tagline: 'Cultural Heart & Lush Terraces',
    description: 'Discover sacred monkey forests, emerald rice terraces, traditional artisan villages, and serene wellness retreats in the heart of Bali.',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80',
    experienceCount: 145,
    isFeatured: true,
  },
  {
    id: 'dest-2',
    slug: 'nusa-penida',
    name: 'Nusa Penida',
    tagline: 'Dramatic Cliffs & Crystal Waters',
    description: 'Iconic T-Rex cliff views at Kelingking Beach, stunning natural infinity pools, and world-class manta ray snorkeling adventures.',
    imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1000&q=80',
    experienceCount: 88,
    isFeatured: true,
  },
  {
    id: 'dest-3',
    slug: 'uluwatu',
    name: 'Uluwatu',
    tagline: 'Cliffside Temples & Ocean Waves',
    description: 'Spectacular sunset views over dramatic cliff edges, world-famous Kecak Fire dance performances, and premier surf breaks.',
    imageUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1000&q=80',
    experienceCount: 92,
    isFeatured: true,
  },
  {
    id: 'dest-4',
    slug: 'mount-batur',
    name: 'Mount Batur',
    tagline: 'Volcanic Sunrises & Hot Springs',
    description: 'Early morning volcano treks above the clouds, panoramic caldera vistas, and relaxing natural geothermal hot springs.',
    imageUrl: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1000&q=80',
    experienceCount: 64,
    isFeatured: true,
  },
  {
    id: 'dest-5',
    slug: 'canggu',
    name: 'Canggu & Seminyak',
    tagline: 'Surf Beaches & Vibrant Nightlife',
    description: 'Chic beach clubs, stylish cafes, sunset surf sessions, and trendy boutique shopping in Bali’s most energetic coastal towns.',
    imageUrl: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1000&q=80',
    experienceCount: 110,
    isFeatured: false,
  },
  {
    id: 'dest-6',
    slug: 'nusa-lembongan',
    name: 'Nusa Lembongan & Ceningan',
    tagline: 'Island Escape & Coral Reefs',
    description: 'Pristine mangrove forests, yellow suspension bridge, quiet turquoise bays, and vivid coral reefs just off Bali’s mainland.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    experienceCount: 42,
    isFeatured: false,
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    slug: 'adventure',
    name: 'Adventure & Outdoors',
    description: 'ATV quad biking, white water rafting, volcano treks, and zip lines.',
    iconName: 'Compass',
    imageUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80',
    experienceCount: 120,
  },
  {
    id: 'cat-2',
    slug: 'water-sports',
    name: 'Beach & Water Sports',
    description: 'Snorkeling with Manta Rays, scuba diving, surf lessons, and jet skis.',
    iconName: 'Waves',
    imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80',
    experienceCount: 95,
  },
  {
    id: 'cat-3',
    slug: 'culture',
    name: 'Culture & Temples',
    description: 'Kecak Fire dances, temple tours, royal palaces, and sacred water blessings.',
    iconName: 'Landmark',
    imageUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=600&q=80',
    experienceCount: 85,
  },
  {
    id: 'cat-4',
    slug: 'day-trips',
    name: 'Day Trips & Private Tours',
    description: 'Full-day customizable private driver tours across Bali’s top spots.',
    iconName: 'Car',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80',
    experienceCount: 140,
  },
  {
    id: 'cat-5',
    slug: 'wellness',
    name: 'Spa & Wellness',
    description: 'Traditional Balinese massages, floral baths, yoga classes, and sound healing.',
    iconName: 'Sparkles',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    experienceCount: 50,
  },
  {
    id: 'cat-6',
    slug: 'food-culinary',
    name: 'Food & Cooking Classes',
    description: 'Authentic Balinese cooking schools, market tours, and romantic beach dinners.',
    iconName: 'Utensils',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    experienceCount: 38,
  },
];

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    title: 'Mount Batur Sunrise Trekking & Natural Hot Springs Experience',
    slug: 'mount-batur-sunrise-trekking-hot-springs',
    locationName: 'Kintamani, Mount Batur',
    destinationSlug: 'mount-batur',
    categorySlug: 'adventure',
    shortDescription: 'Hike an active volcano under the stars, witness a breathtaking sunrise above the clouds, and soak in geothermal hot springs.',
    fullDescription: 'Embark on an unforgettable early-morning adventure to Mount Batur, an active volcano located in the Kintamani region of Bali. Hike up the slopes led by an experienced local guide, reach the 1,717-meter summit in time to watch the sun rise over Mount Agung and the ocean, and enjoy a light breakfast cooked over natural volcanic steam. Afterwards, relax your muscles in natural geothermal hot springs overlooking Lake Batur.',
    highlights: [
      'Early morning guided trek to the 1,717m Mount Batur summit',
      'Spectacular sunrise views over Mount Agung and Lake Batur',
      'Volcanic steam-cooked breakfast (eggs & bananas) at the peak',
      'Soak in natural geothermal hot springs after your descent',
      'Round-trip hotel pickup in an air-conditioned vehicle'
    ],
    included: [
      'Hotel pickup and drop-off',
      'Professional English-speaking trekking guide',
      'Flashlight / headlamp for safety',
      'Summit breakfast & coffee/tea',
      'Entrance tickets to Mount Batur & Batur Hot Springs',
      'Mineral water'
    ],
    notIncluded: [
      'Personal expenses & souvenirs',
      'Gratuities for driver and guide',
      'Swimwear rental (please bring your own)'
    ],
    itinerary: [
      { time: '01:30 AM', title: 'Hotel Pickup', description: 'Driver picks you up directly from your hotel in an AC vehicle.' },
      { time: '03:15 AM', title: 'Base Camp Safety Briefing', description: 'Meet your trek guide, get safety gear, and start ascending.' },
      { time: '06:00 AM', title: 'Summit Sunrise & Breakfast', description: 'Reach the summit peak, watch the sunrise, and eat hot breakfast.' },
      { time: '07:30 AM', title: 'Volcanic Crater Walk', description: 'Explore the crater rim and view volcanic steam vents.' },
      { time: '09:00 AM', title: 'Natural Hot Springs Bathing', description: 'Descend to Lake Batur and soak in warm mineral hot springs.' },
      { time: '12:00 PM', title: 'Return to Hotel', description: 'Relax on the drive back to your hotel.' }
    ],
    durationHours: 8,
    pickupAvailable: true,
    pickupLocations: 'Ubud, Canggu, Seminyak, Kuta, Sanur, Nusa Dua',
    meetingPoint: 'Kintamani Trekking Base Camp (if self-drive selected)',
    priceOriginal: 55,
    priceDiscounted: 35,
    rating: 4.9,
    reviewCount: 3120,
    cancellationPolicy: 'Free cancellation up to 24 hours before activity start',
    badge: 'Likely to Sell Out',
    travelerType: 'Adventure',
    status: 'published',
    isFeatured: true,
    isTrending: true,
    images: [
      'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    id: 'act-2',
    title: 'Nusa Penida Island All-Inclusive Day Tour with Manta Ray Snorkeling',
    slug: 'nusa-penida-all-inclusive-day-tour-manta-snorkeling',
    locationName: 'Nusa Penida Island',
    destinationSlug: 'nusa-penida',
    categorySlug: 'water-sports',
    shortDescription: 'Explore iconic Kelingking T-Rex cliff, Angel Billabong, Broken Beach, and swim alongside gentle giant Manta Rays.',
    fullDescription: 'Take a fast boat from Sanur to the enchanting island of Nusa Penida for a full day of spectacular sights. Snorkel in turquoise waters at Manta Point and Gamat Bay, marvel at the jaw-dropping cliff view of Kelingking Beach, take photos at the natural rock infinity pool of Angel’s Billabong, and witness the unique archway of Broken Beach.',
    highlights: [
      'Fast boat return tickets from Sanur harbor',
      'Snorkel with wild Manta Rays at Manta Bay & Gamat Bay',
      'Iconic photos at Kelingking Beach (T-Rex Cliff point)',
      'Visit Angel’s Billabong natural pool & Broken Beach archway',
      'Included beachfront Indonesian lunch'
    ],
    included: [
      'Hotel transfer to Sanur Port',
      'Round-trip fast boat tickets (Sanur - Nusa Penida)',
      'Private island transport with English speaking driver/photographer',
      'Snorkeling boat, boat captain, fins, mask & life jacket',
      'Buffet lunch at local restaurant',
      'All Penida island entry fees'
    ],
    notIncluded: [
      'Retribution fee at Sanur port ($2/person)',
      'Personal snacks and extra drinks'
    ],
    itinerary: [
      { time: '06:30 AM', title: 'Hotel Pickup', description: 'Transfer to Sanur Harbor.' },
      { time: '07:30 AM', title: 'Fast Boat Ride', description: '45-min speedboat ride to Nusa Penida.' },
      { time: '08:40 AM', title: 'Manta Ray Snorkeling', description: 'Board snorkeling boat to Manta Point & Gamat Bay.' },
      { time: '12:00 PM', title: 'Lunch Break', description: 'Fresh Balinese lunch served near the beach.' },
      { time: '01:30 PM', title: 'Kelingking T-Rex Cliff', description: 'Panoramic cliff view photoshoot.' },
      { time: '03:30 PM', title: 'Angel’s Billabong & Broken Beach', description: 'Explore rock formations.' },
      { time: '04:30 PM', title: 'Fast Boat to Sanur', description: 'Return trip to main island Bali.' }
    ],
    durationHours: 10,
    pickupAvailable: true,
    pickupLocations: 'Seminyak, Canggu, Kuta, Sanur, Ubud, Nusa Dua',
    meetingPoint: 'Sanur Harbor Port Desk',
    priceOriginal: 89,
    priceDiscounted: 58,
    rating: 4.8,
    reviewCount: 2480,
    cancellationPolicy: 'Free cancellation up to 24 hours in advance',
    badge: 'Bestseller',
    travelerType: 'Adventure',
    status: 'published',
    isFeatured: true,
    isTrending: true,
    images: [
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    id: 'act-3',
    title: 'Uluwatu Sunset Temple Tour & Kecak Fire Dance Show Ticket',
    slug: 'uluwatu-sunset-temple-kecak-fire-dance',
    locationName: 'Uluwatu, South Bali',
    destinationSlug: 'uluwatu',
    categorySlug: 'culture',
    shortDescription: 'Witness dramatic sunset cliff views at ancient Uluwatu Temple followed by the thrilling traditional Kecak & Fire Dance show.',
    fullDescription: 'Perched on a 70-meter cliff above the Indian Ocean, Uluwatu Temple is one of Bali’s nine directional temples. Walk along the scenic cliff paths accompanied by friendly monkeys, watch the sun set over the ocean horizon, and take your seat in the open-air amphitheater for the mesmerizing Kecak Fire Dance depicting the Ramayana epic.',
    highlights: [
      'Skip-the-line guaranteed ticket for the Kecak Fire Dance',
      'Sunset views over the cliffside Indian Ocean amphitheater',
      'Guided walk around ancient 11th-century Uluwatu Temple',
      'Optional seafood dinner add-on at Jimbaran Bay'
    ],
    included: [
      'Uluwatu Temple entrance fee',
      'Reserved Kecak Fire Dance performance ticket',
      'Traditional sarong rental for temple entry',
      'Hotel pickup & drop-off (if option selected)'
    ],
    notIncluded: [
      'Jimbaran Bay seafood dinner (unless upgrade chosen)',
      'Personal guide tip'
    ],
    itinerary: [
      { time: '03:30 PM', title: 'Hotel Pickup', description: 'Drive along the Bukit Peninsula to Uluwatu.' },
      { time: '04:45 PM', title: 'Uluwatu Temple Exploration', description: 'Explore cliff paths and photo spots.' },
      { time: '06:00 PM', title: 'Kecak Fire Dance Performance', description: 'Hypnotic 100-man choir performance during sunset.' },
      { time: '07:30 PM', title: 'Jimbaran Bay Seafood Dinner (Optional)', description: 'Candlelight dinner on the beach sand.' }
    ],
    durationHours: 5,
    pickupAvailable: true,
    pickupLocations: 'Kuta, Seminyak, Nusa Dua, Jimbaran, Sanur, Canggu',
    meetingPoint: 'Uluwatu Temple Main Gate',
    priceOriginal: 35,
    priceDiscounted: 24,
    rating: 4.9,
    reviewCount: 1890,
    cancellationPolicy: 'Free cancellation up to 24 hours in advance',
    badge: 'Top Rated',
    travelerType: 'Culture',
    status: 'published',
    isFeatured: true,
    isTrending: true,
    images: [
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    id: 'act-4',
    title: 'Ayung River White Water Rafting & Jungle Swing in Ubud',
    slug: 'ayung-river-white-water-rafting-ubud-swing',
    locationName: 'Ayung River, Ubud',
    destinationSlug: 'ubud',
    categorySlug: 'adventure',
    shortDescription: 'Navigate class II-III rapids through jungle canyons, hidden waterfalls, and carved stone cliff walls, followed by the Famous Bali Jungle Swing.',
    fullDescription: 'Feel the rush of adrenaline as you paddle down 10 kilometers of the pristine Ayung River in Ubud. Pass lush rainforest canopy, secret waterfalls, and ancient stone carvings carved directly into the river rock. After rafting, enjoy a hot shower, buffet lunch, and soar over the palm tree valley on the iconic Bali Swing.',
    highlights: [
      '10km white water rafting adventure suitable for all experience levels',
      'Paddle past hidden rainforest waterfalls and stone-carved cliffs',
      'International safety standard equipment & professional raft guides',
      'Hot shower facilities, towel rental, and fresh buffet lunch',
      'Includes Jungle Swing photo experience'
    ],
    included: [
      'Safety equipment (helmet, life jacket, paddle)',
      'Certified rafting guide per boat',
      'Buffet lunch & drinking water',
      'Shower & changing room facilities',
      'Insurance coverage',
      'Hotel pickup'
    ],
    notIncluded: [
      'GoPro photo/video package',
      'Personal beverages'
    ],
    itinerary: [
      { time: '08:00 AM', title: 'Pickup from Hotel', description: 'Scenic drive to Ubud rafting starting point.' },
      { time: '09:30 AM', title: 'Safety Briefing & Equipment', description: 'Gear up and walk down to the river bank.' },
      { time: '10:00 AM', title: 'Rafting Action (2 Hours)', description: 'Paddle down class II-III rapids.' },
      { time: '12:30 PM', title: 'Buffet Lunch & Shower', description: 'Enjoy warm lunch with valley views.' },
      { time: '02:00 PM', title: 'Bali Jungle Swing', description: 'Fly high above the green coconut trees.' }
    ],
    durationHours: 6,
    pickupAvailable: true,
    pickupLocations: 'Ubud, Canggu, Seminyak, Sanur, Kuta, Jimbaran',
    meetingPoint: 'Ayung Rafting Base Center',
    priceOriginal: 45,
    priceDiscounted: 29,
    rating: 4.9,
    reviewCount: 1650,
    cancellationPolicy: 'Free cancellation up to 24 hours in advance',
    badge: 'Popular',
    travelerType: 'Families',
    status: 'published',
    isFeatured: true,
    isTrending: false,
    images: [
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    id: 'act-5',
    title: 'Best of Ubud Private Day Tour: Monkey Forest, Rice Terraces & Waterfalls',
    slug: 'best-of-ubud-private-day-tour-waterfalls',
    locationName: 'Ubud, Gianyar',
    destinationSlug: 'ubud',
    categorySlug: 'day-trips',
    shortDescription: 'Customize your own private itinerary: Sacred Monkey Forest, Tegallalang Rice Terraces, Tegenungan Waterfall, and Tirta Empul Water Temple.',
    fullDescription: 'Experience the best of Bali’s cultural capital with your own private vehicle and personal driver-guide. Visit the mischievous long-tailed macaques in the Sacred Monkey Forest, walk through the UNESCO-listed Tegallalang rice terraces, feel the spray of Tegenungan Waterfall, and receive a holy water purification blessing at Tirta Empul Temple.',
    highlights: [
      '100% customizable 10-hour private driver tour',
      'Private air-conditioned car with friendly English-speaking driver',
      'Visit Sacred Monkey Forest, Tegallalang Rice Terraces & Waterfalls',
      'Experience holy water purification ritual at Tirta Empul',
      'Free hotel pickup anywhere in Bali'
    ],
    included: [
      'Private vehicle with air conditioning',
      'English-speaking driver/photographer',
      'Fuel, parking fees, and toll fees',
      'Chilled bottled water',
      'Hotel pickup & drop-off'
    ],
    notIncluded: [
      'Attraction entrance tickets (approx $15 total)',
      'Lunch expenses'
    ],
    itinerary: [
      { time: '08:30 AM', title: 'Hotel Pickup', description: 'Meet your private driver in hotel lobby.' },
      { time: '09:30 AM', title: 'Tegenungan Waterfall', description: 'Walk down into the lush canyon waterfall.' },
      { time: '11:00 AM', title: 'Sacred Monkey Forest Sanctuary', description: 'Stroll under centuries-old banyan trees.' },
      { time: '01:00 PM', title: 'Rice Terrace Lunch', description: 'Dine with panoramic views of Tegallalang.' },
      { time: '03:00 PM', title: 'Tirta Empul Holy Water Temple', description: 'Witness traditional Balinese spiritual rituals.' },
      { time: '05:00 PM', title: 'Ubud Craft Village & Return', description: 'Visit silver/wood carvers before returning.' }
    ],
    durationHours: 10,
    pickupAvailable: true,
    pickupLocations: 'All hotels in Bali mainland',
    meetingPoint: 'Your Hotel Lobby',
    priceOriginal: 60,
    priceDiscounted: 42,
    rating: 5.0,
    reviewCount: 4120,
    cancellationPolicy: 'Free cancellation up to 24 hours in advance',
    badge: 'Bestseller',
    travelerType: 'Couples',
    status: 'published',
    isFeatured: true,
    isTrending: true,
    images: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    id: 'act-6',
    title: 'Luxury Sunset Catamaran Cruise to Nusa Lembongan with Dinner',
    slug: 'luxury-sunset-catamaran-cruise-lembongan-dinner',
    locationName: 'Benoa Harbor & Lembongan',
    destinationSlug: 'nusa-lembongan',
    categorySlug: 'water-sports',
    shortDescription: 'Sail across the Badung Strait on a 5-star luxury catamaran sailboat, enjoy ocean lounge music, live entertainment, and a seafood buffet.',
    fullDescription: 'Spend a dreamy late afternoon aboard a luxury 64-foot catamaran cruising from Benoa Harbor toward Lembongan Island. Relax on sun deck trampolines, enjoy complimentary welcome cocktails, listen to live acoustic music as the sun sets over Bali’s volcanoes, and indulge in an international gourmet dinner buffet.',
    highlights: [
      'Sail on a spacious high-end catamaran yacht',
      'Welcome drinks, afternoon tea, snacks, and tropical fruit',
      'Live acoustic band & DJ set on the ocean deck',
      'Gourmet international & seafood dinner buffet',
      'Romantic atmosphere perfect for couples & special celebrations'
    ],
    included: [
      'Hotel transfer to Benoa Harbor',
      'Catamaran cruise ticket',
      'Gourmet dinner buffet & welcome drinks',
      'Live music entertainment',
      'Insurance'
    ],
    notIncluded: [
      'Premium alcoholic cocktails from bar',
      'Private cabin upgrade'
    ],
    itinerary: [
      { time: '04:30 PM', title: 'Boarding at Benoa Harbor', description: 'Cocktail welcome on deck.' },
      { time: '05:15 PM', title: 'Ocean Sailing', description: 'Cruise into open water while live band plays.' },
      { time: '06:15 PM', title: 'Sunset Views', description: 'Watch magical golden hour colors over the ocean.' },
      { time: '07:00 PM', title: 'Dinner Buffet Served', description: 'Dine under illuminated deck lights.' },
      { time: '08:30 PM', title: 'Return to Harbor', description: 'Transfer back to hotel.' }
    ],
    durationHours: 4,
    pickupAvailable: true,
    pickupLocations: 'Seminyak, Canggu, Kuta, Sanur, Nusa Dua, Jimbaran',
    meetingPoint: 'Benoa Harbor Yacht Dock',
    priceOriginal: 110,
    priceDiscounted: 79,
    rating: 4.9,
    reviewCount: 780,
    cancellationPolicy: 'Free cancellation up to 24 hours in advance',
    badge: 'Special Deal',
    travelerType: 'Luxury',
    status: 'published',
    isFeatured: true,
    isTrending: false,
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1000&q=80'
    ]
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    activityId: 'act-1',
    userName: 'Sarah Jenkins',
    userCountry: 'Australia',
    rating: 5,
    comment: 'Hiking Mount Batur with Bali Mesari Tour was the absolute highlight of our 2 weeks in Bali! Our guide Wayan made sure we were safe and comfortable. The hot springs afterwards were pure bliss!',
    travelerType: 'Couple',
    date: '2026-08-14'
  },
  {
    id: 'rev-2',
    activityId: 'act-2',
    userName: 'Markus Weber',
    userCountry: 'Germany',
    rating: 5,
    comment: 'Super seamless organization! We saw 4 giant Manta rays while snorkeling, and Kelingking beach view is unbelievable in real life. Worth every dollar.',
    travelerType: 'Friends',
    date: '2026-08-02'
  },
  {
    id: 'rev-3',
    activityId: 'act-5',
    userName: 'Elena Rostova',
    userCountry: 'United Kingdom',
    rating: 5,
    comment: 'Having a private driver was the best decision! Made in Bali Mesari took amazing photos of us at the rice terraces and knew the exact timing to avoid crowd peaks.',
    travelerType: 'Solo',
    date: '2026-07-28'
  }
];

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'ultimate-bali-5-day-itinerary',
    title: 'The Ultimate 5-Day Bali Itinerary for First-Time Visitors',
    excerpt: 'Planning your first trip to Bali? Here is the perfect step-by-step route covering Ubud rice terraces, Mount Batur sunrise, Uluwatu sunsets, and Nusa Penida cliffs.',
    content: `Bali is an island of unbelievable diversity, from volcano peaks to cliffside oceans. If you only have 5 days, here is how to maximize your trip...`,
    author: 'Kadek Mesari',
    publishedDate: '2026-08-20',
    readTime: '6 min read',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80',
    category: 'Travel Tips',
    relatedActivitySlugs: ['best-of-ubud-private-day-tour-waterfalls', 'mount-batur-sunrise-trekking-hot-springs']
  },
  {
    id: 'post-2',
    slug: 'mount-batur-sunrise-trekking-guide',
    title: 'Mount Batur Sunrise Trek: Everything You Need to Know Before Hiking',
    excerpt: 'What to pack, how hard is the climb, pickup times, and how to choose between trekking or jeep sunrise tours.',
    content: `Climbing Mount Batur is one of Bali's premier outdoor adventures...`,
    author: 'Gede Suarta',
    publishedDate: '2026-08-10',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1000&q=80',
    category: 'Adventure Guide',
    relatedActivitySlugs: ['mount-batur-sunrise-trekking-hot-springs']
  }
];

// Helper Query Functions (Works dynamically with Supabase OR initial mock fallback)

export async function getDestinations(): Promise<Destination[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('destinations').select('*');
    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        slug: d.slug,
        name: d.name,
        tagline: d.tagline,
        description: d.description,
        imageUrl: d.image_url,
        experienceCount: d.experience_count,
        isFeatured: d.is_featured,
      }));
    }
  }
  return INITIAL_DESTINATIONS;
}

export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('categories').select('*');
    if (!error && data && data.length > 0) {
      return data.map((c: any) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        iconName: c.icon_name,
        imageUrl: c.image_url,
      }));
    }
  }
  return INITIAL_CATEGORIES;
}

export async function getActivities(params?: {
  query?: string;
  destinationSlug?: string;
  categorySlug?: string;
  travelerType?: string;
  maxPrice?: number;
  minRating?: number;
  badge?: string;
  sort?: string;
}): Promise<Activity[]> {
  let list = [...INITIAL_ACTIVITIES];

  // Fetch real activities from Supabase (synced across all devices)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: dbActivities, error } = await supabase
        .from('activities')
        .select(`
          *,
          activity_images (
            image_url,
            display_order
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (!error && dbActivities && dbActivities.length > 0) {
        const mapped: Activity[] = dbActivities.map((row: any) => {
          const sortedImages = (row.activity_images || [])
            .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
            .map((img: any) => img.image_url);

          const coverImage = sortedImages[0] || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80';

          return {
            id: row.id,
            slug: row.slug,
            title: row.title,
            locationName: row.location_name || 'Bali, Indonesia',
            destinationSlug: row.destination_id || 'ubud',
            categorySlug: row.category_id || 'adventure',
            shortDescription: row.short_description || '',
            fullDescription: row.full_description || '',
            highlights: row.highlights || [],
            included: row.included || ['Hotel pickup & drop-off', 'English speaking guide'],
            notIncluded: row.not_included || ['Personal expenses', 'Gratuities'],
            itinerary: row.itinerary || [
              { time: '08:00', title: 'Hotel Pickup', description: 'Air-conditioned transport' },
              { time: '14:00', title: 'Return Journey', description: 'Drop off at your accommodation' }
            ],
            durationHours: Number(row.duration_hours) || 4,
            pickupAvailable: Boolean(row.pickup_available ?? true),
            pickupLocations: row.pickup_locations || 'Ubud, Sanur, Kuta, Seminyak, Canggu',
            meetingPoint: row.meeting_point || 'Lobby of your accommodation',
            priceOriginal: Number(row.price_original) || Number(row.price_discounted),
            priceDiscounted: Number(row.price_discounted) || 0,
            rating: Number(row.rating) || 5.0,
            reviewCount: Number(row.review_count) || 0,
            cancellationPolicy: row.cancellation_policy || 'Free cancellation up to 24 hours in advance',
            badge: row.badge || 'Popular',
            travelerType: row.traveler_type || 'Adventure',
            images: sortedImages.length > 0 ? sortedImages : ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80'],
            status: (row.status as 'published' | 'draft') || 'published',
            isFeatured: Boolean(row.is_featured),
            isTrending: Boolean(row.is_trending),
          };
        });

        const dbSlugs = new Set(mapped.map((m) => m.slug));
        list = [...mapped, ...list.filter((a) => !dbSlugs.has(a.slug))];
      }
    } catch (err) {
      console.warn('Could not fetch activities from Supabase:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('custom_activities');
      if (stored) {
        const custom: Activity[] = JSON.parse(stored);
        if (Array.isArray(custom) && custom.length > 0) {
          // Merge custom activities avoiding duplicates
          const customSlugs = new Set(custom.map((c) => c.slug));
          list = [...custom, ...list.filter((a) => !customSlugs.has(a.slug))];
        }
      }
    } catch (e) {
      console.error('Failed to read custom_activities from localStorage', e);
    }
  }

  if (params?.query) {
    const q = params.query.toLowerCase();
    list = list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.locationName.toLowerCase().includes(q) ||
        a.shortDescription.toLowerCase().includes(q)
    );
  }

  if (params?.destinationSlug) {
    list = list.filter((a) => a.destinationSlug === params.destinationSlug);
  }

  if (params?.categorySlug) {
    list = list.filter((a) => a.categorySlug === params.categorySlug);
  }

  if (params?.travelerType) {
    list = list.filter((a) => a.travelerType === params.travelerType);
  }

  if (params?.maxPrice) {
    list = list.filter((a) => a.priceDiscounted <= params.maxPrice!);
  }

  if (params?.minRating) {
    list = list.filter((a) => a.rating >= params.minRating!);
  }

  if (params?.badge) {
    list = list.filter((a) => a.badge === params.badge);
  }

  if (params?.sort) {
    if (params.sort === 'price-low') {
      list.sort((a, b) => a.priceDiscounted - b.priceDiscounted);
    } else if (params.sort === 'price-high') {
      list.sort((a, b) => b.priceDiscounted - a.priceDiscounted);
    } else if (params.sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (params.sort === 'popular') {
      list.sort((a, b) => b.reviewCount - a.reviewCount);
    }
  }

  return list;
}

export async function getActivityBySlug(slug: string): Promise<Activity | null> {
  const activities = await getActivities();
  return activities.find((a) => a.slug === slug) || null;
}

export async function getReviewsForActivity(activityId: string): Promise<Review[]> {
  return INITIAL_REVIEWS.filter((r) => r.activityId === activityId);
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  return INITIAL_BLOG_POSTS;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return INITIAL_BLOG_POSTS.find((p) => p.slug === slug) || null;
}
