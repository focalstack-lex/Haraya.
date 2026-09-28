/**
 * First-visit guided tour steps. Each step highlights the element tagged with the matching
 * `data-tour` attribute; 'action' steps wait for the visitor to tap that element instead of Next.
 */
export interface TourStep {
  target: string;
  text: string;
  advance: 'next' | 'action';
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'search',
    text: 'Search anything: a cafe, a bean, an origin like Mt. Apo, or a note like chocolate.',
    advance: 'next',
  },
  {
    target: 'city',
    text: 'Pick your city. Discover, the map and Most saved all follow it.',
    advance: 'next',
  },
  {
    target: 'categories',
    text: 'Shortcuts. Work finds laptop-friendly cafes, Pour-Over finds hand-brew bars.',
    advance: 'next',
  },
  {
    target: 'save',
    text: 'Save a cafe you would try. Tap the bookmark.',
    advance: 'action',
  },
  {
    target: 'tab-profile',
    text: 'Everything you save lives in Profile.',
    advance: 'next',
  },
  {
    target: 'tab-map',
    text: 'See every cafe on the map, plus walking trails between them.',
    advance: 'next',
  },
];
