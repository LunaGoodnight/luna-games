// ResizeManager.ts
export class ResizeManager {
	private static instance: ResizeManager | null = null;
	private listeners: Array<() => void> = [];

	private constructor() {
		window.addEventListener('resize', this.handleResize.bind(this));
	}

	static getInstance(): ResizeManager {
		if (!ResizeManager.instance) {
			ResizeManager.instance = new ResizeManager();
		}
		return ResizeManager.instance;
	}

	private handleResize(): void {
		// You might add debouncing here for performance
		this.listeners.forEach((listener) => listener());
	}

	// Simplified subscribe without returning an unsubscribe function
	subscribe(callback: () => void): void {
		// Prevent duplicate subscriptions
		if (!this.listeners.includes(callback)) {
			this.listeners.push(callback);
		}
	}
}
