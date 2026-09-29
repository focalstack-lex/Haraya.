import type { TourOutcome } from '../tour/tourSteps';

export type InstallPlatform = 'android' | 'ios' | 'in-app' | 'desktop';
export type InstallMode = 'installed' | 'native-prompt' | 'ios-steps' | 'android-menu' | 'open-in-browser' | 'unavailable';

const IN_APP = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|musical_ly|BytedanceWebview|\bLine\//i;

export function detectInstallPlatform(userAgent: string, maxTouchPoints: number): InstallPlatform {
  if (IN_APP.test(userAgent)) return 'in-app';
  // iPadOS reports a Mac UA; a touch screen gives it away
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'desktop';
}

export function resolveInstallMode(platform: InstallPlatform, { standalone, hasDeferredPrompt }: { standalone: boolean; hasDeferredPrompt: boolean }): InstallMode {
  if (standalone) return 'installed';
  if (platform === 'in-app') return 'open-in-browser';
  if (platform === 'ios') return 'ios-steps';
  if (hasDeferredPrompt) return 'native-prompt';
  return platform === 'android' ? 'android-menu' : 'unavailable';
}

export function shouldOfferAfterTour({ outcome, alreadyOffered, platform, mode }: { outcome: TourOutcome; alreadyOffered: boolean; platform: InstallPlatform; mode: InstallMode }): boolean {
  return outcome === 'done' && !alreadyOffered && platform !== 'desktop' && mode !== 'installed' && mode !== 'unavailable';
}
