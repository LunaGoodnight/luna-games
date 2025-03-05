import { pixiPipes } from '@assetpack/core/pixi';
import { audio } from '@assetpack/core/ffmpeg';
import { spineAtlasManifestMod } from '@assetpack/core/spine';

// https://pixijs.io/assetpack/docs/guide/pipes/ffmpeg/
export default {
	entry: './raw-assets',
	output: './public/assets',
	pipes: [
		// spineAtlasManifestMod(),
		...pixiPipes({
			cacheBust: true,
			audio: {
				inputs: ['mp3'],
				outputs: [
					{
						name: 'mp3',
						recompress: false,
					},
				],
			},
			resolutions: {
				default: 1,
			},
			compression: {
				png: { quality: 100, compressionLevel: 0 },
				jpeg: { quality: 100, compressionLevel: 0 },
				webp: false,
			},
			texturePacker: {
				nameStyle: 'short',
				allowRotation: false,
				resolutionOptions: {
					fixedResolution: 'default',
				},
			},
			manifest: {
				output: './src/manifest.json',
			},
		}),
	],
};
