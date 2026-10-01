import { Config } from '@remotion/cli/config';
import { webpackOverride } from './webpack-override.ts';

// Lossless frames into the encoder: JPEG frames plus H.264 flattened the stage grain and left the dark glows banded
Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig(webpackOverride);
