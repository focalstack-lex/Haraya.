import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { SCENES } from './timeline';
import { fontFamily } from './fonts';
import { Backdrop } from './components/Backdrop';
import { Hook } from './scenes/Hook';
import { Reveal } from './scenes/Reveal';
import { PromiseScene } from './scenes/PromiseScene';
import { Mood } from './scenes/Mood';
import { Walk } from './scenes/Walk';
import { Focus } from './scenes/Focus';
import { Passport } from './scenes/Passport';
import { Owners } from './scenes/Owners';
import { Community } from './scenes/Community';
import { EndCard } from './scenes/EndCard';

/** The first frames come up out of black, like a cut from the edit before. */
const FadeFromBlack: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 24], [1, 0], { extrapolateRight: 'clamp' });
  return opacity > 0 ? <AbsoluteFill style={{ background: '#000', opacity }} /> : null;
};

const scene = (id: keyof typeof SCENES, content: React.ReactNode) => (
  <Sequence key={id} name={id} from={SCENES[id].from} durationInFrames={SCENES[id].duration}>
    {content}
  </Sequence>
);

/**
 * The app's custom icons (CustomIcons.tsx) size and dim parts of themselves with Tailwind classes, which this
 * project does not run; these are exactly the classes they use, with the app's values.
 */
const APP_ICON_CLASSES = `
  .icon-fit { width: 100%; height: 100%; display: block; }
  .opacity-50 { opacity: 0.5; } .opacity-60 { opacity: 0.6; } .opacity-70 { opacity: 0.7; }
  .opacity-80 { opacity: 0.8; } .opacity-90 { opacity: 0.9; }
`;

/** Every scene stacked on the shared stage. Later scenes draw on top while earlier ones leave. */
export const HarayaPromo: React.FC = () => (
  <AbsoluteFill style={{ fontFamily, ['--font-ui' as string]: fontFamily }}>
    <style>{APP_ICON_CLASSES}</style>
    <Backdrop />
    {scene('hook', <Hook />)}
    {scene('reveal', <Reveal />)}
    {scene('promise', <PromiseScene />)}
    {scene('mood', <Mood />)}
    {scene('walk', <Walk />)}
    {scene('focus', <Focus />)}
    {scene('passport', <Passport />)}
    {scene('owners', <Owners />)}
    {scene('community', <Community />)}
    {scene('end', <EndCard />)}
    <FadeFromBlack />
  </AbsoluteFill>
);
