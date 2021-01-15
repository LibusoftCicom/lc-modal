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

import { Observable, Subject, isObservable, from, BehaviorSubject } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';

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

	private closeOnEscEnabled = true;

	private showCloseButton = true;

	private maximizeChange: Subject<boolean> = new Subject<boolean>();

	private showMaximizeButton = false;

	private closeByDocument = false;

	private closeOnErrorEnabled = false;

	private isActive = false;

	// initial className
	private initClassName: string = null;

	private height: number = null;

	private minHeight: number = null;

	private maxHeight: number = null;

	// method used to set height
	private _changeHeight: (height: number) => void = null;
	private _changeMaxHeight: (height: number) => void = null;

	private _width: number = null;

	private _minWidth: number = null;

	private maxWidth: number = null;

	private _changeMinWidth: (width: number) => void = null;
	private _changeMaxWidth: (width: number) => void = null;

	// method used to set width
	private _changeWidth: (width: number) => void = null;

	private _offsetLeft: number;

	// method used to change postion to left
	private _changeOffsetLeft: (left: number) => void = null;

	private _offsetTop: number;

	// method used to change postion to top
	private _changeOffsetTop: (top: number) => void = null;

	// method used to change height and width in percentage
	private _changeDimensions: (height: number, width: number, units: string) => void = null;

	private _focusElement: HTMLElement;

	private _positionOnScreenCenter = false;

	private _dimensions: { height: number; width: number; units: string } | null = null;

	private componentReady = false;

	private _fullscreen = false;

	private _isDraggable = false;

	private _lastDraggableState = false;

	private _changeDraggable: (enabled: boolean) => void = null;

	private _isResizable = false;

	private _lastResizableState = false;

	private _changeResizable: (enabled: boolean) => void = null;

	private _previous: this = null;

	private _destroyFn: Function = null;

	// z-index
	private stackOrder: number = null;

	private displayOverlay = true;

	private isVisible = true;
	private visibilityChanges: BehaviorSubject<boolean> = new BehaviorSubject(this.isVisible);

	/**
	 * disable closing modal by CloseAll method,
	 * modal can only be closed by user
	 */
	public closeOnlyByUser = false;

	public isDestroying = false;

	constructor(
		private cfr: ComponentFactoryResolver,
		private viewContainerRef: ViewContainerRef,
		public id: number,
		private injector: Injector,
		private modals: ModalFactory[],
		private config: ModalConfig
	) {
		this.maximizeChange.subscribe(maximize => {
			this._setFullScreen(maximize);
		});
	}

	/**
	 * @description method returns Observable when modal component view is ready
	 * * @returns
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
			modal.hostComponentRef.removeClass('overlay-active');

			if (modal !== this && state === true) {
				modal.active = false;
			}
		});

		const hostInstance = this.hostComponentRef;
		// set property isActive to child component so
		// programers could be able to check is their component current active one
		this.isActive = this.componentRef.isActive = hostInstance.isActive = state;
		// hide or show overlay on this instance
		hostInstance.displayOverlay(this.displayOverlay);

		if (state) {
			// auto focus elements and
			// if element is active set class active to it
			hostInstance.setClass('active');
			if (!isActive) {
				hostInstance.autoFocus();
			}
		} else {
			hostInstance.removeClass('active');
		}

		/**
		 * if element have overlay and if same element is not last
		 * we can't place it above all other with overlay
		 */
		this.preserveOverlay();
	}

	public overlay(enabled: boolean = true): this {
		this.displayOverlay = enabled;
		return this;
	}

	public get overlayVisible(): boolean {
		return this.displayOverlay;
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
		this._positionOnScreenCenter = center;
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
		this.isVisible = isVisible;
		this.visibilityChanges.next(isVisible);
		return this;
	}

	/**
	 * Enable modal resizing
	 */
	public resizable(enabled: boolean = true): this {
		if (this._fullscreen) {
			return;
		}

		return this._resizable(enabled, true);
	}

	public get isResizable(): boolean {
		return this._isResizable;
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
	 * Enable modal dragging
	 */
	public draggable(enabled: boolean = true): this {
		if (this._fullscreen) {
			return;
		}
		return this._draggable(enabled, true);
	}

	/**
	 * change z-index position
	 */
	public order(zIndex: number): void {
		this.stackOrder = zIndex;
	}

	/**
	 * only last element with overlay can have it
	 */
	private preserveOverlay(): void {
		const lastIndex = this.modals.length - 1;

		for (let i = lastIndex; i > -1; i--) {
			const modal = this.modals[i];

			if (modal.displayOverlay && !modal.isDestroying) {
				modal.hostComponentRef.setClass('overlay-active');
				return;
			}
		}
	}

	private changeClassName(className: string, add: boolean): void {
		const hostComponentInstance = this.hostComponentRef;
		if (!hostComponentInstance) {
			return;
		}

		if (add) {
			hostComponentInstance.setClass(className);
		} else {
			hostComponentInstance.removeClass(className);
		}
	}

	private changeMinHeight(height: number): void {
		const hostComponentInstance = this.hostComponentRef;
		if (!hostComponentInstance) {
			return;
		}

		hostComponentInstance.minHeight(height);
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

		// (<any>hostComponentInstance).factory = this;

		// forward settings to Modal box instance
		hostComponentInstance.setTitle(this.titleValue).setCloseFn(() => this.cancel());

		hostComponentInstance.setActive = () => this.active = true;

		if (this.showCloseButton) {
			hostComponentInstance.showClose();
		}
		if (this.closeOnEscEnabled) {
			hostComponentInstance.closeOnESC();
		}
		if (this.closeByDocument) {
			hostComponentInstance.closeOnClick();
		}

		/**
		 * showMaximize only if it is enabled and there isn't any max height or width limitation
		 */
		hostComponentInstance.showMaximize(this.showMaximizeButton && (this.maxWidth == null && this.maxHeight == null));
		hostComponentInstance.maximize = this.maximizeChange;
		hostComponentInstance.maximized = this._fullscreen;

		// initialy we don't have class-change hook that's why we save className like property
		if (this.initClassName) {
			hostComponentInstance.setClass(this.initClassName);
		}

		// set min height and width
		this._changeHeight = (height: number) => hostComponentInstance.height(height);
		this._changeMaxHeight = (height: number) => hostComponentInstance.setMaxHeight(height);

		this._changeWidth = (width: number) => hostComponentInstance.width(width);
		this._changeMinWidth = (width: number) => hostComponentInstance.minWidth(width);
		this._changeMaxWidth = (width: number) => hostComponentInstance.setMaxWidth(width);

		this._changeDimensions = (height: number, width: number, units: string) => {
			hostComponentInstance.height(height, units);
			hostComponentInstance.width(width, units);
		};

		if (this.height) {
			this._changeHeight(this.height);
		}
		if (this._width) {
			this._changeWidth(this._width);
		}
		if (this.minHeight) {
			this.changeMinHeight(this.minHeight);
		}
		if (this.maxHeight) {
			this._changeMaxHeight(this.maxHeight);
		}
		if (this._minWidth) {
			this._changeMinWidth(this._minWidth);
		}
		if (this.maxWidth) {
			this._changeMaxWidth(this.maxWidth);
		}
		if (this._dimensions) {
			const { height, width, units } = this._dimensions;
			this._changeDimensions(height, width, units);
		}

		// set offset positions
		this._changeOffsetLeft = (left: number) => hostComponentInstance.setLeftPosition(left);

		this._changeOffsetTop = (top: number) => hostComponentInstance.setTopPosition(top);

		// if position exist use it
		if (this._offsetLeft) {
			this._changeOffsetLeft(this._offsetLeft);
		}
		if (this._offsetTop) {
			this._changeOffsetTop(this._offsetTop);
		}

		// set draggable options
		this._changeDraggable = (enabled: boolean) => {
			hostComponentInstance.isDraggable = enabled;
			this.detectChanges();
		};
		if (this._isDraggable) {
			this._changeDraggable(this._isDraggable);
		}

		// set resizing
		this._changeResizable = (enabled: boolean) => {
			hostComponentInstance.isResizable = enabled;
			this.detectChanges();
		};

		if (this._isResizable) {
			this._changeResizable(this._isResizable);
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

			// else calculate position according to previous modal
			// but don't do that for messagebox
			if (!this._offsetLeft && !this._offsetTop && !this._positionOnScreenCenter) {
				this.calcInitPosition();
			}
		};

		if (!this._focusElement) {
			// set element which will be used to focus on modal close
			this._focusElement = this.tryToFindFocusableElement();
		}

		// toggle status
		this.visibilityChanges.subscribe((isVisible) => {
			hostComponentInstance.display(isVisible);
			this.active = isVisible;
		});

		// and set this to be active
		this.active = true;

		changeDetectorRef.detectChanges();
		this._setFullScreen(this._fullscreen);

		if (!this._fullscreen) {
			if (!this._minWidth) {
				this.setMinWidth(hostComponentInstance.getWidth());
			}

			if (!this.minHeight) {
				this.setMinHeight(hostComponentInstance.getHeight());
			}
		}

		if (this.stackOrder) {
			hostComponentInstance.changeStackOrder(this.stackOrder);
		}

		hostComponentInstance.autoFocus();
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
				console.warn('Is not included known DOM element!');
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
	 * calculate position for new modal
	 * it' can't be positioned over previous one, we need to move it right-bottom, right-top, left-bottom or left-top
	 * but look out on bound box
	 */
	private calcInitPosition() {
		let left = null;
		let top = null;

		const move = 30;

		const wrapperInstance = this.hostComponentRef;

		const boundbox = wrapperInstance.getBoundbox();
		const height = wrapperInstance.getHeight();
		const width = wrapperInstance.getWidth();

		if (this.previous) {
			const previousWrapperInstance = this.previous.hostComponentRef;

			const previousLeft = previousWrapperInstance.getPositionLeft();
			const previousTop = previousWrapperInstance.getPositionTop();

			// if we can move it to left
			if (previousLeft + width + move < boundbox.width) {
				left = previousLeft + move;
			} else {
				// else move it to the left
				left = move;
			}

			// if we can move it down
			if (previousTop + height + move < boundbox.height) {
				top = previousTop + move;
			} else {
				// move it to up
				top = move;
			}
		} else {
			top = window.innerHeight / 2 - height / 2;
			left = window.innerWidth / 2 - width / 2;
		}

		// set new position
		wrapperInstance.setPosition(top, left);
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
	public showClose(enable: boolean): this {
		this.showCloseButton = enable;
		return this;
	}

	/**
	 * Enable close button show
	 */
	public showMaximize(show: boolean): this {
		this.showMaximizeButton = show;
		return this;
	}

	/**
	 * Enable close by ESC
	 */
	public closeOnESC(enable: boolean): this {
		this.closeOnEscEnabled = enable;
		return this;
	}

	/**
	 * enable close on document click
	 */
	public closeOnClick(): this {
		this.closeByDocument = true;
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
		this.initClassName = className;
		if (this.changeClassName && className) {
			this.changeClassName(className, true);
		}
		return this;
	}

	/**
	 * remove className from modal
	 */
	public removeClass(className: string): this {
		if (this.changeClassName && className) {
			this.changeClassName(className, false);
		}
		return this;
	}

	public setHeight(height: number): this {
		if (!this.minHeight) {
			this.setMinHeight(height);
		}

		this.height = height;
		if (this._changeHeight && height > 0) {
			this._changeHeight(height);
		}
		return this;
	}

	public setMinHeight(height: number): this {
		this.minHeight = height;
		if (height > 0) {
			this.changeMinHeight(height);
		}
		return this;
	}

	public setMaxHeight(height: number): this {
		this.maxHeight = height;
		if (this._changeMaxHeight && height > 0) {
			this._changeMaxHeight(height);
		}
		return this;
	}

	public setWidth(width: number): this {
		if (!this._minWidth) {
			this.setMinWidth(width);
		}

		this._width = width;
		if (this._changeWidth && width > 0) {
			this._changeWidth(width);
		}
		return this;
	}

	public setMinWidth(width: number): this {
		this._minWidth = width;
		if (this._changeMinWidth && width > 0) {
			this._changeMinWidth(width);
		}
		return this;
	}

	public setMaxWidth(width: number): this {
		this.maxWidth = width;
		if (this._changeMaxWidth && width > 0) {
			this._changeMaxWidth(width);
		}
		return this;
	}

	public setDimensions(height: number, width: number, units: string = 'px'): this {
		this._dimensions = { height, width, units };
		if (this._changeDimensions) {
			if (height && width && units) {
				this._changeDimensions(height, width, units);
			}
		}
		return this;
	}

	public setFullScreen(fullscreen: boolean = true) {
		this.maximizeChange.next(fullscreen);
		return this;
	}

	private _setFullScreen(fullscreen: boolean) {
		this._fullscreen = fullscreen;
		if (this.active) {
			fullscreen ? this.setClass('fullscreen') : this.removeClass('fullscreen');
			this.notifyResize();
		}

		if (fullscreen) {
			this._draggable(false, false);
			this._resizable(false, false);
		} else {
			this._draggable(this._lastDraggableState, false);
			this._resizable(this._lastResizableState, false);
		}

		return this;
	}

	private notifyResize() {
		if (typeof CustomEvent === 'function') {
			// modern browsers
			window.dispatchEvent(new CustomEvent('resize'));
		} else {
			// for IE and other old browsers
			// causes deprecation warning on modern browsers
			const evt = window.document.createEvent('CustomEvent');
			evt.initCustomEvent('resize', true, false, 0);
			window.dispatchEvent(evt);
		}
	}

	public offsetLeft(left: number): this {
		this._offsetLeft = left;
		if (this._changeOffsetLeft) {
			this._changeOffsetLeft(left);
		}
		return this;
	}

	public offsetTop(top: number): this {
		this._offsetTop = top;
		if (this._changeOffsetTop) {
			this._changeOffsetTop(top);
		}
		return this;
	}

	/**
	 * method used to force modal closing after preClose return rejection
	 */
	public closeOnError(): this {
		this.closeOnErrorEnabled = true;
		return this;
	}

	/**
	 * Enable modal dragging
	 */
	private _draggable(enabled: boolean, saveState: boolean): this {
		if (saveState) {
			this._lastDraggableState = enabled;
		}

		this._isDraggable = enabled;

		if (this._changeDraggable) {
			this._changeDraggable(this._isDraggable);
		}
		return this;
	}

	private _resizable(enabled: boolean, saveState: boolean): this {
		if (saveState) {
			this._lastResizableState = enabled;
		}

		this._isResizable = enabled;

		this.showMaximize(true);
		if (this._changeResizable) {
			this._changeResizable(this._isResizable);
		}
		return this;
	}
}
