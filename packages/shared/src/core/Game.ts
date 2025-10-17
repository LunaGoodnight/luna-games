import { Application, Assets, AssetsBundle, Container, Sprite } from 'pixi.js';
import { ResizeManager } from '../ui/ResizeManager.ts';
import { LayoutManager } from './LayoutManager';

export class Game {
	app: Application;
	layoutConfig;
	machineActor;
	layoutManager;
	manifest;

	constructor({ layoutConfig, machineActor }) {
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

	async init({ manifest }) {
		this.manifest = manifest;

		await this.app.init({
			resizeTo: window,
			useBackBuffer: true,
			autoStart: true,
			resolution: devicePixelRatio || 1,
			autoDensity: true,
			antialias: false

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

		Assets.loadBundle(['preload'], (progress) => {}).then(() => {
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
		this.layoutManager = new LayoutManager({
			layoutConfig: this.layoutConfig,
			app: this.app,
			machineActor: this.machineActor,
		});

		this.app.stage.addChild(this.layoutManager);

		// Load all pics{m} images for testing
		this.loadAllPicsImages();

		this.machineActor?.start();
		this.resize();
	}

	async loadAllPicsImages() {
		// Create a container for all test images
		const picsContainer = new Container();
		picsContainer.label = 'picsTestContainer';
		this.app.stage.addChild(picsContainer);

		// Extract image aliases from manifest directly
		const picsBundle = this.manifest.bundles.find(bundle => bundle.name === 'pics');

		if (!picsBundle) {
			console.error('Pics bundle not found in manifest');
			return;
		}

		// Get all unique image aliases (excluding the hashed versions)
		const imageAliases = [];
		picsBundle.assets.forEach(asset => {
			if (asset.alias && Array.isArray(asset.alias)) {
				// Get the first alias (the clean one without hash)
				const cleanAlias = asset.alias.find(alias =>
					alias.startsWith('images/common/pics/') &&
					!alias.match(/-[a-zA-Z0-9_]{6}\.(jpg|png|gif|bmp|JPG|PNG|GIF|BMP)$/i)
				);
				if (cleanAlias) {
					imageAliases.push(cleanAlias);
				}
			}
		});

		console.log(`Found ${imageAliases.length} images in pics{m} folder, loading bundle...`);

		// Load the pics bundle
		try {
			await Assets.loadBundle('pics');
			console.log('Pics bundle loaded successfully');
		} catch (e) {
			console.error('Failed to load pics bundle:', e);
			return;
		}

		// Create sprites in a grid layout
		const columns = 40;
		const spriteSize = 20; // Small size for testing
		const padding = 2;

		imageAliases.forEach((alias, index) => {
			try {
				const texture = Assets.get(alias);
				if (texture) {
					const sprite = new Sprite(texture);

					// Calculate grid position
					const col = index % columns;
					const row = Math.floor(index / columns);

					sprite.x = col * (spriteSize + padding);
					sprite.y = row * (spriteSize + padding);

					// Scale down to small size
					const scale = Math.min(
						spriteSize / sprite.width,
						spriteSize / sprite.height
					);
					sprite.scale.set(scale);

					picsContainer.addChild(sprite);
				}
			} catch (e) {
				console.warn(`Failed to load image: ${alias}`, e);
			}
		});

		console.log(`Successfully loaded ${picsContainer.children.length} images to stage`);
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
