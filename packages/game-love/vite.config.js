// vite.config.ts
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import removeConsole from 'vite-plugin-remove-console';

export default defineConfig(({ mode }) => ({
	root: './',
	server: {
		host: '0.0.0.0',
		port: 5173,
		https: {
			key: fs.readFileSync(
				path.resolve(__dirname, '../../localhost+2-key.pem')
			),
			cert: fs.readFileSync(
				path.resolve(__dirname, '../../localhost+2.pem')
			),
		},
		proxy: {
			'/intg/game/url': {
				target: 'https://api.devkbbgame.com',
				changeOrigin: true,
				secure: false,
				rewrite: (path) =>
					path.replace(/^\/intg\/game\/url/, '/intg/game/url'),
			},
		},
	},
}));
