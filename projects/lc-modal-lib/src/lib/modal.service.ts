import { Injectable, ComponentFactoryResolver, Injector, ViewContainerRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ModalFactory } from './modal-factory.class';
import { IModal } from './modal-types.class';
import { ModalViewModel } from './modal-view-model.class';
import { ModalConfig } from './modal-config.class';

const viewModel = new ModalViewModel();

@Injectable()
export class Modal implements IModal<ModalFactory> {
	private model: ModalViewModel = viewModel;

	private _closeChanges: Subject<any> = new Subject();

	private _openChanges: Subject<any> = new Subject();

	constructor(
		private cfr: ComponentFactoryResolver,
		private injector: Injector,
		private config: ModalConfig) {}

	/**
	 * Set modal title
	 * @param title
	 */
	public title(title: string): ModalFactory {
		return this.setModal().title(title);
	}

	/**
	 * Set modal params
	 * @param params
	 */
	public params<T>(params: T): ModalFactory {
		return this.setModal().params(params);
	}

	/**
	 * Set component in modal
	 * @param component
	 */
	public component<C>(component: C): ModalFactory {
		return this.setModal().component(component);
	}

	private setModal() {
		const id = this.model.counter;
		// to each instance we need to provide Injector
		const modal = new ModalFactory(
			this.cfr,
			this.model.viewContainerRef,
			id,
			this.injector,
			this.model.modals,
			this.config
		);

		// set after view ready
		modal.afterViewInit(() => this._openChanges.next());

		// set reference to previous element so we don't
		// need filter array later to find previous element
		modal.previous = this.last();

		this.model.add(modal);

		modal.setDestroyFn(() => {
			this.model.remove(modal);
			this._closeChanges.next();
		});

		return modal;
	}

	/**
	 * track modal closing changes
	 */
	public get closeChange() {
		return this._closeChanges.asObservable();
	}

	/**
	 * track modal opening changes
	 */
	public get openChange() {
		return this._openChanges.asObservable();
	}

	/**
	 * Set ViewContainerRef from ModalAnchor
	 * it's used in ModalFactory to dynamically create component
	 * and append it to DOM
	 * * @param  viewContainerRef
	 */
	public setViewContainerRef(viewContainerRef: ViewContainerRef): void {
		this.model.viewContainerRef = viewContainerRef;
	}

	/**
	 * returns last instantiated modal
	 * @return
	 */
	public last(): ModalFactory {
		return this.model.last();
	}

	/**
	 * returns first instantiated modal
	 * @return
	 */
	public first(): ModalFactory {
		return this.model.first();
	}

	/**
	 * returns instantiated modal by id
	 * @param  id
	 * @return
	 */
	public getByID(ID: number): ModalFactory {
		return this.model.getByID(ID);
	}

	/**
	 * returns instantiated modal by active state
	 * @return
	 */
	public active(): ModalFactory {
		// active should always be last one
		return this.last();
	}

	/**
	 * Close all modals except message box
	 * should close all from last to first opened
	 * return true because gard except to get true and false as result
	 */
	public closeAll(): Observable<boolean> {
		return this.model.closeAll();
	}

	/**
	 * Destroy all modals
	 */
	public destroyAll() {
		this.destroyAllAsObservable().subscribe();
	}

	/**
	 * Destroy all modals
	 * Returns observable that emits when all modals are destroyed
	 */
	public destroyAllAsObservable(): Observable<null> {
		return this.model.destroyAllAsObservable();
	}

	/**
	 * Returns list of all modals
	 */
	public get modals(): ModalFactory[] {
		return this.model.modals;
	}

	/**
	 * Returns number of opened modals
	 */
	public get length(): number {
		return this.model.length;
	}
}
