import {Application, Assets, AssetsBundle} from 'pixi.js';
import { ResizeManager } from '../ui/ResizeManager.ts';

export class Game {
	app: Application;
	layoutConfig
	machineActor

	constructor({ layoutConfig,machineActor }) {
		this.app = new Application();
		this.layoutConfig = layoutConfig;

		this.machineActor = machineActor;
	}
	async initDevtools() {
		if (import.meta.env.VITE_USE_DEVTOOL === 'true') {
			const { initDevtools } = await import('@pixi/devtools');
			await initDevtools({ app: this.app });
		}
	}

	async init({ manifest}){
		await this.app.init({
			resizeTo: window,
			useBackBuffer: true,
			autoStart: true,
			resolution: devicePixelRatio || 1,
			autoDensity: true,

			// premultipliedAlpha: true,
		});
		this.initDevtools();
		this.app.ticker.maxFPS = 60;
		document.body.appendChild(this.app.canvas);

		await Assets.init({ manifest, basePath: 'assets' });

		// Check if Workers are supported by the browser
		const workersSupported = typeof Worker !== 'undefined';
		Assets.setPreferences({
			preferWorkers: workersSupported,
		});

		Assets.loadBundle(['preload', ], (progress) => {

		}).then(() => {
			this.startGame();
		});

		const allBundles = manifest.bundles.map(
			(item: AssetsBundle) => item.name
		);
		setTimeout(() => {
			Assets.backgroundLoadBundle(allBundles);
		}, 3000);

		const resizeManager = ResizeManager.getInstance();
		resizeManager.subscribe(this.resize.bind(this));
	}

	startGame() {


	}
	resize(): void {
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;
		this.app.renderer.canvas.style.width = `${windowWidth}px`;
		this.app.renderer.canvas.style.height = `${windowHeight}px`;

		window.scrollTo(0, 0);
		this.app.renderer.resize(window.innerWidth, window.innerHeight);
	}
}
