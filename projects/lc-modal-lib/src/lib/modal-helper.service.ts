import { Injectable } from '@angular/core';
import { EventManager } from '@angular/platform-browser';

export interface IviewPort {
	height: number;
	width: number;
}

@Injectable()
export class ModalHelper {
	private _viewport: IviewPort = null;

	constructor(private eventManager: EventManager) {
		eventManager.addGlobalEventListener('window', 'resize', () => {
			this._viewport = null;
		});
	}

	public get viewport(): IviewPort {
		if (this._viewport) {
			return this._viewport;
		}

		const e = window;

		const height = e.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

		const width = e.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

		return (this._viewport = { height: height, width: width });
	}

	public onWindowResize(fn: Function): Function {
		return this.eventManager.addGlobalEventListener('window', 'resize', fn);
	}

	public pauseEvent(e: MouseEvent): void {
		e.stopPropagation();
		e.preventDefault();
		e.stopImmediatePropagation();
	}

	public getMousePosition(event: MouseEvent | TouchEvent): { x: number; y: number } {
		const pos =
			(<TouchEvent>event).touches && (<TouchEvent>event).touches[0]
				? (<TouchEvent>event).touches[0]
				: <MouseEvent>event;
		return {
			x: pos.clientX,
			y: pos.clientY
		};
	}
}
