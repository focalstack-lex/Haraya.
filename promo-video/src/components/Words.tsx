import React from 'react';
import { useCurrentFrame } from 'remotion';
import { fontFamily } from '../fonts';
import { exitEase, progress, riseEase } from '../lib/motion';

interface Token {
  word: string;
  accent: boolean;
  light: boolean;
}

/**
 * "*word*" gets the keyword fill, "~word~" is set light. Markers can span several words:
 * "Find your daily cup in *Davao.*" or "~Not just the~ closest cafe."
 */
const tokenize = (text: string): Token[] => {
  let accent = false;
  let light = false;
  return text.split(' ').filter(Boolean).map((raw) => {
    let word = raw;
    const opensAccent = word.startsWith('*');
    const opensLight = word.startsWith('~');
    if (opensAccent) accent = true;
    if (opensLight) light = true;
    word = word.replace(/^[*~]+/, '');
    const closesAccent = word.endsWith('*');
    const closesLight = word.endsWith('~');
    word = word.replace(/[*~]+$/, '');
    const token = { word, accent, light };
    if (closesAccent) accent = false;
    if (closesLight) light = false;
    return token;
  });
};

export interface WordsProps {
  text: string;
  /** Frame (inside the scene) the first word starts rising. */
  at: number;
  size: number;
  weight?: number;
  color: string;
  /** CSS gradient for accent words. */
  accentFill?: string;
  stagger?: number;
  length?: number;
  /** Frame the words start leaving; they lift and blur away together. */
  exitAt?: number;
  align?: 'left' | 'center' | 'right';
  tracking?: string;
  lineHeight?: number;
  maxWidth?: number;
  style?: React.CSSProperties;
}

/** Word-by-word rise out of blur, the reference's main type move. */
export const Words: React.FC<WordsProps> = ({
  text,
  at,
  size,
  weight = 700,
  color,
  accentFill,
  stagger = 5,
  length = 26,
  exitAt,
  align = 'center',
  tracking = '-0.035em',
  lineHeight = 1.06,
  maxWidth,
  style,
}) => {
  const frame = useCurrentFrame();
  const tokens = tokenize(text);
  const out = exitAt === undefined ? 0 : progress(frame, exitAt, 18, exitEase);

  return (
    <div
      style={{
        fontFamily,
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: tracking,
        lineHeight,
        textAlign: align,
        maxWidth,
        textWrap: 'balance',
        ...style,
      }}
    >
      {tokens.map((token, index) => {
        const p = progress(frame, at + index * stagger, length, riseEase);
        const lift = out * (0.35 + index * 0.02);
        return (
          <React.Fragment key={`${token.word}-${index}`}>
            <span
              style={{
                display: 'inline-block',
                opacity: p * (1 - out) * (token.light ? 0.72 : 1),
                transform: `translateY(${(1 - p) * 0.42 - lift}em)`,
                filter: `blur(${(1 - p) * 12 + out * 14}px)`,
                fontWeight: token.light ? 300 : undefined,
                ...(token.accent && accentFill
                  ? { backgroundImage: accentFill, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: '0.08em' }
                  : {}),
              }}
            >
              {token.word}
            </span>
            {index < tokens.length - 1 ? ' ' : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};
