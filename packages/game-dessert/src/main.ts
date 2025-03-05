import { Commander } from './Commander.ts';

try {
	const game = new Commander();
	game.init();
} catch (e) {
	console.error(e);
}
