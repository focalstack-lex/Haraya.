import { describe, expect, it } from 'vitest';
import { devicePlatform, locationFix } from './locationFix';

const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD_AS_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

describe('devicePlatform', () => {
  it('tells Android, iPhone and desktop apart', () => {
    expect(devicePlatform(ANDROID, 5)).toBe('android');
    expect(devicePlatform(IPHONE, 5)).toBe('ios');
    expect(devicePlatform(WINDOWS, 0)).toBe('desktop');
  });

  it('counts an iPad that reports itself as a Mac as iOS, but not a real Mac', () => {
    expect(devicePlatform(IPAD_AS_MAC, 5)).toBe('ios');
    expect(devicePlatform(IPAD_AS_MAC, 0)).toBe('desktop');
  });
});

describe('locationFix', () => {
  it('points Android at the site permission for a blocked site and at the quick settings when location is off', () => {
    expect(locationFix('denied', 'android').steps).toContain('Permissions');
    expect(locationFix('unavailable', 'android').steps).toContain('Swipe down');
  });

  it('points iPhone at Location Services', () => {
    expect(locationFix('denied', 'ios').steps).toContain('Location Services');
    expect(locationFix('unavailable', 'ios').steps).toContain('Location Services');
  });

  it('explains a page that is not https the same way on every device', () => {
    expect(locationFix('insecure', 'android')).toEqual(locationFix('insecure', 'desktop'));
  });
});
