import { ViewContainerRef } from '@angular/core';
import { ModalFactory } from './modal-factory.class';
import { Observable, Subject } from 'rxjs';

export class ModalViewModel {
	public _viewContainerRef: ViewContainerRef;
	private _modals: ModalFactory[] = [];
	public counter = 0;

	public readonly closeChanges: Subject<any> = new Subject();
	public readonly openChanges: Subject<any> = new Subject();

	public get viewContainerRef() {
		return this._viewContainerRef;
	}

	public set viewContainerRef(viewRef: ViewContainerRef) {
		this._viewContainerRef = viewRef;
	}

	public add(modal: ModalFactory) {
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

		this._modals.splice(index, 1);
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
		return this._modals.find((model) => model.active);
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
		return Observable.create(observer => {
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
		return Observable.create(observer => {
			// this._viewContainerRef.clear(); -> ne možemo ga koristiti jer bi u suprotnome
			// instance ostale u nizu, jedino da se "subscribeamo" na destroy same komponente
			while (this._modals.length) {
				this._modals[this._modals.length - 1].destroy(true);

				if (this._modals.length === 0) {
					observer.next(true);
					observer.complete();
				}
			}
		});
	}
}
