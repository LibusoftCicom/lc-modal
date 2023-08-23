import { Injectable, ComponentFactoryResolver, Injector, ViewContainerRef, Optional, SkipSelf, Type } from '@angular/core';
import { Observable } from 'rxjs';
import { ModalFactory } from './modal-factory.class';
import { IModal } from './modal-types.class';
import { ModalViewEvent, ModalViewModel } from './modal-view-model.class';
import { ModalConfig } from './modal-config.class';
import { filter, map } from 'rxjs/operators';

@Injectable()
export class Modal implements IModal<ModalFactory> {
	/**
	 * model is one instance per service
	 * each lazy-loaded module should have a new instance and new model data
	 * that way we can add <anchor-element> to each lazy-loaded module
	 */
	private model: ModalViewModel = new ModalViewModel();

	constructor(
		private cfr: ComponentFactoryResolver,
		private injector: Injector,
		private config: ModalConfig,
		@Optional() @SkipSelf() private parent: Modal) {
		}

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
	public params<T extends object>(params: T): ModalFactory {
		return this.setModal().params(params);
	}

	/**
	 * Set component in modal
	 * @param component
	 */
	public component<C>(component: C): ModalFactory {
		return this.setModal().component(component);
	}

	/**
	 * Define a function for dynamically fetching a component.
	 */
	public loadComponent<C>(componentLoader: () => Promise<C>): ModalFactory {
		return this.setModal().loadComponent(componentLoader);
	}

	/**
	 * track modal closing changes
	 */
	public get closeChange(): Observable<void> {
		return this.model.stateChanges.pipe(filter(event => event === ModalViewEvent.CLOSE), map(() => undefined));
	}

	/**
	 * track modal opening changes
	 */
	public get openChange(): Observable<void> {
		return this.model.stateChanges.pipe(filter(event => event === ModalViewEvent.OPEN), map(() => undefined));
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
		return this.model.active();
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

	private getDataModel(modal: Modal): ModalViewModel {
		if (!modal.model.viewContainerRef && modal.parent) {
			return this.getDataModel(modal.parent);
		}

		return modal.model;
	}

	private setModal() {
		const id = this.model.counter;
		/**
		 * link parent model with setting reference
		 * so we don't need to look for them each time
		 */
		if (!this.model.viewContainerRef) {
			this.model = this.getDataModel(this);
		}

		const viewContainerRef = this.model.viewContainerRef;

		/**
		 * Each modal instance should be placed to <dialog-anchor>, either at the root
		 * or in <dialog-anchor> registered in lazy-loaded module.
		 *
		 * Once lazy-loaded module instanciate new `Modal` serivse should try to register
		 * <dialog-anchor> if there isn't any try to get parent Modal service and use his `viewContainerRef`
		 *
		 * module --|
		 * 	|- Modal service (new instance)
		 * 	|- <dialog-anchor> (new instance)
		 * 			|
		 * 			|- module
		 * 				|- Modal service (use parent)
		 * 				|- <dialog-anchor> (use parent)
		 * 			|
		 * 			|- lazy-loaded module
		 * 				|- Modal service (new instance)
		 * 				|- <dialog-anchor> (new instance)
		 * 			|
		 * 			|- lazy-loaded module
		 * 				|- Modal service (new instance with parent model)
		 *				|- <dialog-anchor> (use parent)
		 */

		// to each instance we need to provide Injector
		const modal = new ModalFactory(
			this.cfr,
			viewContainerRef,
			id,
			this.injector,
			this.config
		);

		// set reference to previous element so we don't
		// need filter array later to find previous element
		modal.previous = this.model.last();

		this.model.add(modal);
		return modal;
	}
}
