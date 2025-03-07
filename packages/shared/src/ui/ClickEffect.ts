import { TetraButton } from './TetraButton.ts';
import { IElementProps } from '../core/LayoutManager.ts';
import { Assets } from 'pixi.js';
import { globalEE } from '../utils/eventEmitter.ts';

export class ClickEffect extends TetraButton {
	constructor({
		machineActor,
		app,
		commonData,
		layoutConfig,
	}: IElementProps) {
		super({
			machineActor,
			app,
			commonData,
			layoutConfig,
		});

		this.eventMode = 'static';
		this.cursor = 'pointer';

		globalEE.on(`${this.layoutConfig.label}_clicked`, () => {
			if (this.layoutConfig?.needPressEffect) {
				this.togglePressed();
			}
		});

		this.onpointerdown = () => {
			globalEE.emit(`${this.layoutConfig.label}_clicked`);
		};
	}

	async togglePressed() {
		const sheet = await Assets.load(
			this.layoutConfig.spriteSheet.high.sheetName
		);

		this.texture = sheet.textures[this.layoutConfig.texture.pressed];

		setTimeout(() => {
			this.backToDefault();
		}, 1000);
	}

	async backToDefault() {
		const sheet = await Assets.load(
			this.layoutConfig.spriteSheet.high.sheetName
		);

		this.texture = sheet.textures[this.layoutConfig.texture.default];
	}
}
