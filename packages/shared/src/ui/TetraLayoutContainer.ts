import { Container } from 'pixi.js';
import { IElementProps } from '../core/LayoutManager.ts';
import { getStatus } from '../utils/getStatus.ts';
import { EnumSlotMachineState } from '../types/enum/spin.ts';
import { globalEE } from '../utils/eventEmitter.ts';
import { getPositionByStyle } from '../utils/getPositionByStyle.ts';
import { ResizeManager } from './ResizeManager.ts';

export class TetraLayoutContainer extends Container {
	layoutConfig;
	app;
	commonData;
	slotMachineActor;

	isFreeSpin = false;
	isWaiting = true;
	savedScale: number = 1;
	constructor({
		layoutConfig,
		app,
		commonData,
		slotMachineActor,
	}: IElementProps) {
		super();

		this.layoutConfig = layoutConfig;
		this.app = app;
		this.commonData = commonData;
		this.slotMachineActor = slotMachineActor;
		this.updatePosition();

		if (layoutConfig?.scale) {
			this.scale = layoutConfig.scale;
		}

		if (layoutConfig?.zIndex) {
			this.zIndex = layoutConfig.zIndex;
		}
		const resizeManager = ResizeManager.getInstance();
		resizeManager.subscribe(this.updatePosition.bind(this));

		document.body.onresize = () => {
			setTimeout(() => {
				this.updatePosition();
			}, 200);
		};
		if (this.layoutConfig?.shouldWaitForParentWidthOrHeight) {
			this.visible = false;
		}
		slotMachineActor.subscribe((snapshot) => {
			const status = getStatus(snapshot.value);
			this.isFreeSpin = snapshot.context.isFreeSpin;
			switch (status) {
				case EnumSlotMachineState.LOADING:
				case EnumSlotMachineState.IDLE:
				case EnumSlotMachineState.FREE_SPIN_IDLE:
					if (!this.layoutConfig?.shouldWaitForParentWidthOrHeight) {
						this.updatePosition();
					}
					break;
				default:
			}
		});

		globalEE.on(`${this.layoutConfig.label}_added`, () => {
			if (
				this.layoutConfig?.shouldWaitForParentWidthOrHeight &&
				this.isWaiting
			) {
				setTimeout(() => {
					this.visible = true;
					this.updatePosition();

					this.isWaiting = false;
				}, 100);
			}
		});
	}
	updatePosition() {
		const { x, y, divisor, dividend, visible } = getPositionByStyle({
			layoutConfig: this.layoutConfig,
			app: this.app,
			commonData: this.commonData,
		});

		const windowWidth = this.app.screen.width;
		const windowHeight = this.app.screen.height;

		this.savedScale = dividend / divisor;
		this.scale = this.savedScale;
		this.x = windowWidth / 2 + x * this.savedScale;
		this.y = windowHeight / 2 + y * this.savedScale;

		this.visible = visible;
	}
}
