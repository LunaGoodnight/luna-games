import { Assets, Sprite } from 'pixi.js';
import { IUpdateTextureProps } from '../types/layoutConfigType';
import { IElementProps } from '../core/LayoutManager.ts';
import { getPosition } from '../utils/getPosition.ts';
import { getStatus } from '../utils/getStatus.ts';
import {
	EnumSlotMachineEvents,
	EnumSlotMachineState,
} from '../types/enum/spin.ts';
import { ResizeManager } from './ResizeManager.ts';

export class Button extends Sprite {
	layoutConfig;
	app;
	commonData;
	machineActor;
	isFreeSpin = false;
	hasBeenInitialized = false;

	constructor({
		layoutConfig,
		app,
		commonData,
		machineActor,
	}: IElementProps) {
		super();

		this.layoutConfig = layoutConfig;
		this.app = app;
		this.commonData = commonData;
		this.machineActor = machineActor;
		this.init();

		if (layoutConfig?.label) {
			this.label = layoutConfig.label;
		}
		machineActor.subscribe((snapshot) => {
			const status = getStatus(snapshot.value);
			this.isFreeSpin = Boolean(snapshot.context.isFreeSpin);

			switch (status) {
				case EnumSlotMachineState.IDLE:
				case EnumSlotMachineState.FREE_SPIN_IDLE:
					if (!this.hasBeenInitialized) {
						setTimeout(() => {
							this.updatePosition();
							this.hasBeenInitialized = true;
						}, 10);
					}
					break;
				default:
					break;
			}
		});

		const resizeManager = ResizeManager.getInstance();
		resizeManager.subscribe(this.updatePosition.bind(this));
	}

	init() {
		this.handleHighLowShift({ layoutConfig: this.layoutConfig }).then(
			() => {
				this.updatePosition();
			}
		);
	}

	async handleHighLowShift({ layoutConfig }: IUpdateTextureProps) {
		if (layoutConfig?.spriteSheet) {
			const sheet = await Assets.load(
				layoutConfig.spriteSheet.low.sheetName
			);

			if (
				this.isFreeSpin &&
				layoutConfig.needFreeTextureWhenHighLowShift
			) {
				this.texture =
					sheet.textures[layoutConfig.spriteSheet.low.freeTexture];
			} else {
				this.texture =
					sheet.textures[layoutConfig.spriteSheet.low.texture];
			}

			this.sendLoadedEvent();

			Assets.load(layoutConfig?.spriteSheet.high.sheetName).then(
				(innerSheet) => {
					if (layoutConfig.spriteSheet) {
						if (
							this.isFreeSpin &&
							layoutConfig.needFreeTextureWhenHighLowShift
						) {
							this.texture =
								innerSheet.textures[
									layoutConfig.spriteSheet.high.freeTexture
								];
						} else {
							this.texture =
								innerSheet.textures[
									layoutConfig.spriteSheet.high.texture
								];
						}
					}
				}
			);
		}
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

	updatePosition() {
		const { x, y, width, height, scale } = getPosition({
			layoutConfig: this.layoutConfig,
			app: this.app,
			commonData: this.commonData,
			isFreeSpin: this.isFreeSpin,
		});
		if (scale) {
			this.scale.set(scale, scale);
		}
		if (width) {
			this.width = width;
		}
		if (height) {
			this.height = height;
		}

		if (typeof x === 'number') {
			this.x = x;
		}
		if (typeof y === 'number') {
			this.y = y;
		}
	}
}
