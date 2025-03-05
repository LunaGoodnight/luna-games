import { Application } from 'pixi.js';

export class Game {
	app: Application;
	constructor({ layoutConfig }) {
		this.app = new Application();
	}
}
