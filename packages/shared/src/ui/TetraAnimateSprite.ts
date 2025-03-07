import { Assets, Sprite } from 'pixi.js';
import { IElementProps } from '../core/LayoutManager.ts';
import { getPositionByStyle } from '../utils/getPositionByStyle.ts';
import { ResizeManager } from './ResizeManager.ts';

// 不是放在主要遊戲( CenterWrap )裡的Sprite，跟著四種版型來變化位置
// TODO 動畫記得remove
export class TetraAnimateSprite extends Sprite {
	layoutConfig;
	app;
	commonData;
	machineActor;
	imageScale = 1;

	constructor({
		machineActor,
		app,
		commonData,
		layoutConfig,
	}: IElementProps) {
		super();
		this.label = layoutConfig.label;
		this.layoutConfig = layoutConfig;
		this.app = app;
		this.commonData = commonData;
		this.machineActor = machineActor;

		if (layoutConfig?.zIndex) this.zIndex = layoutConfig.zIndex;

		this.alpha = layoutConfig.alpha;
		this.init();
		this.visible = false;

		const resizeManager = ResizeManager.getInstance();
		resizeManager.subscribe(this.updatePosition.bind(this));
	}

	init() {
		this.loadTexture().then(() => {
			this.updatePosition();
			this.animate();
		});
	}

	async loadTexture() {
		this.texture = await Assets.load(this.layoutConfig.texture);
		this.anchor.set(0.5);
	}

	animate() {
		// Variables for swaying animation
		let time = 0;
		const swaySpeed = 0.05;
		const swayAmount = 0.1;

		// Animation loop
		this.app.ticker.add(() => {
			// Update time
			time += swaySpeed;

			// Create swaying motion using sine wave
			this.rotation = Math.sin(time) * swayAmount;
		});
	}

	updatePosition() {
		const { x, y, divisor, dividend } = getPositionByStyle({
			layoutConfig: this.layoutConfig,
			app: this.app,
			commonData: this.commonData,
		});

		const windowWidth = this.app.screen.width;
		const windowHeight = this.app.screen.height;
		this.imageScale = dividend / divisor;
		this.scale = this.imageScale;
		this.x = windowWidth / 2 + x * this.imageScale;
		this.y = windowHeight / 2 + y * this.imageScale;
	}
}
