import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { glideEase, progress } from '../lib/motion';

const VARIANTS = {
  /** Mountain, steam, name and "Find your daily cup." (public/brand/haraya-logo.png, 720 by 404). */
  full: { src: 'brand/haraya-logo.png', aspect: 404 / 720 },
  /** Mountain and name (public/brand/haraya-wordmark.png, 480 by 268). */
  wordmark: { src: 'brand/haraya-wordmark.png', aspect: 268 / 480 },
} as const;

/**
 * The brand logo image, never retyped, as `BrandLogo` in the app. A light band can sweep across it, masked to the
 * logo's own shape so it only lights the ink.
 */
export const Logo: React.FC<{ width: number; variant?: keyof typeof VARIANTS; shineAt?: number }> = ({ width, variant = 'full', shineAt }) => {
  const frame = useCurrentFrame();
  const { src, aspect } = VARIANTS[variant];
  const height = width * aspect;
  const t = shineAt === undefined ? 0 : progress(frame, shineAt, 50, glideEase);
  const band = t * 150 - 30;

  return (
    <div style={{ position: 'relative', width, height }}>
      <Img src={staticFile(src)} style={{ width, height, display: 'block' }} />
      {t > 0 && t < 1 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            WebkitMaskImage: `url(${staticFile(src)})`,
            WebkitMaskSize: '100% 100%',
            maskImage: `url(${staticFile(src)})`,
            maskSize: '100% 100%',
            background: `linear-gradient(105deg, rgba(255, 246, 238, 0) ${band - 14}%, rgba(255, 233, 202, 0.95) ${band}%, rgba(255, 246, 238, 0) ${band + 14}%)`,
          }}
        />
      )}
    </div>
  );
};
