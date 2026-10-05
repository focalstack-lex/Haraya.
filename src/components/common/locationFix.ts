/** Which set of steps fits the visitor's device. */
export type DevicePlatform = 'android' | 'ios' | 'desktop';

/** iPadOS reports itself as a Mac, so a Mac with a touch screen counts as iOS. */
export function devicePlatform(userAgent: string, maxTouchPoints: number): DevicePlatform {
  if (/Android/i.test(userAgent)) return 'android';
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) return 'ios';
  return 'desktop';
}

/**
 * denied, unavailable and insecure: no position at all. approximate and rough: a position, but a wide one
 * (locationQuality.ts): the right neighbourhood with precise location off, or a network guess that can be a
 * town away.
 */
export type LocationProblem = 'denied' | 'unavailable' | 'insecure' | 'approximate' | 'rough';

const DESKTOP_GUESS =
  'A computer guesses its location from Wi-Fi or the network, so it can be off by a town. For the spots around you, open Haraya on your phone with Location on.';

/**
 * What stops Haraya from seeing the visitor's location (or seeing it well), and how to fix it on their device. A
 * web page cannot open the phone's or the browser's settings itself, so the steps say where to go. `accuracy` is
 * the formatted radius of a wide fix ("about 2 km"), shown in the title.
 */
export function locationFix(problem: LocationProblem, platform: DevicePlatform, accuracy?: string): { title: string; steps: string } {
  switch (problem) {
    case 'insecure':
      return {
        title: 'Location needs a secure connection',
        steps: 'Browsers only share your location with https pages. Open Haraya at haraya.space to use it.',
      };
    case 'denied':
      return {
        title: 'Location is blocked for Haraya',
        steps:
          platform === 'android'
            ? 'Tap the icon left of the address bar, open Permissions or Site settings, and set Location to Allow.'
            : platform === 'ios'
              ? 'Open Settings, then Privacy & Security, then Location Services. Turn it on and set your browser to While Using the App.'
              : 'Click the icon left of the address bar and set Location to Allow.',
      };
    case 'unavailable':
      return {
        title: "Can't get your location",
        steps:
          platform === 'android'
            ? 'Swipe down from the top of the screen and turn on Location.'
            : platform === 'ios'
              ? 'Open Settings, then Privacy & Security, and turn on Location Services.'
              : "Turn on location in your computer's privacy settings.",
      };
    case 'approximate':
      return {
        title: `Your location is approximate${accuracy ? ` (${accuracy})` : ''}`,
        steps:
          platform === 'android'
            ? 'Precise location looks off for your browser. Open Settings, then Apps, then your browser, then Permissions, then Location, and turn on Use precise location.'
            : platform === 'ios'
              ? 'Precise Location looks off for your browser. Open Settings, then Privacy & Security, then Location Services, then your browser, and turn on Precise Location.'
              : DESKTOP_GUESS,
      };
    case 'rough':
      return {
        title: `Your location is only a rough guess${accuracy ? ` (${accuracy})` : ''}`,
        steps:
          platform === 'desktop'
            ? DESKTOP_GUESS
            : 'This fix came from the network, not GPS, so the dot can be a town away. Turn on Location with GPS, step outside or near a window, and try again.',
      };
  }
}
