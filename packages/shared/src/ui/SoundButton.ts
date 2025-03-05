import { Assets } from 'pixi.js';
import { IElementProps } from '../core/LayoutManager.ts';
import {
	EnumSlotMachineEvents,
	EnumSlotMachineState,
} from '../types/enum/spin';
import { Button } from './Button.ts';
import { bgm } from '../core/Bgm.ts';
import { getStatus } from '../utils/getStatus.ts';
import { sfx, CacheLeakSFXEventKeys } from '../core/Sfx.ts';

export class SoundButton extends Button {
	normalSpinBgm: Promise<void> | null = null;
	isInitialized = false;
	isFreeSpin = false;
	constructor({
		layoutConfig,
		slotMachineActor,
		app,
		commonData,
	}: IElementProps) {
		super({ layoutConfig, slotMachineActor, app, commonData });
		const urlParams = new URLSearchParams(window.location.search);

		if (
			urlParams.get('isSoundOn') === 'false' ||
			new URLSearchParams(window.location.pathname.split('/').pop()).get(
				'isSoundOn'
			) === 'false'
		) {
			slotMachineActor.send({
				type: EnumSlotMachineEvents.TURN_SOUND_OFF,
			});
		}
		if (
			urlParams.get('isSoundOn') === 'true' ||
			new URLSearchParams(window.location.pathname.split('/').pop()).get(
				'isSoundOn'
			) === 'true'
		) {
			slotMachineActor.send({
				type: EnumSlotMachineEvents.TURN_SOUND_ON,
			});
		}
		this.eventMode = 'static';
		this.cursor = 'pointer';
		this.on('pointerdown', () => {
			slotMachineActor.send({
				type: EnumSlotMachineEvents.TOGGLE_SOUND,
			});
			sfx.trigger(CacheLeakSFXEventKeys.clickWidgetButton);
		});

		this.subscribeToActor();
		slotMachineActor.subscribe(async (snapshot) => {
			const status = getStatus(snapshot.value);
			switch (status) {
				case EnumSlotMachineState.IDLE:
					if (!this.isInitialized) {
						this.initMusic();
						this.isInitialized = true;
					}
					bgm.play('sounds/bgm/normal.mp3').then(() => {});
					break;
				case EnumSlotMachineState.FREE_SPIN_IDLE:
				case EnumSlotMachineState.FREE_SPIN_SPINNING:
					if (!this.isInitialized) {
						this.initMusic();
						this.isInitialized = true;
					}
					if (!this.isInitialized) {
						this.initMusic();
						this.isInitialized = true;
					}
					bgm.play('sounds/bgm/free.mp3').then(() => {});
					break;
			}
		});
	}

	async initMusic() {
		// 太吵先關掉;

		await Assets.loadBundle(['sounds']);

		bgm.play('sounds/bgm/normal.mp3', {
			volume: 1,
			loop: true,
			start: 0,
		}).then(() => {});
		// sound.add('normal.mp3', 'sounds/bgm/normal.mp3');
		// sound.play('normal.mp3');
	}

	async subscribeToActor() {
		this.slotMachineActor.subscribe(async (snapshot) => {
			if (snapshot?.context.soundOn) {
				await Assets.loadBundle(['sounds']);

				const sheet = await Assets.load(
					this.layoutConfig.spriteSheet.high.sheetName
				);
				this.texture =
					sheet.textures[this.layoutConfig.texture.default];
				bgm.setVolume(0.13);
				sfx.setVolume(0.5);

				this.updatePosition();
			} else {
				await Assets.loadBundle(['sounds']);

				const sheet = await Assets.load(
					this.layoutConfig.spriteSheet.high.sheetName
				);
				this.texture =
					sheet.textures[this.layoutConfig.texture.disabled];

				bgm.setVolume(0);
				sfx.setVolume(0);
				this.updatePosition();
			}
		});
	}
}
