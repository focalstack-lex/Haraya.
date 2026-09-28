import type { Cafe, WeeklyHours } from '../types/coffee';

/**
 * Curated spots listed by the Haraya team, shown ahead of roaster and community listings. Every field comes
 * from a checked source: the venue's Google Business listing (address, coordinates, hours, price range, menu
 * prices) and photos from Lex's own spot folder (`Haraya Files/Haraya Coffee Spots/`). A field the sources do
 * not state stays empty (no signature, Wi-Fi speed or brew methods) rather than being guessed.
 */

const everyDay = (open: string, close: string): WeeklyHours => ({
  Monday: { open, close },
  Tuesday: { open, close },
  Wednesday: { open, close },
  Thursday: { open, close },
  Friday: { open, close },
  Saturday: { open, close },
  Sunday: { open, close },
});

const GREEN_COFFEE_PHOTOS = '/spots/green-coffee-digos';

export const CURATED_CAFES: Cafe[] = [
  {
    // Google Business listing /g/11f3tw8x95, checked 2026-09-29.
    id: 'curated-green-coffee-digos',
    handle: 'green-coffee-digos',
    name: 'Green Coffee',
    isRoastery: false,
    city: 'Digos City',
    district: 'Digos',
    address: 'Quezon Avenue corner Rizal Avenue, Digos Junction Road, Digos City, Davao del Sur',
    lat: 6.7548589,
    lng: 125.3555501,
    images: [
      `${GREEN_COFFEE_PHOTOS}/storefront.webp`,
      `${GREEN_COFFEE_PHOTOS}/interior.webp`,
      `${GREEN_COFFEE_PHOTOS}/grinder.webp`,
      `${GREEN_COFFEE_PHOTOS}/planters.webp`,
    ],
    logoUrl: `${GREEN_COFFEE_PHOTOS}/storefront.webp`,
    description:
      'Corner coffee shop on Quezon Avenue at Rizal Avenue, by the Digos junction. A glass-front dining room with a mezzanine upstairs and a covered terrace out front, open from 7 in the morning until 2 at night every day.',
    signature: '',
    menu: [
      { name: 'Caramel Macchiato', price: 220, category: 'Espresso Bar' },
      { name: 'Caramel Blended Coffee', price: 215, category: 'Signature' },
      { name: 'Cheezy Pork Floss', price: 145, category: 'Pastry' },
    ],
    amenities: ['outdoor', 'lateNight'],
    wifiMbps: 0,
    brewMethods: [],
    priceLevel: 2,
    hours: everyDay('07:00', '02:00'),
    vibeTags: ['Open late', 'Terrace seating'],
    verified: false,
    saveCount: 0,
    viewCount: 0,
    dateAdded: '2026-09-29',
  },
];
