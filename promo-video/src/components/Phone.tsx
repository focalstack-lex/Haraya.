import React from 'react';
import { Img, staticFile } from 'remotion';
import { color } from '../theme';

/** Captures are 390 by 844 app pixels (public/screens, written by scripts/capture-screens.mjs). */
export const SCREEN_ASPECT = 390 / 844;

/** Outer height of a phone of the given width. */
export const phoneHeight = (width: number): number => (width * (1 - 0.068)) / SCREEN_ASPECT / (1 - 0.034);

/** Where the screen sits inside a phone of the given width, and how many video pixels one app pixel takes. */
export const screenMetrics = (width: number) => {
  const outer = phoneHeight(width);
  const left = width * 0.034;
  const top = outer * 0.017;
  const screenWidth = width - left * 2;
  return { left, top, width: screenWidth, height: outer - top * 2, pixel: screenWidth / 390 };
};

/**
 * The brand's line-art iPhone from the landing page (147 by 293 units: 5-unit stroke, 19-unit corners, a 41 by 11
 * Dynamic Island 13 units from the top), with the height fitted to a 390 by 844 screen so captures are not cropped.
 */
export const Phone: React.FC<{
  width: number;
  src?: string;
  /** Screen image offset in app pixels, to scroll a capture inside the screen. */
  scrollY?: number;
  line?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, src, scrollY = 0, line = color.ink, children, style }) => {
  const unit = width / 147;
  const stroke = 5 * unit;
  const corner = 19 * unit;
  const height = phoneHeight(width);
  const screen = screenMetrics(width);
  const screenLeft = screen.left;
  const screenTop = screen.top;
  const screenWidth = screen.width;
  const screenHeight = screen.height;
  const pixel = screen.pixel;

  return (
    <div style={{ position: 'relative', width, height, ...style }}>
      <div
        style={{
          position: 'absolute',
          inset: stroke * 0.5,
          borderRadius: corner,
          boxShadow: '0 40px 60px -24px rgba(19, 25, 31, 0.42), 0 12px 24px -12px rgba(19, 25, 31, 0.25)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: screenLeft,
          top: screenTop,
          width: screenWidth,
          height: screenHeight,
          borderRadius: corner - stroke * 0.6,
          overflow: 'hidden',
          background: color.canvas,
        }}
      >
        {src && (
          <Img
            src={staticFile(src)}
            style={{ position: 'absolute', left: 0, top: -scrollY * pixel, width: '100%', display: 'block' }}
          />
        )}
        {children}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <rect x={stroke / 2} y={stroke / 2} width={width - stroke} height={height - stroke} rx={corner} fill="none" stroke={line} strokeWidth={stroke} />
        <rect x={(width - 41 * unit) / 2} y={13 * unit} width={41 * unit} height={11 * unit} rx={5.5 * unit} fill={line} />
      </svg>
    </div>
  );
};
