import {
	Application,
	Assets,
	Container,
	Graphics,
	Renderer,
	Sprite,
	Text,
	TextStyle,
	Texture,
} from 'pixi.js';
import { getOrientation } from '../utils/getOrientation.ts';
import { ICommonContent } from '../types/layoutConfigType.ts';
import { globalEE } from '../utils/eventEmitter.ts';
import { getLoadScreenPositionByStyle } from '../utils/getLoadScreenPositionByStyle.ts';
import { logErrorFactory } from '../utils/logErrorFactory.ts';
import gsap from 'gsap';
import {
	EnumSlotMachineEvents,
	EnumSlotMachineState,
} from '../types/enum/spin.ts';
import { ILoadScreenPosition } from '../core/SlotGame.ts';
import { AnyActorRef } from 'xstate';

export class LoadScreen extends Container {
	app;
	commonData: ICommonContent;
	loadBarWidth: number | null = null;
	leftFill: Sprite | null = null;
	middleFill: Sprite | null = null;
	rightFill: Sprite | null = null;
	leftArcBackground: Sprite | null = null;
	rightArcBackground: Sprite | null = null;
	middleBackground: Sprite | null = null;
	loadingBarScale = 0.78;
	texture = new Sprite();
	hasRemoved = false;
	loadScreenPosition;
	imageScale = 1;
	clickTip: Text | null = null;
	progressRatio: number = 0;
	machineActor;
	blackBackground = new Graphics();
	backgroundHitArea: Container | null = null;
	hasClicked = false;
	loadingBarContainer: Container | null = null;
	private clickTipTimeline: gsap.core.Timeline | null = null;
	private boundInit: () => void;

	constructor({
		commonData,
		app,
		loadScreenPosition,
		machineActor,
	}: {
		commonData: ICommonContent;
		app: Application;
		loadScreenPosition: ILoadScreenPosition;
		machineActor: AnyActorRef;
	}) {
		super();
		this.commonData = commonData;
		this.app = app;
		this.machineActor = machineActor;
		this.loadScreenPosition = loadScreenPosition;
		this.loadBarWidth = app.screen.width / 15;

		this.width = app.screen.width;

		this.height = app.screen.height;
		this.createBlackBackground();

		this.initLoadingBar();

		this.label = 'LoadScreen';
		// this.barWidth = app.screen.width;
		this.init({ commonData, app });

		this.zIndex = 9999;

		window.addEventListener('keydown', this.finishHandler);
		this.boundInit = () => this.init({ commonData: this.commonData, app: this.app });
		window.addEventListener('resize', this.boundInit);

		globalEE.on('finished_Load_All_Low_Textures', () => {
			this.addProgress(0.5);
		});
		globalEE.on(`should_removeLoadScreen`, () => {
			if (!this.hasRemoved) {
				// this.visible = false;

				try {
					// const toRemoveChild =
					// 	this.app.stage.getChildByLabel('LoadScreen');
					//
					// if (toRemoveChild) {
					// 	this.app.stage.removeChild(toRemoveChild);
					// }
				} catch (e) {
					logErrorFactory(e);
				}

				this.hasRemoved = true;
			}
		});
	}
	private finishHandler = (e: KeyboardEvent) => {
		if (e.code === 'Space' || e.code === 'Enter') {
			e.preventDefault(); // Prevent page scroll
			if (!this.hasClicked) this.handleClick();
		}
	};

	async initLoadingBar() {
		if (!this.loadBarWidth) return;
		this.loadingBarContainer = new Container();

		this.leftArcBackground = new Sprite();
		this.leftArcBackground.texture = await Assets.load(
			'loading_box_arc.png'
		);
		this.rightArcBackground = new Sprite();
		this.rightArcBackground.texture = await Assets.load(
			'loading_box_arc.png'
		);
		this.rightArcBackground.scale.x = -1;
		this.middleBackground = new Sprite();
		this.middleBackground.texture = await Assets.load(
			'loading_box_mid.png'
		);
		this.middleBackground.x = this.leftArcBackground.width;

		this.middleBackground.scale.x = this.loadBarWidth;

		this.rightArcBackground.x =
			this.leftArcBackground.width +
			this.middleBackground.width +
			this.rightArcBackground.width;

		// left fill
		this.leftFill = new Sprite();
		this.leftFill.texture = await Assets.load('loading_color_arc.png');
		this.leftFill.x = 0;
		this.leftFill._zIndex = 1;
		this.loadingBarContainer.addChild(this.leftFill);

		// middle fill
		this.middleFill = new Sprite();
		this.middleFill.texture = await Assets.load('loading_color_mid.png');
		this.loadingBarContainer.addChild(this.middleFill);
		this.middleFill.x = this.leftFill.width;
		this.middleFill._zIndex = 1;
		// this.middleFill.scale.x = 50;

		// right
		this.rightFill = new Sprite();
		this.rightFill.texture = await Assets.load('loading_color_arc.png');
		this.loadingBarContainer.addChild(this.rightFill);

		this.rightFill.scale.x = -1;
		this.rightFill._zIndex = 1;
		this.rightFill.x =
			this.middleFill.width + this.leftFill.width + this.rightFill.width;

		// wait
		this.loadingBarContainer.addChild(this.middleBackground);
		this.loadingBarContainer.addChild(this.rightArcBackground);
		this.loadingBarContainer.addChild(this.leftArcBackground);

		this.addChild(this.loadingBarContainer);
		// this.loadingBarContainer.pivot.set(0.5);
		// this.loadingBarContainer.pivot.x = this.loadingBarContainer.width / 2;
		this.loadingBarContainer.scale.set(this.loadingBarScale);

		this.loadingBarContainer.x =
			(this.app.screen.width - this.loadingBarContainer.width) / 2;
		this.loadingBarContainer.y =
			this.app.screen.height - this.loadingBarContainer.height;

		this.loadingBarContainer._zIndex = 50;
	}

	init({
		commonData,
		app,
	}: {
		commonData: ICommonContent;
		app: Application;
	}) {
		this.initTexture({ commonData, app }).then(() => {
			this.updatePosition();
		});
	}

	async initTexture({
		commonData,
		app,
	}: {
		commonData: ICommonContent;
		app: Application<Renderer>;
	}) {
		const { isPortrait } = getOrientation({
			commonData: this.commonData,
			app,
		});

		if (isPortrait) {
			await Assets.load(commonData.content.loadingTexture.Portrait);
			this.texture.texture = Texture.from(
				commonData.content.loadingTexture.Portrait
			);
		} else {
			await Assets.load(commonData.content.loadingTexture.Landscape);
			this.texture.texture = Texture.from(
				commonData.content.loadingTexture.Landscape
			);
		}
		this.addChild(this.texture);
	}

	updatePosition() {
		const { x, y, divisor, dividend } = getLoadScreenPositionByStyle({
			commonData: this.commonData,
			loadScreenPosition: this.loadScreenPosition,
			app: this.app,
		});
		const windowWidth = this.app.screen.width;
		const windowHeight = this.app.screen.height;
		this.imageScale = dividend / divisor;

		this.texture.scale.set(this.imageScale, this.imageScale);
		this.texture.anchor.set(0.5);

		this.texture.x = windowWidth / 2 + x * this.imageScale;
		this.texture.y = windowHeight / 2 + y * this.imageScale;
	}

	private createBlackBackground() {
		this.blackBackground = new Graphics()
			.fill(0x000)
			.rect(0, 0, this.app.screen.width, this.app.screen.height);
		this.blackBackground.label = 'Black Background';
		this.addChild(this.blackBackground);
	}

	private isUpdating: boolean = false;

	private async lockAndUpdate(progressRatio: number) {
		// Wait until the lock is released
		while (this.isUpdating) {
			await new Promise((resolve) => {
				setTimeout(resolve, 10);
			}); // Wait 10ms before retrying
		}

		this.isUpdating = true;
		this.updateLoadingBar(progressRatio);
		this.isUpdating = false;
	}

	private updateLoadingBar(progressRatio: number) {
		if (
			!this.middleFill ||
			!this.rightFill ||
			!this.leftFill ||
			!this.loadBarWidth
		)
			return;
		this.middleFill.scale.x = this.loadBarWidth * progressRatio;
		this.rightFill.x =
			this.middleFill.width + this.leftFill.width + this.rightFill.width;
	}

	public async addProgress(progressRatio: number) {
		this.progressRatio += progressRatio;
		await this.lockAndUpdate(this.progressRatio);
		this.checkProgress();
	}

	// 只有AssetPack preload用這邊
	public async updateProgress(progressRatio: number) {
		this.progressRatio = progressRatio + this.progressRatio;
		await this.lockAndUpdate(this.progressRatio);
		this.checkProgress();
	}

	public checkProgress() {
		if (this.progressRatio === 1) {
			if (this.loadingBarContainer) {
				this.loadingBarContainer.visible = false;
			}

			const style = new TextStyle({
				fontFamily: 'Arial',
				fontSize: 20,
				fill: 0xffffff,
			});

			this.clickTip = new Text({
				text: '點擊螢幕任何地方開始',
				style: style,
			});

			this.clickTip.anchor.set(0.5);
			this.clickTip.y = this.app.screen.height - 60;
			this.clickTip.x = this.app.screen.width / 2;
			this.addChild(this.clickTip);

			this.clickTipTimeline = gsap.timeline()
                .to(this.clickTip, {
                    alpha: 0,
                    duration: 1,
                })
                .to(this.clickTip, {
                    alpha: 1,
                    duration: 1,
                    repeat: -1,
                });
			// background area
			this.backgroundHitArea = new Container();
			this.backgroundHitArea.eventMode = 'static';
			this.backgroundHitArea.cursor = 'pointer';
			this.backgroundHitArea.hitArea = {
				contains: () => true,
			};
			this.backgroundHitArea.onpointerdown = () => {
				if (!this.hasClicked) {
					this.handleClick();
				}
			};
			this.addChild(this.backgroundHitArea);
			this.eventMode = 'static';
			this.on('pointerdown', () => {
				if (!this.hasClicked) {
					this.handleClick();
				}
			});

			setTimeout(() => {
				if (!this.hasClicked) {
					this.handleClick();
				}
			}, 5000);
		} else {
			// timeout
			setTimeout(() => {
				this.handleClick();
			}, 9000);
		}
	}

	private handleClick() {
		const snapshot = this.machineActor.getSnapshot();

		if (
			snapshot.value === EnumSlotMachineState.READY_TO_ENTER_NORMAL_SPIN
		) {
			this.machineActor.send({
				type: EnumSlotMachineEvents.INIT_TO_NORMAL_SPIN_IDLE,
			});
			this.hasClicked = true;
			this.cleanup();
			this.removeChild();
			this.destroy();
		}

		if (snapshot.value === EnumSlotMachineState.READY_TO_ENTER_FREE_SPIN) {
			this.machineActor.send({
				type: EnumSlotMachineEvents.INIT_TO_FREE_SPIN_IDLE,
			});
			this.hasClicked = true;
			this.cleanup();
			this.removeChild();
			this.destroy();
		}
	}

	private cleanup() {
        // Kill GSAP timeline if it exists
        if (this.clickTipTimeline) {
            this.clickTipTimeline.kill();
            this.clickTipTimeline = null;
        }
        
        // Remove event listeners
		window.removeEventListener('keydown', this.finishHandler);
		window.removeEventListener('resize', this.boundInit);

		// Remove event emitter listeners
		globalEE.off('finished_Load_All_Low_Textures');
		globalEE.off('should_removeLoadScreen');
    }
}
