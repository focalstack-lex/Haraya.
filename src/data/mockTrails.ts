import type { Trail } from '../types/coffee';

export const mockTrails: Trail[] = [
  {
    id: 'trail-poblacion',
    name: 'Poblacion Specialty Loop',
    description:
      'Four stops inside the old town grid: start with a flat white at the roastery, walk to the demitasse bar, cross to the glasshouse patio, and finish with the Durian Coffee institution.',
    cafeIds: ['cafe-purge', 'cafe-demitasse', 'cafe-glasshouse', 'cafe-blugre'],
    focus: 'Espresso classics and heritage streets',
  },
  {
    id: 'trail-bajada',
    name: 'Bajada Work and Brew Run',
    description:
      'The remote work circuit: brunch tables at Fourth Street, a tasting counter detour at Stash, then the fiber-speed call booths of Lanang with a bottomless cold brew.',
    cafeIds: ['cafe-fourthstreet', 'cafe-stash', 'cafe-lanang'],
    focus: 'Plugs, fiber WiFi, and refills',
  },
  {
    id: 'trail-highlands',
    name: 'Highland Origin Trail',
    description:
      'Chase the bean to its birthplace: market-side robusta at Toril, then the winding climb to the farm-gate roastery on the Apo slopes for an anaerobic pour over at altitude.',
    cafeIds: ['cafe-kmzero', 'cafe-apohighlands'],
    focus: 'Farm-gate roasts on the Apo slopes',
  },
  {
    id: 'trail-north-coast',
    name: 'North Davao to Mati Coast',
    description:
      'The long haul for completists: honey lattes at the Tagum courtyard, value bags at the Panabo bean room, then hammocks and the sunrise side of every cup on the Mati Baywalk.',
    cafeIds: ['cafe-tagum', 'cafe-panabo', 'cafe-maticoast'],
    focus: 'North highway stops to the Mati bay',
  },
];
