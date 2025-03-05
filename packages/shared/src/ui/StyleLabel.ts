import { Container, Text, TextStyle } from 'pixi.js';
import { IElementProps } from '../core/LayoutManager.ts';
import { getStyleName } from '../utils/getStyleName.ts';

export class StyleLabel extends Container {
	app;
	commonData;
	layoutConfig;
	slotMachineActor;
	styleText;

	constructor({
		app,
		slotMachineActor,
		layoutConfig,
		commonData,
	}: IElementProps) {
		super();

		this.app = app;
		this.commonData = commonData;
		this.layoutConfig = layoutConfig;
		this.slotMachineActor = slotMachineActor;
		this.visible = layoutConfig.visible;
		const style = new TextStyle({
			fontFamily: 'Arial',
			fontSize: 25,
			fontWeight: 'bold',
			fill: 0xffffff,
			align: 'right',
		});
		this.styleText = new Text({
			text: '',
			style,
		});

		this.addChild(this.styleText);

		// this.backgroundGraphic = new Graphics()
		// 	.rect(this.app.screen.width - 180, 0, 180, 60)
		// 	.fill(0xa13bcc);
		// this.addChild(this.backgroundGraphic);
		this.updateStyleName();
		this.styleText.x = this.app.screen.width - 130;
		this.styleText.y = 10;
		this.styleText.zIndex = 9999999;
		window.addEventListener('resize', () => {
			this.updateStyleName();
			this.updatePosition();
		});
	}

	updateStyleName() {
		const { style } = getStyleName({
			app: this.app,
			commonData: this.commonData,
		});

		this.styleText.text = style;
	}

	updatePosition() {
		this.styleText.x = this.app.screen.width - 130;
		this.styleText.y = 10;
		this.styleText.zIndex = 9999999;
	}
}
