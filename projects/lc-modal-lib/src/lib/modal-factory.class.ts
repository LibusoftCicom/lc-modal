import { ComponentFactoryResolver, ViewContainerRef, ComponentFactory, ComponentRef, Injector } from '@angular/core';
import { ModalComponent } from './modal.component';
import {
	IModalResultData,
	IModal,
	IModalResult,
	IModalComponent,
	IPreclose,
	IClassPreclose
} from './modal-types.class';
import { ModalConfig } from './modal-config.class';

import { Observable, Subject, isObservable } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { IModalDimension, ModalClassNames, ModalConfiguration, ModalConfigurationEventType } from './modal-configuration.class';

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

	private componentFactory: ComponentFactory<any> = null;

	private componentInstanceRef: ComponentRef<any> = null;

	private componentFactoryRef: () => any = null;

	private hostComponentWrapperFactory: ComponentFactory<ModalComponent> = null;

	private hostComponentWrapperRef: ComponentRef<ModalComponent> = null;

	private modalStatusChange: Subject<IModalResultData<any>> = new Subject();

	private viewReadyChange: Subject<any> = new Subject();

	private preCloseFn: IPreclose = null;

	private closeOnErrorEnabled = false;

	private isActive = false;

	private _focusElement: HTMLElement;

	private componentReady = false;

	private _previous: this = null;

	private _destroyFn: Function = null;

	/**
	 * disable closing modal by CloseAll method,
	 * modal can only be closed by user
	 */
	public closeOnlyByUser = false;

	public isDestroying = false;

	private readonly configuration: ModalConfiguration = new ModalConfiguration();

	constructor(
		private cfr: ComponentFactoryResolver,
		private viewContainerRef: ViewContainerRef,
		public id: number,
		private injector: Injector,
		private modals: ModalFactory[],
		private config: ModalConfig
	) {}

	/**
	 * @description method returns Observable when modal component view is ready
	 */
	public get isReady(): Observable<void> {
		return this.viewReadyChange.asObservable();
	}

	/**
	 * get active modal
	 */
	public get active(): boolean {
		return this.isActive;
	}

	/**
	 * set modal as active, put flags to modal wrapper and child component we used
	 * to create modal
	 */
	public set active(state: boolean) {
		const isActive = this.isActive;
		/**
		 * toggle all other modals active state to false
		 */
		this.modals.forEach((modal) => {
			modal.configuration.removeClass(ModalClassNames.OVERLAY_ACTIVE);

			if (modal !== this && state === true) {
				modal.active = false;
			}
		});

		const hostInstance = this.hostComponentRef;
		// set property isActive to child component so
		// programers could be able to check is their component current active one
		this.isActive = this.componentRef.isActive = hostInstance.isActive = state;
		// hide or show overlay on this instance

		if (state) {
			// auto focus elements and
			// if element is active set class active to it
			this.configuration.addClass(ModalClassNames.ACTIVE);
			if (!isActive) {
				hostInstance.autoFocus();
			}
		} else {
			this.configuration.removeClass(ModalClassNames.ACTIVE);
		}

		/**
		 * if element have overlay and if same element is not last
		 * we can't place it above all other with overlay
		 */
		this.preserveOverlay();
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
	public set previous(modal: this) {
		this._previous = modal;
	}

	/**
	 * get reference to previous Modal instance
	 */
	public get previous(): this {
		return this._previous;
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
	public async open<D>(): Promise<IModalResultData<D>> {
		if (!this.componentFactoryRef) {
			throw new Error(`Before calling open() you need to set component()`);
		}

		this.prepareComponent();
		return this.modalStatusChange.toPromise();
	}

	public positionOnScreenCenter(center: boolean = true) {
		this.configuration.setPositionToScreenCenter(center);
		return this;
	}

	public afterViewInit(fn: () => void) {
		this._afterViewInit = fn;
	}

	/**
	 * close modal without confirmation
	 * also return Observable object which will notify subscriptions about successful pre closing
	 */
	public cancel(): Observable<void> {
		return this.performClosing(IModalResult.Cancel, null);
	}

	/**
	 * close modal with confirmation and custom result
	 * also return Observable object which will notify subscriptions about successful pre closing
	 */
	public close(data: any, modalResult: IModalResult): Observable<void> {
		return this.performClosing(modalResult, data);
	}

	/**
	 * close modal with confirmation
	 * also return Observable object which will notify subscriptions about successful pre closing
	 */
	public confirm(data: any): Observable<void> {
		return this.performClosing(IModalResult.Confirm, data);
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

	// TODO -> naziv nove povezat s time da all devices same

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
		this.componentFactoryRef = () => component;
		this.componentFactory = this.cfr.resolveComponentFactory(this.componentFactoryRef());
		this.hostComponentWrapperFactory = this.cfr.resolveComponentFactory(ModalComponent);
		return this;
	}

	/**
	 * set method which will remove Modal instance from
	 * map array
	 */
	public setDestroyFn(fn: Function): void {
		this._destroyFn = fn;
	}

	/**
	 * destroy created component
	 */
	public destroy(force: boolean = false): void {
		this.isDestroying = true;
		if (force !== true) {
			if (this.previous) {
				this.previous.active = true;
			} else {
				// if there isn't any previus modal to focus
				// use `_focusElement` element to focus it
				if (this.modals.length === 1 && this._focusElement) {
					try {
						// IE/Edge -> prevent scroll to top
						if ((<any>this._focusElement).setActive) {
							(<any>this._focusElement).setActive();
						} else {
							this._focusElement.focus();
						}
					} catch (err) {}
				}
			}
		}

		if (this._destroyFn) {
			this._destroyFn();
		}

		this.modalStatusChange.unsubscribe();
		this.viewReadyChange.unsubscribe();
		if (this.hostComponentWrapperRef) {
			this.hostComponentWrapperRef.destroy();
		}
		this._focusElement = null;
	}

	/**
	 * change z-index position
	 */
	public order(zIndex: number): void {
		this.configuration.setOrder(zIndex);
	}

	/**
	 * Set element to focus after modal closes
	 */
	public focusOnClose(el: HTMLElement): this {
		this._focusElement = el;
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

	/**
	 * Set modal title
	 */
	public title(title: string): this {
		this.titleValue = title;
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
	 * forward any parameters to component in modal
	 */
	public params(params: any): this {
		this.paramsValue = params;
		return this;
	}

	/**
	 * set additional params
	 */
	public additionalParams(additionalParams: any): this {
		this.additionalParamsValue = additionalParams;
		return this;
	}

	/**
	 * add custom css className to modal
	 */
	public setClass(className: string): this {
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
	 * used to preserve desktop behavior on mobile devices,
	 * exactly dragging, resizing and etcetera...
	 */
	public preserveDesktopBehavior(isPreserved: boolean = true): this {
		this.configuration.setPreserveDesktopBehavior(isPreserved);
		return this;
	}

	/**
	 * only last element with overlay can have it
	 */
	private preserveOverlay(): void {
		const lastIndex = this.modals.length - 1;

		for (let i = lastIndex; i > -1; i--) {
			const modal = this.modals[i];

			if (modal.configuration.isOverlayVisible() && !modal.isDestroying) {
				modal.configuration.addClass(ModalClassNames.OVERLAY_ACTIVE);
				return;
			}
		}
	}

	/**
	 * prepare base modal component and child set by programmer
	 * define all component properties and append it to dialog-anchor element
	 */
	private prepareComponent(): void {
		// ModalComponent instance
		this.hostComponentWrapperRef = this.viewContainerRef.createComponent(
			this.hostComponentWrapperFactory,
			null,
			this.injector
		);
		const hostComponentInstance = this.hostComponentRef;
		const changeDetectorRef = this.hostComponentWrapperRef.changeDetectorRef;
		hostComponentInstance['id'] = this.id;
		hostComponentInstance.setConfiguration(this.configuration);
		// (<any>hostComponentInstance).factory = this;
		// forward settings to Modal box instance
		hostComponentInstance.setTitle(this.titleValue).setCloseFn(() => this.cancel());
		hostComponentInstance.setActive = () => this.active = true;

		if (!this._focusElement) {
			// set element which will be used to focus on modal close
			this._focusElement = this.tryToFindFocusableElement();
		}

		if (this.previous) {
			// flag previous modal as inactive
			this.previous.active = false;

			// current active element should be focused on modal close
			// we need to tell previous modal to use this element for focus after we close modal
			this.previous.hostComponentRef.focusOnChange = this._focusElement;
		}

		this.isActive = true;
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
			.subscribe(({ value }) => { this.active = value; });

		// and set this to be active
		this.active = true;

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
		this.componentInstanceRef = parentComponent.addComponent(this.componentFactory);
		const childComponent = this.componentRef;

		/**
		 * implement members and values to component
		 * instance
		 */
		childComponent.params = this.paramsValue;
		childComponent['additionalParams'] = this.additionalParamsValue;
		childComponent['isModal'] = true;
		childComponent.confirm = (d: any) => this.confirm(d);

		childComponent.cancel = () => this.cancel();
		childComponent.setTitle = (title: string) => parentComponent.setTitle((this.titleValue = title));

		childComponent.title = this.titleValue;
		return childComponent;
	}

	private _afterViewInit: () => void = () => {};

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
	private performClosing(modalResult: IModalResult, data: any): Observable<void> {
		const closingStatus = new Subject<void>();
		const childComponent = this.componentRef;
		const preCloseFnRef: IClassPreclose = childComponent.preClose || function() {};

		const closeFn = error => {
			// notify observer about error in pre closing phase
			closingStatus.error(error);

			// execute only if we want to close it on error
			if (this.closeOnErrorEnabled) {
				if (!this.modalStatusChange.isStopped) {
					this.modalStatusChange.next({
						modalResult: IModalResult.Cancel,
						data: null
					});
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
				this.modalStatusChange.next({ modalResult, data });
				this.modalStatusChange.complete();
			}

			// notify observer about successful pre closing
			emitCloseStatus();
			this.destroy();
		};

		this.preCloseToObservable(
			(result: IModalResultData<any>) => preCloseFnRef.call(childComponent, result),
			modalResult,
			null,
			false
		)
			.pipe(
				tap(value => (value === false ? emitCloseStatus() : null)),
				filter(value => value !== false),
				switchMap(() => this.preCloseToObservable(this.preCloseFn, modalResult, data)),
				tap(value => (value === false ? emitCloseStatus() : null)),
				filter(value => value !== false)
			)
			.subscribe(confirmFn, closeFn);

		return closingStatus.asObservable();
	}

	private preCloseToObservable(
		closeFn: IPreclose | IClassPreclose,
		modalResult: IModalResult,
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
					? (closeFn as IClassPreclose)(modalResult)
					: (closeFn as IPreclose)({ modalResult, data });

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
