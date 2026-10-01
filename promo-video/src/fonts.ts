import { loadFont } from '@remotion/google-fonts/PlusJakartaSans';

/**
 * Plus Jakarta Sans, the face the app falls back to off Apple devices (`--font-ui` in the app's index.css).
 * Remotion holds every frame until the font files have loaded, so no frame renders in a fallback face.
 */
export const { fontFamily } = loadFont('normal', {
  weights: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin', 'latin-ext'],
});
