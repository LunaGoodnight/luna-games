import layoutConfig from '../layoutConfig.json';
import { AnyActorRef, createActor } from 'xstate';
import { dessertMachine } from '../stateDiagram.ts';
import { Game } from '../../shared/src/core/Game.ts';
import manifest from './manifest.json';

export class Commander {
	layoutConfig;
	machineActor: AnyActorRef | null = null;
	dessertGame: Game | null = null;

	constructor() {
		this.layoutConfig = layoutConfig;
	}

	init() {
		this.initializeStateMachine().then(() => {
			this.initializeGame();
		});
	}

	initializeGame() {
		if (this.machineActor) {
			this.dessertGame = new Game({
				machineActor: this.machineActor,
				layoutConfig: this.layoutConfig,

			});
			this.dessertGame.init({manifest});
		}
	}

	async initializeStateMachine() {
		this.machineActor = createActor(dessertMachine);
	}
}
