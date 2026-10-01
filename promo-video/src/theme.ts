/**
 * Haraya's tokens, copied from the app's `src/index.css` @theme block, plus Aya's master palette
 * (`src/components/common/AyaMascot.tsx`) and the blue "You" dot the map uses (`DavaoCoffeeMap.tsx`).
 */
export const color = {
  canvas: '#FAF5EB',
  surface: '#FFFDF9',
  sunken: '#F2EAE0',
  hairline: '#E4D9C8',
  ink: '#13191F',
  ink2: '#594C3D',
  ink3: '#6E6150',
  tint: '#906D4B',
  tintInk: '#7D5C3D',
  shade: '#766046',
  ok: '#3E5C48',
  danger: '#8C3A2E',
  star: '#CA9C68',
  steam: '#E7AC67',
  roast: '#574835',
  tan: '#997247',
  cream: '#FFF6EE',
  coffee: '#FFC183',
  peach: '#FFE9CA',
  you: '#2F6FDB',
  /** --ios-fill: the resting fill of chips, fields and secondary buttons. */
  fill: 'rgba(118, 96, 70, 0.12)',
  /** --ios-separator: the 0.5px hairline between grouped rows. */
  separator: 'rgba(89, 76, 61, 0.2)',
} as const;

/** App radii in app pixels: controls, grouped rows, cards, sheets. */
export const radius = { control: 10, row: 14, card: 20, sheet: 28 } as const;

/** App shadows in app pixels. */
export const shadow = {
  card: '0 0.5px 1px rgba(19, 25, 31, 0.06), 0 6px 20px -6px rgba(19, 25, 31, 0.14)',
  float: '0 4px 24px -4px rgba(19, 25, 31, 0.12), 0 1px 3px rgba(19, 25, 31, 0.04)',
  sheet: '0 -8px 40px rgba(19, 25, 31, 0.18)',
  /** A card floating over a video stage: the app's card shadow, deepened for distance. */
  lifted: '0 1px 2px rgba(19, 25, 31, 0.08), 0 28px 60px -18px rgba(19, 25, 31, 0.32)',
} as const;

/** Keyword fills. Both hold large-text contrast on their stage (coffee to steam on River Styx, tint to roast on linen). */
export const gradient = {
  onDark: `linear-gradient(100deg, ${color.coffee} 0%, ${color.steam} 55%, ${color.star} 100%)`,
  onLinen: `linear-gradient(100deg, ${color.tint} 0%, ${color.tintInk} 45%, ${color.roast} 100%)`,
} as const;
