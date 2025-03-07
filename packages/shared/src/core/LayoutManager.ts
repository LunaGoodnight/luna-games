import { Application, Container, Renderer, Sprite } from 'pixi.js';
import { Root } from '../ui/Root.ts';
import gsap from 'gsap';
import { AnyActorRef } from 'xstate';
import { SpineAnimation } from '../ui/SpineAnimation.ts';
import { TetraSprite } from '../ui/TetraSprite.ts';
import { globalEE } from '../utils/eventEmitter.ts';
import { Mockup } from '../ui/Mockup.ts';
import { BackgroundSprite } from '../ui/BackgroundSprite.ts';
import { TetraAnimateSprite } from '../ui/TetraAnimateSprite.ts';
import { StyleLabel } from '../ui/StyleLabel.ts';
import { TetraButton } from '../ui/TetraButton.ts';
import { TetraLayoutContainer } from '../ui/TetraLayoutContainer.ts';

gsap.ticker.lagSmoothing(false);
type ClassConstructor =
	| typeof Root
	| typeof TetraButton
	| typeof TetraSprite
	| typeof Mockup
	| typeof StyleLabel
	| typeof BackgroundSprite
	| typeof TetraAnimateSprite
	| typeof SpineAnimation
	| typeof TetraLayoutContainer;

export interface IElementProps {
	machineActor: AnyActorRef;
	app: Application<Renderer>;
	layoutConfig: any;
	commonData?: any;
}

interface ElementFactory {
	create(props: IElementProps): Container | Sprite;
}

class DefaultElementFactory implements ElementFactory {
	constructor(private ClassConstructor: ClassConstructor) {}

	create(props: IElementProps) {
		return new this.ClassConstructor(props);
	}
}

const factoryMap: Record<string, ElementFactory> = {
	Root: new DefaultElementFactory(Root),
	TetraSprite: new DefaultElementFactory(TetraSprite),

};

interface IProps {
	layoutConfig: any;
	app: Application<Renderer>;
	machineActor: AnyActorRef;
}

interface ElementInfo {
	label: string;
	// element: Container | Sprite;
	// children?: ElementInfo[];
	isLoaded: boolean;
}

export class LayoutManager extends Container {
	private layoutConfig: any;
	private app: Application<Renderer>;
	private elementRegistry: { [key: string]: ElementInfo } = {};

	machineActor: AnyActorRef | null = null;

	constructor({ layoutConfig, app, machineActor }: IProps) {
		super();
		this.layoutConfig = layoutConfig;
		this.app = app;

		this.updateLayout({
			app,
			machineActor,
		});
	}

	updateLayout({
		app,
					 machineActor,
	}: {
		app: Application<Renderer>;
		machineActor: AnyActorRef;
	}): void {
		this.elementRegistry = {};

		const layoutData = this.layoutConfig.classes[0];
		const commonData = this.layoutConfig.common;

		if (layoutData) {
			const rootElement = this.createElement(
				layoutData,
				app,
				machineActor,
				commonData
			);
			this.addChild(rootElement);
		}
	}

	createElement(
		elementData: any,
		app: Application<Renderer>,
		machineActor: AnyActorRef,
		commonData: any
	): Container | Sprite {
		const factory = factoryMap[elementData.name];
		if (!factory)
			throw new Error(`Unknown element type: ${elementData.name}`);

		const props = {
			layoutConfig: elementData,
			app,
			machineActor,
			commonData: commonData,
		};

		const element = factory.create(props);


		if (Array.isArray(elementData.children)) {
			elementData.children.map((childData: any) => {
				const childElement = this.createElement(
					childData,
					app,
					machineActor,
					commonData
				);
				element.addChild(childElement);



				globalEE.emit(`${childData.label}_added`);
			});
		}

		return element;
	}
}
