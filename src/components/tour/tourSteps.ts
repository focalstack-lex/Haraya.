import type { AyaPose } from '../common/AyaMascot';

/**
 * First-visit guided tour steps. Each step highlights the element tagged with the matching
 * `data-tour` attribute; 'action' steps wait for the visitor to tap that element instead of Next.
 */
export interface TourStep {
  target: string;
  text: string;
  advance: 'next' | 'action';
  /** Aya's pose in the callout; she greets on the first step and waves goodbye on the last. */
  aya: AyaPose;
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'search',
    text: "Hi, I'm Aya. Let me show you around. Search anything: a cafe, a bean, an origin like Mt. Apo, or a note like chocolate.",
    advance: 'next',
    aya: 'welcome',
  },
  {
    target: 'city',
    text: 'Pick your city. Discover, the map and Most saved all follow it.',
    advance: 'next',
    aya: 'holding-cup',
  },
  {
    target: 'mood',
    text: 'Not sure where to go? Tap how you feel and Haraya suggests a cafe that fits, near you.',
    advance: 'next',
    aya: 'mood',
  },
  {
    target: 'categories',
    text: 'Shortcuts. Work finds laptop-friendly cafes, Pour-Over finds hand-brew bars.',
    advance: 'next',
    aya: 'holding-cup',
  },
  {
    target: 'save',
    text: 'Save a cafe you would try. Tap the bookmark.',
    advance: 'action',
    aya: 'drops',
  },
  {
    target: 'tab-profile',
    text: 'Everything you save lives in Profile.',
    advance: 'next',
    aya: 'holding-cup',
  },
  {
    target: 'tab-map',
    text: 'See every cafe on the map, plus walking trails between them. Enjoy your next cup.',
    advance: 'next',
    aya: 'welcome',
  },
];
