import {Injectable, OnDestroy} from '@angular/core';
import {fromEvent, Subscription} from 'rxjs';

export interface IviewPort {
	height: number;
	width: number;
}

@Injectable()
export class ModalHelper implements OnDestroy {
	private _viewport: IviewPort = null;
	private subscriptions: Subscription[] = [];

	constructor() {

		this.subscriptions.push(fromEvent(window, 'resize').subscribe(() => {
			this._viewport = null;
		}));
	}

	public ngOnDestroy(): void {
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
		this.subscriptions.length = 0;
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
		const subscription = fromEvent(window, 'resize').subscribe(() => fn());
		this.subscriptions.push(subscription);
		// This keeps the method signature the same as in previous versions,
		// while nothing will happen in ngOnDestroy if the user has already unsubscribed.
		return () => subscription.unsubscribe();
	}

	public pauseEvent(e: PointerEvent): void {
		e.stopPropagation();
		e.stopImmediatePropagation();
	}

	public getMousePosition(event: PointerEvent): { x: number; y: number } {
		return {
			x: event.clientX,
			y: event.clientY
		};
	}
}
