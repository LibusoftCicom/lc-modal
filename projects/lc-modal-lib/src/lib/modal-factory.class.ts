import { ViewContainerRef, ComponentRef, Injector } from '@angular/core';
import { ModalComponent } from './modal.component';
import {
	IModal,
	IModalComponent,
	IPreclose,
	IClassPreClose,
	IModalResolve,
	IPreOpen,
	ModalEventType,
	IModalResult,
} from './modal-types.class';
import { ModalConfig } from './modal-config.class';

import { Observable, Subject, isObservable } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import {
	IModalDimension,
	ModalConfiguration,
	ModalConfigurationEventType
} from './modal-configuration.class';

import { INPUT_BINDER } from './modal-binding.class';
import { ModalComponentInputBinder } from './modal-input-binder.service';
import { ACTIVE_MODAL } from './modal-active-model.class';
import { MODAL_RESOLVE } from './modal-resolve.class';
import { ModalEvent } from './modal-event.class';


function isPromise(obj: any): obj is Promise<any> {
	// allow any Promise/A+ compliant thenable.
	// It's up to the caller to ensure that obj.then conforms to the spec
	return !!obj && typeof obj.then === 'function';
}

export class ModalFactory implements IModal<ModalFactory> {

	private readonly contentHost = '#content';

	private titleValue: string = null;

	private paramsValue: any = null;

	private additionalParamsValue: any = null;

	private resolvedData: any = null;

	private componentInstanceRef: ComponentRef<any> = null;

	private componentClassRef: any = null;

	private componentClassLoader: () => Promise<any> = null;

	private hostComponentWrapperRef: ComponentRef<ModalComponent> = null;

	private modalStatusChange: Subject<ModalEvent<any, any>> = new Subject();

	private viewReadyChange: Subject<any> = new Subject();

	private preCloseFn: IPreclose = null;

	private preOpenFn: IPreOpen = null;

	private closeOnErrorEnabled = false;

	private _focusElement: HTMLElement;

	private preserveOnCloseFocus: boolean = true;

	private componentReady = false;

	private _previous: ModalFactory = null;

	private _parent: ModalFactory = null;

	private _destroyFn: (force: boolean) => void = null;

	/**
	 * disable closing modal by CloseAll method,
	 * modal can only be closed by user
	 */
	public closeOnlyByUser = false;

	public isDestroying = false;

	private readonly configuration: ModalConfiguration = new ModalConfiguration();

	private readonly inputBinder: ModalComponentInputBinder = null;

	private readonly modalResolve: IModalResolve = null;

	private _afterInit: () => void = null;

	private _afterViewInit: () => void = null;

	constructor(
		private viewContainerRef: ViewContainerRef,
		public id: number,
		private injector: Injector,
		private config: ModalConfig
	) {
		this.inputBinder = this.injector.get(INPUT_BINDER, null);
		this.modalResolve = this.injector.get<IModalResolve>(MODAL_RESOLVE, null);
	}

	/**
	 * @description method returns Observable when modal component view is ready
	 */
	public get isReady(): Observable<void> {
		return this.viewReadyChange.asObservable();
	}
	
	public overlay(enabled: boolean = true): this {
		this.configuration.setOverlayVisible(enabled);
		return this;
	}

	public get overlayVisible(): boolean {
		return this.configuration.isOverlayVisible();
	}

	/**
	 * set reference to previous Modal instance
	 */
	public set previous(modal: ModalFactory) {
		this._previous = modal;
	}

	/**
	 * get reference to previous Modal instance
	 */
	public get previous(): ModalFactory {
		return this._previous;
	}

	/**
	 * set reference to previous Modal instance
	 */
	public set parent(modal: ModalFactory) {
		this._parent = modal;
	}

	/**
	 * get reference to previous Modal instance
	 */
	public get parent(): ModalFactory {
		return this._parent;
	}

	/**
	 * get reference to component in modal
	 */
	public get componentRef(): IModalComponent<any> {
		return !!this.componentInstanceRef && !!this.componentInstanceRef.instance
			? this.componentInstanceRef.instance
			: null;
	}

	/**
	 * change z-index position
	 */
	public setOrder(zIndex: number): this {
		this.configuration.setOrder(zIndex);
		return this;
	}

	public getOrder(): number {
		return this.configuration.getOrder();
	}

	public getHeight(): IModalDimension {
		return this.configuration.getHeight();
	}

	public getWidth(): IModalDimension {
		return this.configuration.getWidth();
	}

	public isVisible(): boolean {
		return this.configuration.isVisible();
	}

	/**
	 * forward any parameters to component in modal
	 */
	 public params<T extends object>(params: T): this {
		this.paramsValue = params;
		return this;
	}

	/**
	 * set additional params
	 */
	public additionalParams<T extends object>(additionalParams: T): this {
		this.additionalParamsValue = additionalParams;
		return this;
	}

	/**
	 * @deprecated
	 * please use `addClass` instead
	 */
	public setClass(className: string): this {
		this.configuration.addClass(className);
		return this;
	}

	/**
	 * add custom css className to modal
	 */
	public addClass(className: string): this {
		this.configuration.addClass(className);
		return this;
	}

	/**
	 * remove className from modal
	 */
	public removeClass(className: string): this {
		this.configuration.removeClass(className);
		return this;
	}

	public setHeight(height: number, units: string = 'px'): this {
		this.configuration.setHeight({ value: height, units });
		return this;
	}

	public setMinHeight(height: number, units: string = 'px'): this {
		this.configuration.setMinHeight({ value: height, units });
		return this;
	}

	public getMinHeight(): IModalDimension | null {
		return this.configuration.getMinHeight() || null;
	}

	public setMaxHeight(height: number, units: string = 'px'): this {
		this.configuration.setMaxHeight({ value: height, units });
		return this;
	}

	public setWidth(width: number, units: string = 'px'): this {
		this.configuration.setWidth({ value: width, units });
		return this;
	}

	public setMinWidth(width: number, units: string = 'px'): this {
		this.configuration.setMinWidth({ value: width, units });
		return this;
	}

	public setMaxWidth(width: number, units: string = 'px'): this {
		this.configuration.setMaxWidth({ value: width, units });
		return this;
	}

	public setDimensions(height: number, width: number, units: string = 'px'): this {
		this.configuration.setHeight({ value: height, units });
		this.configuration.setWidth({ value: width, units });
		return this;
	}

	public setFullScreen(isFullscreen: boolean = true) {
		this.configuration.setMaximized(isFullscreen);
		return this;
	}

	public offsetLeft(left: number): this {
		this.configuration.setLeftPosition(left);
		return this;
	}

	public getOffsetLeft(): IModalDimension | null {
		return this.configuration.getLeftPosition() != null ? {...this.configuration.getLeftPosition()} : null;
	}

	public offsetTop(top: number): this {
		this.configuration.setTopPosition(top);
		return this;
	}

	public getOffsetTop(): IModalDimension | null {
		return this.configuration.getTopPosition() != null ? {...this.configuration.getTopPosition()} : null;
	}

	/**
	 * method used to force modal closing after preClose return rejection
	 */
	public closeOnError(): this {
		this.closeOnErrorEnabled = true;
		return this;
	}


	/**
	 * trigger detect changes in modal component
	 */
	public detectChanges(): void {
		const changeDetectorRef = this.hostComponentWrapperRef.changeDetectorRef;

		if (!(<any>changeDetectorRef).destroyed && this.componentReady) {
			changeDetectorRef.markForCheck();
			changeDetectorRef.detectChanges();
		}
	}

	/**
	 * method open modal after we set all properties
	 * @example
	 *
	 * modal.open().then(closeFn, errorFn);
	 *
	 * @return  confirm and cancel callbacks
	 */
	public async open<D = any>(): Promise<ModalEvent<ModalEventType, D>> {
		if (!this.componentClassRef && !this.componentClassLoader) {
			throw new Error(`Before calling open() you need to set component() or loadComponent()`);
		}

		if (!this.componentClassRef && this.componentClassLoader) {
			this.componentClassRef = (await this.componentClassLoader());
		}

		let canOpen = true;
		if (!!this.preOpenFn) {
			canOpen = (await this.transformToPromise(this.preOpenFn()));
		}

		if (!canOpen) {
			return new ModalEvent(ModalEventType.Reject);
		}

		if (this.modalResolve) {
			this.resolvedData = (await this.transformToPromise(this.modalResolve.resolve(this)));
		}

		this.prepareComponent();
		if (this._afterInit) {
			this._afterInit();
		}
		return this.modalStatusChange.toPromise();
	}

	public positionOnScreenCenter(center: boolean = true) {
		this.configuration.setPositionToScreenCenter(center);
		return this;
	}

	/**
	 * @internaly
	 */
	public afterViewInit(fn: () => void) {
		if (this._afterViewInit) {
			return;
		}
		this._afterViewInit = fn;
	}

	/**
	 * @internaly
	 */
	public afterInit(fn: () => void) {
		if (this._afterInit) {
			return;
		}
		this._afterInit = fn;
	}

	/**
	 * close modal without confirmation
	 * also return Observable object which will notify subscriptions about successful pre closing
	 */
	public cancel(): Observable<void> {
		return this.performClosing(ModalEventType.Cancel, null);
	}

	/**
	 * close modal with confirmation and custom result
	 * also return Observable object which will notify subscriptions about successful pre closing
	 */
	public close(data: any, eventType: ModalEventType | IModalResult): Observable<void> {
		return this.performClosing(eventType as number, data);
	}

	/**
	 * close modal with confirmation
	 * also return Observable object which will notify subscriptions about successful pre closing
	 */
	public confirm(data: any): Observable<void> {
		return this.performClosing(ModalEventType.Confirm, data);
	}

	/**
	 * toggle visibility
	 */
	public visible(isVisible: boolean = true): this {
		this.configuration.setVisible(isVisible);
		return this;
	}

	/**
	 * Enable modal resizing
	 */
	public resizable(enabled: boolean = true): this {
		if (this.configuration.isMaximized()) {
			return;
		}
		this.configuration.setResizable(enabled, true);
		return this;
	}

	public get isResizable(): boolean {
		return this.configuration.isResizable();
	}

	/**
	 * Enable modal dragging
	 */
	public draggable(enabled: boolean = true): this {
		if (this.configuration.isMaximized()) {
			return;
		}
		this.configuration.setDraggable(enabled, true);
		return this;
	}

	/**
	 * Define component which will be opened in modal
	 */
	public component<T>(component: T): this {
		this.componentClassRef = component;
		return this;
	}

	public loadComponent(loadFn: () => Promise<any>): this {
		this.componentClassLoader = loadFn;
		return this;
	}

	/**
	 * set method which will remove Modal instance from
	 * map array
	 */
	public setDestroyFn(fn: (force: boolean) => void): void {
		this._destroyFn = fn;
	}

	/**
	 * destroy created component
	 */
	public destroy(force: boolean = false): void {
		this.isDestroying = true;

		if (force === true || !this.previous) {
			this.tryToFocusOnClose();
		}

		if (this._destroyFn) {
			this._destroyFn(force);
		}

		this.modalStatusChange.unsubscribe();
		this.viewReadyChange.unsubscribe();
		if (this.hostComponentWrapperRef) {
			this.hostComponentWrapperRef.destroy();
		}
		this._focusElement = null;
	}

	/**
	 * Set element to focus after modal closes
	 */
	public focusOnClose(el: HTMLElement): this {
		this._focusElement = el;
		return this;
	}

	/**
	 * method is used to prevent default enabled focus preservation
	 * if this is disabled, modal will not try to focus any element on close
	 */
	public preserveFocusOnClose(preserveFocus: boolean = true): this {
		this.preserveOnCloseFocus = preserveFocus;
		return this;
	}

	/**
	 * return modal component instance
	 */
	public get hostComponentRef(): ModalComponent {
		return this.hostComponentWrapperRef ? this.hostComponentWrapperRef.instance : null;
	}

	/**
	 * @description set pre close callback function
	 * method will be executed before modal closing
	 */
	public preClose<T>(fn: IPreclose<T>): this {
		this.preCloseFn = fn;
		return this;
	}


	public preOpen<T>(fn: IPreOpen): this {
		this.preOpenFn = fn;
		return this;
	}

	/**
	 * Set modal title
	 */
	public title(title: string): this {
		this.titleValue = title;
		if (this.hostComponentRef) {
			this.hostComponentRef.setTitle(title);
		}
		return this;
	}

	/**
	 * Show close button in right top corrner
	 */
	public showClose(visible: boolean): this {
		this.configuration.setCloseButtonVisible(visible);
		return this;
	}

	/**
	 * Enable close button show
	 */
	public showMaximize(visible: boolean): this {
		this.configuration.setMaximizeButtonVisible(visible);
		return this;
	}

	/**
	 * enable modal collapsing
	 */
	public showCollapse(visible: boolean = true): this {
		this.configuration.setCollapseButtonVisible(visible);
		return this;
	}

	/**
	 * Enable close by ESC
	 */
	public closeOnESC(enable: boolean): this {
		this.configuration.setCloseOnESC(enable);
		return this;
	}

	/**
	 * enable close on document click
	 */
	public closeOnClick(): this {
		this.configuration.setClickOnDocumentClose(true);
		return this;
	}

	/**
	 * used to preserve desktop behavior on mobile devices,
	 * exactly dragging, resizing and etcetera...
	 */
	public preserveDesktopBehavior(isPreserved: boolean = true): this {
		this.configuration.setPreserveDesktopBehavior(isPreserved);
		return this;
	}

	private async transformToPromise<T>(object: Observable<T> | Promise<T> | T): Promise<T> {
		if (isObservable(object)) {
			return object.toPromise();
		}
		return object;
	}

	private tryToFocusOnClose(): void {
		if (this.preserveOnCloseFocus !== true) {
			return;
		}

		// if there isn't any previus modal to focus
		// use `_focusElement` element to focus it
		if (!this.previous && this._focusElement) {
			try {
				// IE/Edge -> prevent scroll to top
				if ((<any>this._focusElement).setActive) {
					(<any>this._focusElement).setActive();
				} else {
					this._focusElement.focus({ preventScroll: true });
				}
			} catch (err) {}
		}
	}

	/**
	 * prepare base modal component and child set by programmer
	 * define all component properties and append it to dialog-anchor element
	 */
	private prepareComponent(): void {
		// ModalComponent instance
		this.hostComponentWrapperRef = this.viewContainerRef.createComponent(ModalComponent, { injector: this.injector });

		const hostComponentInstance = this.hostComponentRef;
		const changeDetectorRef = this.hostComponentWrapperRef.changeDetectorRef;
		Object.defineProperty(hostComponentInstance, 'id', {
			value: this.id,
			enumerable: false,
			writable: false,
			configurable: false
		});

		Object.defineProperty(hostComponentInstance, 'isActive', {
			get: () => ACTIVE_MODAL.isActive(this),
			enumerable: false,
			configurable: false
		});

		hostComponentInstance.setConfiguration(this.configuration);
		// (<any>hostComponentInstance).factory = this;
		// forward settings to Modal box instance
		hostComponentInstance.setTitle(this.titleValue).setCloseFn(() => this.cancel());
		hostComponentInstance.setActive = () => ACTIVE_MODAL.set(this);

		if (!this._focusElement) {
			// set element which will be used to focus on modal close
			this._focusElement = this.tryToFindFocusableElement();
		}

		if (this.previous) {
			// current active element should be focused on modal close
			// we need to tell previous modal to use this element for focus after we close modal
			this.previous.hostComponentRef.focusOnChange = this._focusElement;
		}

		// add child component to our wrapper component instance
		this.prepareChildComponent(hostComponentInstance);

		// extend modal view ready function
		// so we can notify modal service about his readiness
		const ngAfterViewInit = (<any>hostComponentInstance).ngAfterViewInit;
		(<any>hostComponentInstance).ngAfterViewInit = () => {
			ngAfterViewInit.call(hostComponentInstance);
			if (this._afterViewInit) {
				this._afterViewInit();
			}
			this.componentReady = true;
			this.viewReadyChange.next();

			// calculate position according to previous modal
			// but don't do that for messagebox
			if (this.isCalcRequired()) {
				this.calcInitPosition();
			}
		};

		// toggle status
		this.configuration
			.valueChanges
			.pipe(filter(({ type }) => type === ModalConfigurationEventType.VISIBILITY_CHANGE))
			.subscribe(({ value }) => { 
				// is visible
				if (value) {
					ACTIVE_MODAL.set(this);
				} else {
					ACTIVE_MODAL.set(this.previous);
				}
			 });

		// and set this to be active
		ACTIVE_MODAL.set(this);

		changeDetectorRef.detectChanges();

		/**
		 * calculate initial position
		 */
		if (this.isCalcRequired()) {
			this.calcInitPosition();
		}

		// hostComponentInstance.autoFocus();
	}

	private isCalcRequired(): boolean {
		return (this.configuration.getLeftPosition() == null
				&& this.configuration.getTopPosition() == null
				&& !this.configuration.isPositionToScreenCenterEnabled());
	}

	/**
	 * prepare modal child component
	 */
	private prepareChildComponent(parentComponent: ModalComponent): IModalComponent<any> {
		this.componentInstanceRef = parentComponent.addComponent(this.componentClassRef);
		const childComponent = this.componentRef;

		/**
		 * implement members and values to component
		 * instance
		 */
		this.inputBinder?.bind(this);

		Object.defineProperty(childComponent, 'params', {
			value: this.paramsValue,
			enumerable: false,
			writable: false,
			configurable: false
		});
		Object.defineProperty(childComponent, 'additionalParams', {
			value: this.additionalParamsValue,
			enumerable: false,
			writable: false,
			configurable: false
		});

		Object.defineProperty(childComponent, 'confirm', {
			value: (d: any) => this.confirm(d),
			// The method won't show up during object iteration
			enumerable: false,
			// The method can't be overwritten
			writable: false,
			 // The property definition can't be changed or deleted
			configurable: false
		});

		Object.defineProperty(childComponent, 'cancel', {
			value: () => this.cancel(),
			enumerable: false,
			writable: false,
			configurable: false
		});

		Object.defineProperty(childComponent, 'setTitle', {
			value: (title: string) => parentComponent.setTitle((this.titleValue = title)),
			enumerable: false,
			writable: false,
			configurable: false
		});

		Object.defineProperty(childComponent, 'isModal', {
			value: true,
			enumerable: false,
			writable: false,
			configurable: false
		});

		Object.defineProperty(childComponent, 'isActive', {
			get: () => ACTIVE_MODAL.isActive(this),
			enumerable: false,
			configurable: false
		});

		Object.defineProperty(childComponent, 'title', {
			value: this.titleValue,
			enumerable: false,
			writable: false,
			configurable: false
		});

		return childComponent;
	}

	/**
	 * method try to find focusable element depending on ModalSelectors
	 * first find out where to do checking, if we already have
	 * some modal before this use that modal like host otherwise use body
	 *
	 * In host element check is current document.activeElement in ignore list, if it is try to find autoFocus element
	 * and set it like element which will be focused after new modal is closed
	 */
	private tryToFindFocusableElement(): HTMLElement {
		const currentActive = <HTMLElement>document.activeElement;
		let hostElement: HTMLElement;
		let ignoreList;
		const previousComponent = this.previous;

		if (previousComponent) {
			hostElement = previousComponent.componentInstanceRef.location.nativeElement;
			if (!hostElement) {
				console.warn('Element is unknown!');
			}
		}

		if (!hostElement) {
			// if there isn't any modal or modal is message box search in document
			hostElement = <HTMLElement>document.querySelector(this.contentHost);
		}

		// if we can't find host element
		if (!hostElement) {
			return currentActive;
		}

		ignoreList = hostElement.querySelectorAll(this.config.IgnoreFocusSelectors);
		if (ignoreList.length === 0) {
			return currentActive;
		} else if (ignoreList.length > 0) {
			// first check is current active element in ignore list
			// if it isn't return it but
			// if active element isn't our host element or isn't in it,
			// try to find grid or autofocus elements
			if (Array.from(ignoreList).indexOf(currentActive) === -1 && this.contain(hostElement, currentActive)) {
				return currentActive;
			}
		}

		const autoFocus = <HTMLElement>hostElement.querySelector(this.config.AutoFocusSelectors);
		if (autoFocus) {
			return autoFocus;
		}

		return <HTMLElement>hostElement.querySelector(this.config.FocusableSelectors);
	}

	private contain(hostNode: HTMLElement, node: HTMLElement): boolean {
		return node === hostNode ? false : hostNode.contains(node);
	}

	/**
	 * calculate position for new modal
	 * it' can't be positioned over previous one, we need to move it right-bottom, right-top, left-bottom or left-top
	 * but look out on bound box
	 */
	private calcInitPosition() {
		let left = null;
		let top = null;

		const move = 30;

		const wrapperInstance = this.hostComponentRef;

		const boundbox = this.configuration.getBoundbox();
		const height = wrapperInstance.getHeight();
		const width = wrapperInstance.getWidth();

		if (this.previous) {
			const previousWrapperInstance = this.previous.hostComponentRef;

			const previousLeft = previousWrapperInstance.getPositionLeft();
			const previousTop = previousWrapperInstance.getPositionTop();

			// if we can move it to right
			if (previousLeft + width + move < boundbox.width) {
				left = previousLeft + move;
			} else {
				// else move it to the right
				left = move;
			}

			// if we can move it down
			if (previousTop + height + move < boundbox.height) {
				top = previousTop + move;
			} else {
				// move it to down
				top = move;
			}
		} else {
			top = boundbox.height / 2 - height / 2;
			left = boundbox.width / 2 - width / 2;
		}

		top = top < 0 ? 0 : top;

		// set new position
		this.configuration.setPosition(top, left);
	}

	/**
	 * Try to perfome closing
	 * convert Observable to Promise
	 * on the end execute callback
	 * also return Observable object which will notify subscriptions about successful pre closing
	 */
	private performClosing(eventType: ModalEventType, data: any): Observable<void> {
		const closingStatus = new Subject<void>();
		const childComponent = this.componentRef;
		const preCloseFnRef: IClassPreClose = childComponent.preClose || function() {};

		const closeFn = error => {
			console.error(error);
			// notify observer about error in pre closing phase
			closingStatus.error(error);

			// execute only if we want to close it on error
			if (this.closeOnErrorEnabled) {
				if (!this.modalStatusChange.isStopped) {
					this.modalStatusChange.next(new ModalEvent(ModalEventType.Cancel));
					this.modalStatusChange.complete();
				}

				this.destroy();
			}
			closingStatus.complete();
		};

		const emitCloseStatus = () => {
			closingStatus.next();
			closingStatus.complete();
		};

		const confirmFn = () => {
			if (!this.modalStatusChange.isStopped) {
				this.modalStatusChange.next(new ModalEvent(eventType, data));
				this.modalStatusChange.complete();
			}

			// notify observer about successful pre closing
			emitCloseStatus();
			this.destroy();
		};

		this.preCloseToObservable(
			(result: ModalEvent<any, any>) => preCloseFnRef.call(childComponent, result),
			eventType,
			null,
			false
		)
			.pipe(
				tap(value => (value === false ? emitCloseStatus() : null)),
				filter(value => value !== false),
				switchMap(() => this.preCloseToObservable(this.preCloseFn, eventType, data)),
				tap(value => (value === false ? emitCloseStatus() : null)),
				filter(value => value !== false)
			)
			.subscribe(confirmFn, closeFn);

		return closingStatus.asObservable();
	}

	private preCloseToObservable(
		closeFn: IPreclose | IClassPreClose,
		eventType: ModalEventType,
		data?: any,
		emitData: boolean = true
	): Observable<boolean> {
		return new Observable(observable => {
			const emitResult = (r: boolean) => observable.next(r);
			const emitError = err => observable.error(err);

			if (closeFn) {
				/**
				 * emit data only if preClose from code is called,
				 * in class preClose emit only event
				 */
				const result = !emitData
					? (closeFn as IClassPreClose)(eventType)
					: (closeFn as IPreclose)(new ModalEvent(eventType, data));

				if (isPromise(result)) {
					(result as Promise<boolean>).then(emitResult, emitError);
				} else if (isObservable(result)) {
					(result as Observable<boolean>).toPromise().then(emitResult, emitError);
				} else {
					try {
						emitResult(result as boolean);
					} catch (error) {
						emitError(error);
					}
				}
			} else {
				emitResult(true);
			}
		});
	}
}
