/** Which set of steps fits the visitor's device. */
export type DevicePlatform = 'android' | 'ios' | 'desktop';

/** iPadOS reports itself as a Mac, so a Mac with a touch screen counts as iOS. */
export function devicePlatform(userAgent: string, maxTouchPoints: number): DevicePlatform {
  if (/Android/i.test(userAgent)) return 'android';
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) return 'ios';
  return 'desktop';
}

export type LocationProblem = 'denied' | 'unavailable' | 'insecure';

/**
 * What stops Haraya from seeing the visitor's location, and how to fix it on their device. A web page cannot open
 * the phone's or the browser's settings itself, so the steps say where to go.
 */
export function locationFix(problem: LocationProblem, platform: DevicePlatform): { title: string; steps: string } {
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
  }
}
