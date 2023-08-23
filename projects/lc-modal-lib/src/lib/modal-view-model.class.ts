import { ViewContainerRef } from '@angular/core';
import { ModalFactory } from './modal-factory.class';
import { Observable, Subject } from 'rxjs';
import { ACTIVE_MODAL } from './modal-active-model.class';

export enum ModalViewEvent {
	CLOSE,
	OPEN
}

export class ModalViewModel {
	public _viewContainerRef: ViewContainerRef;
	private _modals: ModalFactory[] = [];
	public counter = 0;

	private readonly events: Subject<ModalViewEvent> = new Subject();
	public readonly stateChanges: Observable<ModalViewEvent> = this.events.asObservable();

	public get viewContainerRef() {
		return this._viewContainerRef;
	}

	public set viewContainerRef(viewRef: ViewContainerRef) {
		if (this._viewContainerRef && viewRef) {
			throw Error('You are trying to set a new reference to the anchor element.');
		}
		this._viewContainerRef = viewRef;
	}

	public add(modal: ModalFactory) {
		// set after view ready
		modal.afterViewInit(() => this.events.next(ModalViewEvent.OPEN));
		modal.setDestroyFn((force) => {
			if (force !== true && modal.previous) {
				ACTIVE_MODAL.set(modal.previous);
				/**
				 * if the modal previous is the one that has an overlay, and this one doesn't then
				 * you must put the focus on the last one
				 */
				// if (!modal.overlayVisible
				// 	&& (modal.previous?.overlayVisible)) {
				// 		ACTIVE_MODAL.set(this.last());
				// 	} else {
				// 		ACTIVE_MODAL.set(modal.previous);
				// 	}
			}

			if (force === true || !modal.previous) {
				ACTIVE_MODAL.clear();
			}

			this.remove(modal);
		});

		/**
		 * calculate z-index
		 * it need to be different from the last opened modal
		 * so that the code within the Factory class (line 134) can calculate the same correctly
		 */
		modal.setOrder(modal.getOrder() + this._modals.length);
		this._modals.push(modal);
		this.counter++;
	}

	public remove(modal: ModalFactory) {
		const index = this._modals.indexOf(modal);

		// neeed to relink elements if this isn't last element
		// problem can be if we open message box and close one right after we create new
		/**
		 * example:
		 *       [remove] [relink]
		 * [ {}   <- {}   <- {}   <- {} ]
		 */

		if (index < this.length - 1) {
			this._modals[index + 1].previous = this._modals[index - 1];
		}

		modal.afterViewInit(null);
		modal.setDestroyFn(null);
		modal.afterInit(null);

		this._modals.splice(index, 1);
		this.events.next(ModalViewEvent.CLOSE);
	}

	/**
	 * returns last instantiated modal
	 * @return
	 */
	public last(): ModalFactory {
		return this._modals[this._modals.length - 1];
	}

	/**
	 * returns first instantiated modal
	 * @return
	 */
	public first(): ModalFactory {
		return this._modals[0];
	}

	/**
	 * returns active modal
	 */
	public active(): ModalFactory {
		return ACTIVE_MODAL.get();
	}

	/**
	 * returns instantiated modal by id
	 * @param  id
	 * @return
	 */
	public getByID(ID: number): ModalFactory {
		return this._modals.find((modal: ModalFactory) => modal.id === ID);
	}

	public get length(): number {
		return this._modals.length;
	}

	public get modals(): ModalFactory[] {
		return this._modals;
	}

	/**
	 * Close all modals except message box
	 * should close all from last to first opened
	 * return true because gard except to get true and false as result
	 */
	public closeAll(): Observable<boolean> {
		return new Observable(observer => {
			for (let i = this._modals.length - 1; i >= 0; i--) {
				const modal = this._modals[i];

				if (modal && !modal.closeOnlyByUser) {
					modal.destroy(true);
				}
			}

			observer.next(true);
			observer.complete();
		});
	}

	public destroyAllAsObservable(): Observable<null> {
		return new Observable(observer => {
			// this._viewContainerRef.clear(); -> ne možemo ga koristiti jer bi u suprotnome
			// instance ostale u nizu, jedino da se "subscribeamo" na destroy same komponente
			while (this._modals.length) {
				this._modals[this._modals.length - 1].destroy(true);

				if (this._modals.length === 0) {
					observer.next();
					observer.complete();
				}
			}
		});
	}
}
