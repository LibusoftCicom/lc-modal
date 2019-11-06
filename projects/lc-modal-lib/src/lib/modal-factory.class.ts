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

import { Observable, Subject, isObservable, from } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';

function isPromise(obj: any): obj is Promise<any> {
	// allow any Promise/A+ compliant thenable.
	// It's up to the caller to ensure that obj.then conforms to the spec
	return !!obj && typeof obj.then === 'function';
}

export class ModalFactory implements IModal<ModalFactory> {

	constructor(
		private cfr: ComponentFactoryResolver,
		private viewContainerRef: ViewContainerRef,
		public id: number,
		private injector: Injector,
		private modals: ModalFactory[],
		private config: ModalConfig
	) {
		this._maximize.subscribe(maximize => {
			this._setFullScreen(maximize);
		});
	}

	/**
	 * @description method returns Observable when modal component view is ready
	 * * @returns
	 */
	public get isReady(): Observable<void> {
		return this._viewReady.asObservable();
	}

	/**
	 * get active modal
	 */
	public get active(): boolean {
		return this._active;
	}

	public set activeClass(state: boolean) {
		const wrapperInstance = this._baseComponentWrapperRef.instance;
		// set property isActive to child component so
		// programers could be able to check is their component current active one
		this._active = this._componentInstanceRef.instance.isActive = wrapperInstance.isActive = state;

		if (state) {
			// auto focus elements and
			// if element is active set class active to it
			wrapperInstance.setClass('active');
		} else {
			wrapperInstance.removeClass('active');
		}
	}
	/**
	 * set modal as active, put flags to modal wrapper and child component we used
	 * to create modal
	 */
	public set active(state: boolean) {
		const wrapperInstance = this._baseComponentWrapperRef.instance;
		// set property isActive to child component so
		// programers could be able to check is their component current active one
		this._active = this._componentInstanceRef.instance.isActive = wrapperInstance.isActive = state;
		this.activeClass = state;

		if (state) {
			// auto focus elements and
			// if element is active set class active to it
			wrapperInstance.autoFocus();
		}
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
	public get modalComponentRef(): this {
		return !!this._componentInstanceRef && !!this._componentInstanceRef.instance
			? this._componentInstanceRef.instance
			: null;
	}
	private contentHost = '#content';

	private _title: string = null;

	private _params: any = null;

	private _componentFactory: ComponentFactory<any> = null;

	private _component: any = null;

	private _componentInstanceRef: any = null;

	private _baseComponentWrapperFactory: ComponentFactory<ModalComponent> = null;

	private _baseComponentWrapperRef: ComponentRef<ModalComponent> = null;

	private _modalStatus: Subject<IModalResultData<any>> = new Subject();

	private _viewReady: Subject<any> = new Subject();

	private _additionalParams: any;

	private _preCloseFn: IPreclose = null;

	private _closeOnESC = true;

	private _showCloseButton = true;

	private _maximize: Subject<boolean> = new Subject<boolean>();

	private _showMaximize = false;

	private _closeByDocument = false;

	private _closeOnError = false;

	public _active = false;

	/**
	 * disable colsing modal by CloseAll method,
	 * modal can only be closed by user
	 */
	public closeOnlyByUser = false;

	// initial className
	private _initClassName: string = null;

	// method used to add/remove class name after we instance
	private _changeClassName: (className: string, add: boolean) => void = null;

	private _height: number = null;

	private _minHeight: number = null;

	private _changeMinHeight: (width: number) => void = null;

	// method used to set height
	private _changeHeight: (height: number) => void = null;

	private _width: number = null;

	private _minWidth: number = null;

	private _changeMinWidth: (width: number) => void = null;

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

	private _onlyLastModalActive: boolean = true;

	/**
	 * trigger detect changes in modal component
	 */
	public detectChanges(): void {
		const changeDetectorRef = this._baseComponentWrapperRef.changeDetectorRef;

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
	public open<D>(): Promise<IModalResultData<D>> {
		if (!this._component) {
			return <any>Promise.reject(`Before calling open() you need to set component()`);
		}

		this.prepareComponent();

		return this._modalStatus.toPromise();
	}

	public positionOnScreenCenter(center: boolean = true) {
		this._positionOnScreenCenter = center;
		return this;
	}

	/**
	 * prepare base modal component and child set by programmer
	 * define all component properties and append it to dialog-anchor element
	 */
	private prepareComponent(): void {
		// ModalComponent instance
		this._baseComponentWrapperRef = this.viewContainerRef.createComponent(
			this._baseComponentWrapperFactory,
			null,
			this.injector
		);
		const hostComponentInstance = this.getComponentInstance();
		const changeDetectorRef = this._baseComponentWrapperRef.changeDetectorRef;
		hostComponentInstance['id'] = this.id;

		// (<any>hostComponentInstance).factory = this;

		// forward settings to Modal box instance
		hostComponentInstance.setTitle(this._title).setCloseFn(() => this.cancel());

		if (this._showCloseButton) {
			hostComponentInstance.showClose();
		}
		if (this._closeOnESC) {
			hostComponentInstance.closeOnESC();
		}
		if (this._closeByDocument) {
			hostComponentInstance.closeOnClick();
		}

		hostComponentInstance.showMaximize(this._showMaximize);
		hostComponentInstance.maximize = this._maximize;
		hostComponentInstance.maximized = this._fullscreen;
		hostComponentInstance.onlyLastModalActive(this._onlyLastModalActive);

		this._changeClassName = (className: string, add: boolean) => {
			if (add) {
				hostComponentInstance.setClass(className);
			} else {
				hostComponentInstance.removeClass(className);
			}
		};

		// initialy we don't have class-change hook that's why we save className like property
		if (this._initClassName) {
			hostComponentInstance.setClass(this._initClassName);
		}

		// set min height and width
		this._changeHeight = (height: number) => hostComponentInstance.height(height);

		this._changeWidth = (width: number) => hostComponentInstance.width(width);

		this._changeMinHeight = (height: number) => hostComponentInstance.minHeight(height);

		this._changeMinWidth = (width: number) => hostComponentInstance.minWidth(width);

		this._changeDimensions = (height: number, width: number, units: string) => {
			hostComponentInstance.height(height, units);
			hostComponentInstance.width(width, units);
		};

		if (this._height) {
			this._changeHeight(this._height);
		}
		if (this._width) {
			this._changeWidth(this._width);
		}
		if (this._minHeight) {
			this._changeMinHeight(this._minHeight);
		}
		if (this._minWidth) {
			this._changeMinWidth(this._minWidth);
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

			this._viewReady.next();

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

		if (this.previous) {
			// flag previous modal as inactive
			this.previous.active = false;

			// current active element should be focused on modal close
			// we need to tell previous modal to use this element for focus after we close modal
			this.previous._baseComponentWrapperRef.instance.focusOnChange = this._focusElement;
		}

		changeDetectorRef.detectChanges();

		// and set this to be active
		this.active = true;

		this._setFullScreen(this._fullscreen);

		if (!this._fullscreen) {
			if (!this._minWidth) {
				this.setMinWidth(hostComponentInstance.getWidth());
			}

			if (!this._minHeight) {
				this.setMinHeight(hostComponentInstance.getHeight());
			}
		}
	}

	/**
	 * prepare modal child component
	 * * @param  parentComponent
	 */
	private prepareChildComponent(parentComponent: ModalComponent): IModalComponent<any> {
		this._componentInstanceRef = parentComponent.addComponent(this._componentFactory);
		const childComponent = <IModalComponent<any>>this._componentInstanceRef.instance;

		// potrebno je implementirati određene metode na svaku class-u koja se koristi unutar modala
		childComponent.params = this._params;
		childComponent['additionalParams'] = this._additionalParams;
		childComponent['isModal'] = true;
		childComponent.confirm = (d: any) => this.confirm(d);

		childComponent.cancel = () => this.cancel();
		childComponent.setTitle = (title: string) => parentComponent.setTitle((this._title = title));

		childComponent.title = this._title;
		return childComponent;
	}

	private _afterViewInit: () => void = () => {};

	public afterViewInit(fn: () => void) {
		this._afterViewInit = fn;
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
			hostElement = previousComponent._componentInstanceRef.location.nativeElement;
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
			// first check is current active element is in ignore list
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
	 * @param el HTML element
	 */
	public focusOnClose(el: HTMLElement): this {
		this._focusElement = el;
		return this;
	}

	/**
	 * return modal component instance
	 */
	public getComponentInstance(): ModalComponent {
		return this._baseComponentWrapperRef.instance;
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

		const wrapperInstance = this.getComponentInstance();

		const boundbox = wrapperInstance.getBoundbox();
		const height = wrapperInstance.getHeight();
		const width = wrapperInstance.getWidth();

		if (this.previous) {
			const previousWrapperInstance = this.previous.getComponentInstance();

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
	 * Try to perfome closing
	 * convert Observable to Promise
	 * on the end execute callback
	 * also return Observable object which will notify subscriptions about successful pre closing
	 */
	private performClosing(modalResult: IModalResult, data: any): Observable<void> {
		const closingStatus = new Subject<void>();
		const childComponent = this._componentInstanceRef.instance;
		const preCloseFnRef: IClassPreclose = childComponent.preClose || function() {};

		const closeFn = error => {
			// notify observer about error in pre closing phase
			closingStatus.error(error);

			// execute only if we want to close it on error
			if (this._closeOnError) {
				if (!this._modalStatus.isStopped) {
					this._modalStatus.next({
						modalResult: IModalResult.Cancel,
						data: null
					});
					this._modalStatus.complete();
				}

				this.destroy();
			}
			closingStatus.complete();
		};

		const confirmFn = () => {
			if (!this._modalStatus.isStopped) {
				this._modalStatus.next({ modalResult, data });
				this._modalStatus.complete();
			}

			// notify observer about successful pre closing
			emitCloseStatus();
			this.destroy();
		};

		const emitCloseStatus = () => {
			closingStatus.next();
			closingStatus.complete();
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
				switchMap(() => this.preCloseToObservable(this._preCloseFn, modalResult, data)),
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
		return Observable.create(observable => {
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
					observable.toPromise().then(emitResult, emitError);
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
		this._preCloseFn = fn;
		return this;
	}

	/**
	 * Set modal title
	 * @param  title
	 */
	public title(title: string): this {
		this._title = title;
		return this;
	}

	/**
	 * Set onlyLastModalActive
	 * @param  enable
	 */
	public onlyLastModalActive(enable: boolean): this {
		this._onlyLastModalActive = enable;
		return this;
	}

	/**
	 * Show close button in right top corrner
	 * @param  enable
	 */
	public showClose(enable: boolean): this {
		this._showCloseButton = enable;
		return this;
	}

	/**
	 * Enable close button show
	 */
	public showMaximize(show: boolean): this {
		this._showMaximize = show;
		return this;
	}

	/**
	 * Enable close by ESC
	 * @param  enable
	 */
	public closeOnESC(enable: boolean): this {
		this._closeOnESC = enable;
		return this;
	}

	/**
	 * enable close on document click
	 */
	public closeOnClick(): this {
		this._closeByDocument = true;
		return this;
	}

	/**
	 * forward any parameters to component in modal
	 */
	public params(params: any): this {
		this._params = params;
		return this;
	}

	/**
	 * Postavi dodatne parametre modala, npr. ako je u params data ili DTO, u
	 * dodatnim parametrima možda je parametar tipa (omoguciNesto)
	 */
	public additionalParams(additionalParams: any): this {
		this._additionalParams = additionalParams;
		return this;
	}

	/**
	 * add custom css className to modal
	 */
	public setClass(className: string): this {
		this._initClassName = className;
		if (this._changeClassName && className) {
			this._changeClassName(className, true);
		}
		return this;
	}

	/**
	 * remove className from modal
	 * @param className
	 */
	public removeClass(className: string): this {
		if (this._changeClassName && className) {
			this._changeClassName(className, false);
		}
		return this;
	}

	public setHeight(height: number): this {
		if (!this._minHeight) {
			this.setMinHeight(height);
		}

		this._height = height;
		if (this._changeHeight && height > 0) {
			this._changeHeight(height);
		}
		return this;
	}

	public setMinHeight(height: number): this {
		this._minHeight = height;
		if (this._changeMinHeight && height > 0) {
			this._changeMinHeight(height);
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

	public setDimensions(height: number, width: number, units: string = 'px'): this {
		this._dimensions = { height, width, units };
		if (this._changeDimensions) {
			const { height, width, units } = this._dimensions;
			if (height && width && units) {
				this._changeDimensions(height, width, units);
			}
		}
		return this;
	}

	public setFullScreen(fullscreen: boolean = true) {
		this._maximize.next(fullscreen);
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
		this._closeOnError = true;
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

	/**
	 * Enable modal dragging
	 */
	public draggable(enabled: boolean = true): this {
		if (this._fullscreen) {
			return;
		}

		return this._draggable(enabled, true);
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

	/**
	 * Enable modal resizing
	 */
	public resizable(enabled: boolean = true): this {
		if (this._fullscreen) {
			return;
		}

		return this._resizable(enabled, true);
	}

	/**
	 * Define component which will be opened in modal
	 */
	public component<T>(component: T): this {
		this._component = component;
		this._componentFactory = this.cfr.resolveComponentFactory(component as any);
		this._baseComponentWrapperFactory = this.cfr.resolveComponentFactory(ModalComponent);
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

		this._modalStatus.unsubscribe();
		this._viewReady.unsubscribe();
		this._baseComponentWrapperRef && this._baseComponentWrapperRef.destroy();
		this._focusElement = null;
	}
}
