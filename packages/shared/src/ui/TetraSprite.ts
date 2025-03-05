import { Assets, Sprite } from 'pixi.js';
import { IElementProps } from '../core/LayoutManager.ts';
import { getPositionByStyle } from '../utils/getPositionByStyle.ts';
import { ResizeManager } from './ResizeManager.ts';

// 不是放在主要遊戲( CenterWrap )裡的Sprite，跟著四種版型來變化位置

export class TetraSprite extends Sprite {
	layoutConfig;
	app;
	commonData;
	slotMachineActor;
	imageScale = 1;

	constructor({
		slotMachineActor,
		app,
		commonData,
		layoutConfig,
	}: IElementProps) {
		super();
		this.label = layoutConfig.label;
		this.layoutConfig = layoutConfig;
		this.app = app;
		this.commonData = commonData;
		this.slotMachineActor = slotMachineActor;

		if (layoutConfig?.zIndex) this.zIndex = layoutConfig.zIndex;
		if ('visible' in layoutConfig) {
			this.visible = layoutConfig.visible;
		}
		this.alpha = layoutConfig.alpha;
		this.init();

		const resizeManager = ResizeManager.getInstance();
		resizeManager.subscribe(this.updatePosition.bind(this));
	}

	init() {
		this.loadTexture().then(() => this.updatePosition());
	}

	async loadTexture() {
		if (this.layoutConfig?.useSpriteSheet) {
			const sheet = await Assets.load(this.layoutConfig.sheet);
			this.texture = sheet.textures[this.layoutConfig.texture];
		} else {
			this.texture = await Assets.load(this.layoutConfig.texture);
		}
		this.anchor.set(0.5);
	}

	updatePosition() {
		const { x, y, divisor, dividend, visible } = getPositionByStyle({
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

		this.visible = visible;
	}
}
