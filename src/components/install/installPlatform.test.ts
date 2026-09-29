import { describe, expect, it } from 'vitest';
import { detectInstallPlatform, resolveInstallMode, shouldOfferAfterTour } from './installPlatform';
import type { TourOutcome } from '../tour/tourSteps';

describe('detectInstallPlatform', () => {
  describe('iOS detection', () => {
    it('iPhone Safari UA gives ios', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
      expect(detectInstallPlatform(ua, 5)).toBe('ios');
    });

    it('Chrome on iOS (CriOS) gives ios', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/117.0.5938.149 Mobile/15E148 Safari/604.1';
      expect(detectInstallPlatform(ua, 5)).toBe('ios');
    });

    it('iPad desktop-mode UA with maxTouchPoints 5 gives ios', () => {
      const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';
      expect(detectInstallPlatform(ua, 5)).toBe('ios');
    });

    it('iPad desktop-mode UA with maxTouchPoints 0 gives desktop', () => {
      const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';
      expect(detectInstallPlatform(ua, 0)).toBe('desktop');
    });
  });

  describe('Android detection', () => {
    it('Pixel Chrome UA gives android', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.149 Mobile Safari/537.36';
      expect(detectInstallPlatform(ua, 5)).toBe('android');
    });

    it('Samsung Internet UA gives android', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 13; SM-S901U Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/110.0.5481.65 Mobile Safari/537.36';
      expect(detectInstallPlatform(ua, 5)).toBe('android');
    });
  });

  describe('In-app detection (highest priority)', () => {
    it('Android UA with FB_IAB/FB4A;FBAV/ gives in-app, not android', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.149 Mobile Safari/537.36 FB_IAB/FB4A;FBAV/424.0.0.0.42';
      expect(detectInstallPlatform(ua, 5)).toBe('in-app');
    });

    it('iPhone UA with FBAN/MessengerForiOS gives in-app', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 FBAN/MessengerForiOS FBIOS/424.0.0.42 FBBV/424.0.0.0.42';
      expect(detectInstallPlatform(ua, 5)).toBe('in-app');
    });

    it('UA with Instagram 300.0 gives in-app', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.149 Mobile Safari/537.36 Instagram 300.0';
      expect(detectInstallPlatform(ua, 5)).toBe('in-app');
    });

    it('UA with musical_ly (TikTok) gives in-app', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly';
      expect(detectInstallPlatform(ua, 5)).toBe('in-app');
    });
  });

  describe('Desktop detection', () => {
    it('Windows Chrome gives desktop', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.149 Safari/537.36';
      expect(detectInstallPlatform(ua, 0)).toBe('desktop');
    });
  });
});

describe('resolveInstallMode', () => {
  it('standalone true gives installed for every platform', () => {
    expect(resolveInstallMode('android', { standalone: true, hasDeferredPrompt: false })).toBe('installed');
    expect(resolveInstallMode('ios', { standalone: true, hasDeferredPrompt: false })).toBe('installed');
    expect(resolveInstallMode('desktop', { standalone: true, hasDeferredPrompt: false })).toBe('installed');
    expect(resolveInstallMode('in-app', { standalone: true, hasDeferredPrompt: false })).toBe('installed');
  });

  it('in-app gives open-in-browser', () => {
    expect(resolveInstallMode('in-app', { standalone: false, hasDeferredPrompt: false })).toBe('open-in-browser');
    expect(resolveInstallMode('in-app', { standalone: false, hasDeferredPrompt: true })).toBe('open-in-browser');
  });

  it('ios gives ios-steps, even with hasDeferredPrompt true', () => {
    expect(resolveInstallMode('ios', { standalone: false, hasDeferredPrompt: true })).toBe('ios-steps');
    expect(resolveInstallMode('ios', { standalone: false, hasDeferredPrompt: false })).toBe('ios-steps');
  });

  it('android with the prompt gives native-prompt', () => {
    expect(resolveInstallMode('android', { standalone: false, hasDeferredPrompt: true })).toBe('native-prompt');
  });

  it('android without the prompt gives android-menu', () => {
    expect(resolveInstallMode('android', { standalone: false, hasDeferredPrompt: false })).toBe('android-menu');
  });

  it('desktop with the prompt gives native-prompt', () => {
    expect(resolveInstallMode('desktop', { standalone: false, hasDeferredPrompt: true })).toBe('native-prompt');
  });

  it('desktop without the prompt gives unavailable', () => {
    expect(resolveInstallMode('desktop', { standalone: false, hasDeferredPrompt: false })).toBe('unavailable');
  });
});

describe('shouldOfferAfterTour', () => {
  it('done, not offered, android, native-prompt gives true', () => {
    const outcome: TourOutcome = 'done';
    expect(
      shouldOfferAfterTour({
        outcome,
        alreadyOffered: false,
        platform: 'android',
        mode: 'native-prompt',
      })
    ).toBe(true);
  });

  it('skipped gives false', () => {
    const outcome: TourOutcome = 'skipped';
    expect(
      shouldOfferAfterTour({
        outcome,
        alreadyOffered: false,
        platform: 'android',
        mode: 'native-prompt',
      })
    ).toBe(false);
  });

  it('alreadyOffered gives false', () => {
    const outcome: TourOutcome = 'done';
    expect(
      shouldOfferAfterTour({
        outcome,
        alreadyOffered: true,
        platform: 'android',
        mode: 'native-prompt',
      })
    ).toBe(false);
  });

  it('desktop gives false', () => {
    const outcome: TourOutcome = 'done';
    expect(
      shouldOfferAfterTour({
        outcome,
        alreadyOffered: false,
        platform: 'desktop',
        mode: 'native-prompt',
      })
    ).toBe(false);
  });

  it('installed gives false', () => {
    const outcome: TourOutcome = 'done';
    expect(
      shouldOfferAfterTour({
        outcome,
        alreadyOffered: false,
        platform: 'android',
        mode: 'installed',
      })
    ).toBe(false);
  });

  it('ios with ios-steps gives true', () => {
    const outcome: TourOutcome = 'done';
    expect(
      shouldOfferAfterTour({
        outcome,
        alreadyOffered: false,
        platform: 'ios',
        mode: 'ios-steps',
      })
    ).toBe(true);
  });

  it('in-app with open-in-browser gives true', () => {
    const outcome: TourOutcome = 'done';
    expect(
      shouldOfferAfterTour({
        outcome,
        alreadyOffered: false,
        platform: 'in-app',
        mode: 'open-in-browser',
      })
    ).toBe(true);
  });
});
