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
    text: "Hi, I'm Aya. Let me show you around. Search for a cafe, an area like Poblacion, or something like quiet or Wi-Fi.",
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
    text: 'Not sure where to go? Tell Aya how you feel and she suggests a cafe that fits, near you.',
    advance: 'next',
    aya: 'mood',
  },
  {
    target: 'save',
    text: 'Save a spot you would try. Tap the bookmark.',
    advance: 'action',
    aya: 'holding-cup',
  },
  {
    target: 'tab-profile',
    text: 'Everything you save lives in Saved Spots.',
    advance: 'next',
    aya: 'holding-cup',
  },
  {
    target: 'tab-map',
    text: 'See every spot on the map. Tap Directions on any spot and Haraya can walk you there.',
    advance: 'next',
    aya: 'holding-cup',
  },
  {
    target: 'tab-submit',
    text: 'Know a quiet corner that is not on Google Maps? Add it here. Enjoy your next cup.',
    advance: 'next',
    aya: 'welcome',
  },
];
