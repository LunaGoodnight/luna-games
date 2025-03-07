import { Assets, Sprite } from 'pixi.js';
import { IElementProps } from '../core/LayoutManager.ts';
import { getPositionByStyle } from '../utils/getPositionByStyle.ts';
import { IUpdateTextureProps } from '../types/layoutConfigType.ts';
import { EnumSlotMachineEvents } from '../types/enum/spin.ts';
import { ResizeManager } from './ResizeManager.ts';

export class TetraButton extends Sprite {
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
		// if (layoutConfig?.defaultVisible) {
		// 	this.visible = layoutConfig.defaultVisible;
		// }

		const resizeManager = ResizeManager.getInstance();
		resizeManager.subscribe(this.updatePosition.bind(this));
		this.init();
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

	async handleHighLowShift({ layoutConfig }: IUpdateTextureProps) {
		if (layoutConfig?.spriteSheet) {
			const sheet = await Assets.load(
				layoutConfig.spriteSheet.low.sheetName
			);

			this.texture = sheet.textures[layoutConfig.spriteSheet.low.texture];

			this.sendLoadedEvent();

			Assets.load(layoutConfig?.spriteSheet.high.sheetName).then(
				(innerSheet) => {
					if (layoutConfig.spriteSheet) {
						this.texture =
							innerSheet.textures[
								layoutConfig.spriteSheet.high.texture
							];
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

	init() {
		this.handleHighLowShift({ layoutConfig: this.layoutConfig }).then(
			() => {
				this.updatePosition();
			}
		);
	}
}
