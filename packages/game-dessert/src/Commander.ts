import layoutConfig from '../layoutConfig.json';
import {AnyActorRef, createActor} from 'xstate';
import { dessertMachine } from '../stateDiagram.ts';

export class Commander {
	layoutConfig;
	machineActor: AnyActorRef | null = null;

	constructor() {
		this.layoutConfig = layoutConfig;

	}

	init() {

		this.initializeStateMachine().then(() =>{
			this.initializeGame();
		})
	}

	initializeGame() {}

	async initializeStateMachine() {
		this.machineActor = createActor(dessertMachine);
	}
}
