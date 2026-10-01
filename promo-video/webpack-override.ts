import path from 'node:path';
import type { WebpackOverrideFn } from '@remotion/bundler';

/**
 * Shared by remotion.config.ts (studio and render) and scripts/stills.mjs (review stills), so every bundle
 * resolves the same way:
 * - `@haraya` points at the app's src, so Aya and the passport stamp are the app's real components.
 * - React resolves to this project's copy, because the app's files would otherwise load the app's own React and
 *   two Reacts at runtime break hooks.
 *
 * Paths are taken from the working directory when a bundle starts; every script runs from this folder.
 */
export const webpackOverride: WebpackOverrideFn = (config) => {
  const root = process.cwd();
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        '@haraya': path.resolve(root, '..', 'src'),
        react: path.resolve(root, 'node_modules', 'react'),
        'react-dom': path.resolve(root, 'node_modules', 'react-dom'),
      },
    },
  };
};
