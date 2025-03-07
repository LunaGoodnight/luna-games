import { Assets, Container } from 'pixi.js';
import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { IElementProps } from '../core/LayoutManager.ts';
import { getOrientation } from '../utils/getOrientation.ts';
import { ILayoutConfigType } from '../types/layoutConfigType.ts';
import { getSpineSource } from '../utils/getSpineSource.ts';
import { getPositionByStyle } from '../utils/getPositionByStyle.ts';
import { EnumSlotMachineEvents } from '../types/enum/spin.ts';
import { EnumGameStatus } from '../types/EnumGameStatus.ts';
import { logErrorFactory } from '../utils/logErrorFactory.ts';
import { ResizeManager } from './ResizeManager.ts';

export class SpineAnimation extends Container {
	private readonly layoutConfig;
	private readonly app;
	private readonly commonData;
	private portraitSpine: Spine | null = null;
	private landscapeSpine: Spine | null = null;
	private imageScale = 1;
	private isDestroyed = false;

	machineActor;
	isFreeSpin: boolean = false;

	constructor({
		app,
		layoutConfig,
		commonData,
		machineActor,
	}: IElementProps) {
		super();

		this.app = app;
		this.commonData = commonData;
		this.layoutConfig = layoutConfig;
		this.machineActor = machineActor;
		this.label = layoutConfig.label;
		if (layoutConfig?.zIndex) {
			this.zIndex = layoutConfig.zIndex;
		}

		this.visible = false;
		this.init();

		machineActor.subscribe((snapshot) => {
			this.isFreeSpin = snapshot.context.isFreeSpin;
			this.visible = this.isFreeSpin
				? this.layoutConfig.visibilityState[EnumGameStatus.FreeSpin]
				: this.layoutConfig.visibilityState[EnumGameStatus.NormalSpin];
		});

		const resizeManager = ResizeManager.getInstance();
		resizeManager.subscribe(this.resize.bind(this));
	}

	async initSpine() {
		try {
			const { isPortrait } = getOrientation({
				app: this.app,
				commonData: this.commonData,
			});
			await this.loadSpine({
				layoutConfig: this.layoutConfig,
				isPortrait,
			});

			if (!this.isDestroyed) {
				this.updateSpineVisibility({ isPortrait });
				this.updateSpinePosition({ isPortrait });
			}
		} catch (error) {
			logErrorFactory('Failed to initialize spine:', error);
		}
	}

	private init() {
		this.initSpine().then(() => {
			this.sendLoadedEvent();
		});
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

	private async resize() {
		const { isPortrait } = getOrientation({
			app: this.app,
			commonData: this.commonData,
		});

		this.initSpine().then(() => {
			this.updateSpineVisibility({ isPortrait });
			this.updateSpinePosition({ isPortrait });
		});
	}

	private async loadSpine({
		layoutConfig,
		isPortrait,
	}: {
		layoutConfig: ILayoutConfigType;
		isPortrait: boolean;
	}) {
		const spineSource = getSpineSource({
			layoutConfig,
			app: this.app,
			commonData: this.commonData,
		});

		if (!spineSource) return;

		try {
			await Assets.load([spineSource.skeleton, spineSource.atlas]);

			if (isPortrait && !this.portraitSpine) {
				this.portraitSpine = this.createSpine(spineSource);
				if (this.portraitSpine) this.addChild(this.portraitSpine);
			}
			if (!isPortrait && !this.landscapeSpine) {
				this.landscapeSpine = this.createSpine(spineSource);
				if (this.landscapeSpine) this.addChild(this.landscapeSpine);
			}
		} catch (error) {
			logErrorFactory('Failed to load spine:', error);
			throw error;
		}
	}

	private createSpine(spineSource: any): Spine | null {
		try {
			const spine = Spine.from({
				skeleton: spineSource.skeleton,
				atlas: spineSource.atlas,
			});

			if (!spine) return null;

			// spine.state.data.defaultMix = 0.2;
			spine.state.setAnimation(0, spineSource.animation, true);
			return spine;
		} catch (error) {
			logErrorFactory('Failed to create spine instance:', error);
			return null;
		}
	}

	private updateSpinePosition({ isPortrait }: { isPortrait: boolean }) {
		const { x, y, divisor, dividend } = getPositionByStyle({
			layoutConfig: this.layoutConfig,
			app: this.app,
			commonData: this.commonData,
		});

		const windowWidth = this.app.screen.width;
		const windowHeight = this.app.screen.height;
		this.imageScale = dividend / divisor;

		if (isPortrait && this.portraitSpine) {
			this.portraitSpine.scale.set(this.imageScale);
			this.portraitSpine.x = windowWidth / 2 + x * this.imageScale;
			this.portraitSpine.y = windowHeight / 2 + y * this.imageScale;
		} else if (!isPortrait && this.landscapeSpine) {
			this.landscapeSpine.scale.set(this.imageScale);
			this.landscapeSpine.x = windowWidth / 2 + x * this.imageScale;
			this.landscapeSpine.y = windowHeight / 2 + y * this.imageScale;
		}
	}

	private updateSpineVisibility({
		isPortrait,
	}: {
		isPortrait: boolean;
	}): void {
		if (this.portraitSpine) this.portraitSpine.visible = isPortrait;
		if (this.landscapeSpine) this.landscapeSpine.visible = !isPortrait;
	}
}
