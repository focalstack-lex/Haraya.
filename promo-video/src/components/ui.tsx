import React from 'react';
import { interpolateColors } from 'remotion';
import { fontFamily } from '../fonts';
import { color, radius, shadow } from '../theme';

/**
 * Puts children with their center at (x, y) in video pixels, scaled and rotated about that center. Recreated app
 * UI is built at app pixel sizes and scaled here, so its radii, type and shadows keep the app's proportions.
 */
export const Place: React.FC<{
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  opacity?: number;
  z?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ x, y, scale = 1, rotate = 0, opacity = 1, z, style, children }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      // Size to the content: an absolute box near the right edge would otherwise only get the width left of it
      width: 'max-content',
      transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
      opacity,
      zIndex: z,
      ...style,
    }}
  >
    {children}
  </div>
);

/** A surface card floating over a stage: the app's card, with a lifted shadow and a glassy top edge. */
export const GlassCard: React.FC<{ width?: number; round?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  width,
  round = radius.card,
  style,
  children,
}) => (
  <div
    style={{
      width,
      borderRadius: round,
      background: 'rgba(255, 253, 249, 0.96)',
      boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.9), ${shadow.lifted}`,
      border: '0.5px solid rgba(228, 217, 200, 0.9)',
      fontFamily,
      color: color.ink,
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

/** The app's Chip: fill at rest, ink when active. `on` blends between the two (0 rest, 1 active). */
export const Chip: React.FC<{
  label: string;
  on?: number;
  icon?: React.ReactNode;
  height?: number;
  size?: number;
  style?: React.CSSProperties;
}> = ({ label, on = 0, icon, height = 36, size = 15, style }) => (
  <div
    style={{
      height,
      padding: `0 ${height * 0.42}px`,
      borderRadius: height / 2,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: interpolateColors(on, [0, 1], [color.fill, color.ink]),
      color: interpolateColors(on, [0, 1], [color.ink, color.surface]),
      fontFamily,
      fontSize: size,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {icon}
    {label}
  </div>
);

/** A chip for dark stages: a translucent light pill with an icon in a tinted square, like the app's row icons. */
export const DarkChip: React.FC<{ label: string; icon: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({
  label,
  icon,
  size = 34,
  style,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: size * 0.5,
      height: size * 2.3,
      padding: `0 ${size * 0.9}px 0 ${size * 0.4}px`,
      borderRadius: size * 1.15,
      background: 'rgba(255, 253, 249, 0.07)',
      border: '1.5px solid rgba(255, 253, 249, 0.14)',
      boxShadow: 'inset 0 1px 0 rgba(255, 253, 249, 0.1), 0 18px 50px -20px rgba(0, 0, 0, 0.6)',
      fontFamily,
      fontSize: size,
      fontWeight: 600,
      color: color.surface,
      letterSpacing: '-0.015em',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    <span
      style={{
        width: size * 1.55,
        height: size * 1.55,
        borderRadius: size * 0.45,
        background: 'rgba(231, 172, 103, 0.16)',
        color: color.steam,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </span>
    {label}
  </div>
);

/** The app's primary pill button: tint with surface text. */
export const PrimaryButton: React.FC<{ label: string; icon?: React.ReactNode; height?: number; size?: number; style?: React.CSSProperties }> = ({
  label,
  icon,
  height = 48,
  size = 16,
  style,
}) => (
  <div
    style={{
      height,
      padding: `0 ${height * 0.5}px`,
      borderRadius: height / 2,
      background: color.tint,
      color: color.surface,
      fontFamily,
      fontSize: size,
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {label}
    {icon}
  </div>
);
