import { Assets, Sprite } from 'pixi.js';
import { IElementProps } from '../core/LayoutManager.ts';
import { getPositionByStyle } from '../utils/getPositionByStyle.ts';
import { EnumGameStatus } from '../types/EnumGameStatus.ts';
import { EnumSlotMachineEvents } from '../types/enum/spin.ts';
import { ResizeManager } from './ResizeManager.ts';

export class BackgroundSprite extends Sprite {
	layoutConfig;
	app;
	commonData;
	machineActor;
	imageScale = 1;
	isVisible = false;
	isFreeSpin: boolean = false;

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

		this.init();
		const resizeManager = ResizeManager.getInstance();
		resizeManager.subscribe(this.updatePosition.bind(this));

		machineActor.subscribe((snapshot) => {
			this.isFreeSpin = snapshot.context.isFreeSpin;
			this.isVisible = snapshot.context.isFreeSpin
				? this.layoutConfig.visibilityState[EnumGameStatus.FreeSpin]
				: this.layoutConfig.visibilityState[EnumGameStatus.NormalSpin];
			this.updatePosition();
		});
	}

	init() {
		this.loadTexture().then(() => {
			this.updatePosition();
			this.sendLoadedEvent();
		});
	}

	async loadTexture() {
		this.texture = await Assets.load(this.layoutConfig.texture);
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
		this.visible = this.isVisible === visible ? visible : false;
	}

	sendLoadedEvent() {
		const {
			context: { elementLoadStatus },
		} = this.machineActor.getSnapshot();

		const newValue = {
			isLoaded: true,
			label: this.layoutConfig.label,
		};
		this.machineActor.send({
			type: EnumSlotMachineEvents.UPDATE_ELEMENT_STATUS,
			elementLoadStatus: {
				...elementLoadStatus,
				[this.layoutConfig.label]: newValue,
			},
		});
	}
}
