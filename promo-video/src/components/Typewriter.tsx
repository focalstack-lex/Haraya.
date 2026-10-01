import React from 'react';
import { useCurrentFrame } from 'remotion';
import { fontFamily } from '../fonts';
import { TYPE_FRAMES_PER_CHAR } from '../timeline';

export interface TypewriterProps {
  text: string;
  /** Frame (inside the scene) the first character appears. */
  at: number;
  /** Frame (inside the scene) the caret starts blinking before typing begins. */
  caretFrom?: number;
  /** Frame the caret disappears; it keeps blinking until then. */
  caretUntil?: number;
  perChar?: number;
  size: number;
  weight?: number;
  color: string;
  caretColor: string;
  tracking?: string;
  style?: React.CSSProperties;
}

/**
 * Characters appear one by one with a caret. The untyped rest is laid out but transparent, so centered text
 * never shifts while it types.
 */
export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  at,
  caretFrom = at,
  caretUntil,
  perChar = TYPE_FRAMES_PER_CHAR,
  size,
  weight = 300,
  color,
  caretColor,
  tracking = '-0.03em',
  style,
}) => {
  const frame = useCurrentFrame();
  const shown = frame < at ? 0 : Math.min(text.length, Math.floor((frame - at) / perChar) + 1);
  const typing = frame >= at && shown < text.length;
  // Solid while typing, blinking at rest: 18 frames on, 14 off
  const blinkOn = typing || (frame - caretFrom) % 32 < 18;
  const caretVisible = frame >= caretFrom && (caretUntil === undefined || frame < caretUntil) && blinkOn;

  return (
    <div style={{ fontFamily, fontSize: size, fontWeight: weight, color, letterSpacing: tracking, lineHeight: 1.1, whiteSpace: 'pre', ...style }}>
      <span>{text.slice(0, shown)}</span>
      <span
        style={{
          display: 'inline-block',
          width: Math.max(3, size * 0.055),
          height: size * 0.92,
          marginLeft: size * 0.04,
          marginRight: -size * 0.04 - Math.max(3, size * 0.055),
          verticalAlign: '-0.12em',
          borderRadius: size * 0.03,
          background: caretColor,
          opacity: caretVisible ? 1 : 0,
        }}
      />
      <span style={{ color: 'transparent' }}>{text.slice(shown)}</span>
    </div>
  );
};
