import {
	Component,
	OnInit,
	AfterViewInit,
	ViewContainerRef,
	ElementRef,
	ViewChild,
	ComponentRef,
	HostListener,
	Renderer2,
	OnDestroy,
	ComponentFactory,
	ChangeDetectorRef,
	AfterContentInit
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalConfig, MODAL_DEFAULT_SELECTOR } from './modal-config.class';
import { IHostModalComponent } from './modal-component.interface';
import {
	IModalConfigurationEvent,
	IModalDimension,
	ModalConfiguration,
	ModalConfigurationEventType,
	ModalDimensionUnits
} from './modal-configuration.class';
import { filter } from 'rxjs/operators';
import { Resizable } from './resizable/resizable.component';
import { Draggable } from './draggable/draggable.directive';

@Component({
	selector: `modal-component`,
	templateUrl: `./modal.component.html`,
	styleUrls: ['./modal.component.scss'],
	host: {
		'tabindex': '-1'
	}
})
export class ModalComponent implements OnInit, AfterViewInit, AfterContentInit, OnDestroy, IHostModalComponent {

	@ViewChild('content', { static: true, read: ViewContainerRef })
	private contentRef: ViewContainerRef;

	@ViewChild('modalBox', { static: true })
	private modalBox: ElementRef;

	private resizableRef: Resizable | null;

	@ViewChild(Draggable, { static: true })
	private readonly draggableRef: Draggable;

	private closeByDocumentEnabled = false;

	private readonly hostElementRef: ElementRef;

	private eventDestroyHooks: Function[] = [];
	private eventDestroySubscriptions: Subscription[] = [];

	public title: string;

	public closeButtonEnabled = false;

	public maximizeButtonEnabled = false;

	public collapseButtonEnabled = false;

	public maximized = false;

	public collapsed = false;

	public closeFn: () => void;

	public isActive = false;

	public isDraggable = false;

	public isResizable = false;

	public focusOnChangeElement: Element = null;

	private modalConfiguration: ModalConfiguration = null;

	constructor(
		vcRef: ViewContainerRef,
		private readonly cdr: ChangeDetectorRef,
		private readonly renderer: Renderer2,
		private readonly config: ModalConfig) {
		this.hostElementRef = vcRef.element;
	}

	public ngOnInit(): void {
		this.registerEventListeners();
		this.setInitialValues();
	}

	public ngAfterContentInit(): void {
		this.draggableRef.setParent(this);
	}

	public ngAfterViewInit(): void {
		setTimeout(() => this.autoFocus(), 100);
		this.setInitialMinSizes();
	}

	public ngOnDestroy(): void {
		this.eventDestroySubscriptions.forEach(subscription => subscription.unsubscribe());
		this.eventDestroySubscriptions.length = 0;
		this.eventDestroyHooks.forEach(destroyFn => destroyFn());
		this.eventDestroyHooks.length = 0;
		this.focusOnChangeElement = null;
		this.modalConfiguration = null;
	}

	@ViewChild(Resizable)
	public set resizable(elRef: Resizable) {
		if (elRef) {
			this.resizableRef = elRef;
			this.resizableRef.setParent(this);
		}
	}

	public getHostElementRef(): ElementRef {
		return this.hostElementRef;
	}

	public setConfiguration(modalConfiguration: ModalConfiguration): void {
		this.modalConfiguration = modalConfiguration;
	}

	public getConfiguration(): ModalConfiguration {
		return this.modalConfiguration;
	}

	public detectChanges(): void {
		this.cdr.markForCheck();
		this.cdr.detectChanges();
	}

	public get headerVisible(): boolean {
		return !!this.title;
	}

	/**
	 * Set modal title
	 */
	public setTitle(title: string): this {
		this.title = title;
		return this;
	}

	/**
	 * on double click toggle modal size
	 */
	public toggleMaximize() {
		if (!this.maximizeButtonEnabled) {
			return;
		}
		this.modalConfiguration.toggleMaximize();
	}

	public toggleCollapse() {
		if (!this.collapseButtonEnabled) {
			return;
		}
		this.modalConfiguration.toggleCollapse();
	}

	/**
	 * set method used on CLOSE button
	 */
	public setCloseFn(fn: () => void): this {
		this.closeFn = fn;
		return this;
	}

	public addComponent<T>(componentFactory: ComponentFactory<T>): ComponentRef<T> {
		return this.contentRef.createComponent(componentFactory);
	}

	public getControlsWidth(): null | string {
		const BUTTON_WIDTH = 28;
		let width = 0;

		if (this.closeButtonEnabled) {
			width += BUTTON_WIDTH;
		}
		if (this.maximizeButtonEnabled) {
			width += BUTTON_WIDTH;
		}
		if (this.collapseButtonEnabled) {
			width += BUTTON_WIDTH;
		}

		return width === 0 ? null : width + ModalDimensionUnits.PIXEL;
	}

	/**
	 * in case we doesn't have min width and min height:
	 * we will have problem in case when
	 * user want to resize modal window
	 */
	private setInitialMinSizes(): void {
		if (!this.modalConfiguration.getMinWidth()) {
			this.modalConfiguration.setMinWidth({ value: this.getWidth(), units: ModalDimensionUnits.PIXEL });
		}

		/**
		 * due to the resize it is necessary to set the min-size,
		 * but it must not exceed 100% of the page height
		 */
		if (!this.modalConfiguration.getMinHeight()) {
			const windowHeight = this.modalConfiguration.getBoundbox().height;
			if (this.getHeight() < windowHeight) {
				this.modalConfiguration.setMinHeight({ value: this.getHeight(), units: ModalDimensionUnits.PIXEL });
			} else {
				this.modalConfiguration.setMinHeight({ value: 90, units: ModalDimensionUnits.PERCENTAGE });
				this.modalConfiguration.setTopPosition(0);
			}
		}

		/**
		 * if it does not exist it is necessary to set the height to max 100%
		 * to limit modal height so that the modal does not fall out of the screen
		 */
		if (!this.modalConfiguration.getMaxHeight()) {
			this.modalConfiguration.setMaxHeight({ value: 100, units: ModalDimensionUnits.PERCENTAGE });
		}
	}

	private setInitialValues(): void {
		this.display(this.modalConfiguration.isVisible());
		this.isDraggable = this.modalConfiguration.isDraggable();
		/**
		 * initialy if full screen is enabled mark component as maximized
		 */
		if (this.modalConfiguration.isMaximized()) {
			// to trigger class change emit this event
			this.modalConfiguration.setMaximized(true);
		} else {
			/**
			   * dimension configuration
			   */
			this.height(this.modalConfiguration.getHeight()?.value, this.modalConfiguration.getHeight()?.units);
			this.minHeight(this.modalConfiguration.getMinHeight()?.value, this.modalConfiguration.getMinHeight()?.units);
			this.setMaxHeight(this.modalConfiguration.getMaxHeight()?.value, this.modalConfiguration.getMaxHeight()?.units);
			this.width(this.modalConfiguration.getWidth()?.value, this.modalConfiguration.getWidth()?.units);
			this.minWidth(this.modalConfiguration.getMinWidth()?.value, this.modalConfiguration.getMinWidth()?.units);
			this.setMaxWidth(this.modalConfiguration.getMaxWidth()?.value, this.modalConfiguration.getMaxWidth()?.units);
		}

		this.maximizeButtonEnabled = this.modalConfiguration.isMaximizeButtonVisible();
		this.isResizable = this.modalConfiguration.isResizable();
		this.closeButtonEnabled = this.modalConfiguration.isCloseButtonVisible();
		this.collapseButtonEnabled = this.modalConfiguration.isCollapseButtonVisible();
		this.closeByDocumentEnabled = this.modalConfiguration.isClickOnDocumentCloseEnabled();

		// add ionitialy defined class names
		this.modalConfiguration.getClassNameList().forEach(className => this.changeClass(className, true));

		if (!this.modalConfiguration.isPositionToScreenCenterEnabled()) {
			if (this.modalConfiguration.getLeftPosition() != null) {
				this.setLeftPosition(
					this.modalConfiguration.getLeftPosition().value,
					this.modalConfiguration.getLeftPosition().units);
			}

			if (this.modalConfiguration.getTopPosition() != null) {
				this.setTopPosition(
					this.modalConfiguration.getTopPosition().value,
					this.modalConfiguration.getTopPosition().units);
			}
		}

		if (this.modalConfiguration.isOverlayVisible()) {
			// trigger class change
			this.modalConfiguration.setOverlayVisible(true);
		}

		this.changeStackOrder(this.modalConfiguration.getOrder());
	}

	private registerEventListeners(): void {
		// on resize we clear this._boundBox
		this.eventDestroyHooks.push(
			this.renderer.listen('window', 'resize', () => {
				const configuration = this.modalConfiguration;

				/**
				 * consider only if draggable is used,
				 * because otherwise css properties are
				 * used to fix element into the center of page
				 *
				 * recalculate new position and
				 * return all modals inside bound box
				 */
				if (configuration.isDraggable()) {
					configuration.setLeftPosition(this.getPositionLeft());
					configuration.setTopPosition(this.getPositionTop());
				}
			})
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.VISIBILITY_CHANGE))
				.subscribe(({ value }) => { this.display(value); })
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.COLLAPSE_CHANGE))
				.subscribe(({ value }) => {
					this.collapsed = value;
					this.detectChanges();
				})
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.DRAGGABLE_CHANGE))
				.subscribe(({ value }) => {
					this.isDraggable = value;
					this.detectChanges();
				})
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.RESIZABLE_CHANGE))
				.subscribe(({ value }) => {
					this.isResizable = value;
					this.detectChanges();
				})
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.FULLSCREEN_CHANGE))
				.subscribe(({ value }) => {
					this.maximized = value;

					if (this.isActive) {
						this.notifyResize();
					}
				})
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.CLASS_ADD_CHANGE
					|| type === ModalConfigurationEventType.CLASS_REMOVE_CHANGE))
				.subscribe(({ type, value }) =>
					this.changeClass(value, type === ModalConfigurationEventType.CLASS_ADD_CHANGE)
				)
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.HEIGHT_CHANGE))
				.subscribe(({ value }: IModalConfigurationEvent<IModalDimension>) => this.height(value.value, value.units))
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.MIN_HEIGHT_CHANGE))
				.subscribe(({ value }: IModalConfigurationEvent<IModalDimension>) => this.minHeight(value.value, value.units))
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.MAX_HEIGHT_CHANGE))
				.subscribe(({ value }: IModalConfigurationEvent<IModalDimension>) => this.setMaxHeight(value.value, value.units))
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.WIDTH_CHANGE))
				.subscribe(({ value }: IModalConfigurationEvent<IModalDimension>) => this.width(value.value, value.units))
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.MIN_WIDTH_CHANGE))
				.subscribe(({ value }: IModalConfigurationEvent<IModalDimension>) => this.minWidth(value.value, value.units))
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.MAX_WIDTH_CHANGE))
				.subscribe(({ value }: IModalConfigurationEvent<IModalDimension>) => this.setMaxWidth(value.value, value.units))
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.POSITION_CHANGE))
				.subscribe(({ value }: IModalConfigurationEvent<{ left: IModalDimension, top: IModalDimension }>) =>
					this.setPosition(value.top, value.left))
		);
	}

	private display(isVisible: boolean): void {
		if (this.hostElementRef) {
			this.renderer.setStyle(this.hostElementRef.nativeElement, 'display', isVisible ? 'block' : 'none');
		}
	}

	private height(value: number, units: string): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'height',
			value != null ? value.toString() + units : value);
	}

	private minHeight(value: number, units: string): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'minHeight',
			value != null ? value.toString() + units : value);
	}

	private setMaxHeight(value: number, units: string): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'maxHeight',
			value != null ? value.toString() + units : value);
	}

	private width(value: number, units: string): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'width',
			value != null ? value.toString() + units : value);
	}

	private minWidth(value: number, units: string): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'minWidth',
			value != null ? value.toString() + units : value);
	}

	private setMaxWidth(value: number, units: string): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'maxWidth',
			value != null ? value.toString() + units : value);
	}

	private setMarginTop(value: number, units: string): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'marginTop',
			value != null ? value.toString() + units : value);
	}

	private setMarginleft(value: number, units: string): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'marginLeft',
			value != null ? value.toString() + units : value);
	}

	/**
	 * @description return element height with padding and border
	 *
	 * offsetHeight -> height + padding + border
	 * https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight
	 *
	 * clientHeight -> height + padding
	 * https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight
	 */
	public getHeight(): number {
		const el = this.modalBox.nativeElement;
		return el.offsetHeight || el.clientHeight;
	}

	/**
	 * @description return element width with padding and border
	 */
	public getWidth(): number {
		const el = this.modalBox.nativeElement;
		return el.offsetWidth || el.clientWidth;
	}

	/**
	 * https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
	 * getBoundingClientRect -> problem is because WebKit recalculate layout each time you call it
	 */
	private getClientRects(): ClientRect {
		const el = this.modalBox.nativeElement;
		return el.getBoundingClientRect();
	}

	/**
	 * compatible with IE
	 * will typically force style recalc
	 */
	private getStyles(): CSSStyleDeclaration {
		const el = this.modalBox.nativeElement;
		return el.currentStyle || window.getComputedStyle(el, null);
	}

	/**
	 * set position relative to parent overlay
	 */
	private setPosition(top: IModalDimension, left: IModalDimension): void {
		if (top !== null) {
			this.setTopPosition(top.value, top.units);
		}

		if (left !== null) {
			this.setLeftPosition(left.value, left.units);
		}
	}

	public get hostElement(): HTMLElement {
		return this.hostElementRef.nativeElement;
	}

	/**
	 * set left position relative to parent overlay
	 */
	private setLeftPosition(left: number, units: string = ModalDimensionUnits.PIXEL): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'left', left.toString() + units);
		this.renderer.setStyle(this.modalBox.nativeElement, 'marginLeft', '0');
	}

	/**
	 * set top position relative to parent overlay
	 */
	private setTopPosition(top: number, units: string = ModalDimensionUnits.PIXEL): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'top', top.toString() + units);
		this.renderer.setStyle(this.modalBox.nativeElement, 'marginTop', '0');
	}

	/**
	 * get left position relative to parent overlay
	 */
	public getPositionLeft(): number {
		const position = this.modalConfiguration.getLeftPosition();
		if (position != null) {
			return position?.value;
		}

		return this.getClientRects().left;
	}

	/**
	 * get top position relative to parent overlay
	 */
	public getPositionTop(): number {
		const position = this.modalConfiguration.getTopPosition();
		if (position != null) {
			return position?.value;
		}

		return this.getClientRects().top;
	}

	private changeStackOrder(index: number) {
		this.renderer.setStyle(this.hostElementRef.nativeElement, 'z-index', index);
	}

	@HostListener('mousedown', ['$event'])
	public setActive(event: MouseEvent): void { }

	public onMouseClose(event: MouseEvent): void {
		event.stopPropagation();
		if (this.closeFn) {
			this.closeFn();
		}
	}

	@HostListener('click', ['$event'])
	public documentCloseListener(event: MouseEvent): void {
		const targetEl = event.target || event.srcElement;

		if (this.closeByDocumentEnabled && this.closeFn && this.hostElementRef.nativeElement === targetEl) {
			this.closeFn();
		}

		if (this.hostElementRef.nativeElement === targetEl) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	public get focusOnChange(): Element {
		return this.focusOnChangeElement;
	}

	public set focusOnChange(el: Element) {
		this.focusOnChangeElement = el;
	}

	public autoFocus(): void {
		const focusOnParentClosing = this.focusOnChangeElement;
		// else focus other elements
		const el = this.hostElementRef.nativeElement;

		if (focusOnParentClosing) {
			if (document.activeElement === focusOnParentClosing) {
				return;
			}
			const focusablehtmlElements = this.filterAllowed(<HTMLElement>focusOnParentClosing);
			if (focusablehtmlElements.length > 0) {
				this.handleFocus(focusOnParentClosing);
				return;
			}
			this.invokeElementMethod(document.activeElement, 'blur');
			// preserve focus on modal content
			this.invokeElementMethod(el, 'focus');
		}

		// Browser's (Chrome 40, Forefix 37, IE 11) don't appear to honor
		// autofocus on the dialog, but we should
		const autoFocusEl = (<HTMLElement>el).querySelector(this.config.AutoFocusSelectors);

		if (autoFocusEl !== null) {
			if (document.activeElement === autoFocusEl) {
				return;
			}

			this.handleFocus(autoFocusEl);
			return;
			// Autofocus element might was display: none, so let's continue
		}

		let focusableElements = this.filterAllowed(el);

		/**
		 * in case we ignored all elements, and there
		 * are readonly inputs we should try to focus them anyway
		 */
		if (focusableElements.length === 0) {
			focusableElements = this.filterAllowed(el, this.getDefaultFocusableElements(el));
		}

		if (focusableElements.length > 0) {
			this.handleFocus(focusableElements[0]);
			return;
		}

		// if there is nothing to focus we should at least move focus from active element
		this.invokeElementMethod(document.activeElement, 'blur');
		// preserve focus on modal content
		this.invokeElementMethod(el, 'focus');
	}

	@HostListener('keydown', ['$event'])
	public trapFocusKeydown(event: KeyboardEvent): void {
		const isTab = event.keyCode === 9;
		const backward = event.shiftKey === true;

		if (isTab) {
			this.handleTabKey(event, backward);
		}
	}

	public focusNext(event: KeyboardEvent): void {
		this.handleTabKey(event, false);
	}

	public focusPrevious(event: KeyboardEvent): void {
		this.handleTabKey(event, true);
	}

	private changeClass(className: string, add: boolean = true): this {
		if (add === true) {
			this.renderer.addClass(this.hostElementRef.nativeElement, className);
		} else {
			this.renderer.removeClass(this.hostElementRef.nativeElement, className);
		}
		return this;
	}

	private invokeElementMethod(element: any, methodName: string): void {
		if (methodName === 'focus' && element.setActive) {
			element.setActive();
			return;
		}
		if (element[methodName]) {
			element[methodName]();
		}
	}

	private handleTabKey(event: KeyboardEvent, backward: boolean): void {
		const el = this.hostElementRef.nativeElement;

		let focusableElements = this.filterAllowed(el);

		if (focusableElements.length === 0) {
			focusableElements = this.filterAllowed(el, this.getDefaultFocusableElements(el));
		}

		if (focusableElements.length === 0) {
			if (document.activeElement) {
				this.invokeElementMethod(document.activeElement, 'blur');
				// preserve focus on modal content
				this.invokeElementMethod(el, 'focus');
			}
			return;
		}

		const currentFocus: any = document.activeElement;

		/**
		 * IE fix - micanje selectiona na input polju na blur eventu
		 */
		if (
			['INPUT'].includes(currentFocus.tagName) &&
			currentFocus.type &&
			currentFocus.type.toLowerCase() !== 'radio' &&
			currentFocus.type.toLowerCase() !== 'checkbox'
		) {
			if (currentFocus['selectionStart']) {
				currentFocus['selectionStart'] = 0;
			}
			if (currentFocus['selectionEnd']) {
				currentFocus['selectionEnd'] = 0;
			}
			document.body.focus();
		}

		const focusIndex = focusableElements.indexOf(currentFocus);

		const isFocusIndexUnknown = focusIndex === -1;
		const isFirstElementFocused = focusIndex === 0;
		const isLastElementFocused = focusIndex === focusableElements.length - 1;

		if (backward) {
			if (isFocusIndexUnknown || isFirstElementFocused) {
				this.handleFocus(focusableElements[focusableElements.length - 1]);
			} else {
				this.handleFocus(focusableElements[focusIndex - 1]);
			}
		} else {
			if (isFocusIndexUnknown || isLastElementFocused) {
				this.handleFocus(focusableElements[0]);
			} else {
				this.handleFocus(focusableElements[focusIndex + 1]);
			}
		}

		event.preventDefault();
		event.stopPropagation();
	}

	/**
	 * method used when we need to focus|select element on component creation
	 * or when user use tab to focus|select next element
	 * action depends about element type
	 * @param element
	 */
	private handleFocus(element: Element): void {
		// TEXTAREA does not need to be selected
		const action: 'focus' | 'select' = ['INPUT'].includes(element.tagName) ? 'select' : 'focus';
		// Calling element.select() will not necessarily focus the input,
		// so call focus before
		try {
			this.invokeElementMethod(element, 'focus');
			this.invokeElementMethod(element, action);
		} catch (e) {
			/**
			 * we don't catch Error
			 * because in this moment element which we try
			 * to focus may be hidden -> IE fix -> to prevent page break
			 */
		}
	}

	private getFocusableElements(element: HTMLElement): NodeListOf<Element> {
		// ako element ima parent i ako nije riječ o modal-component elementu
		// koji je root element modalnog prikaza
		// krenut ćemo od njega kako bi i prosljeđeni element uzeli u obzir
		if (element.parentElement && element.tagName !== 'MODAL-COMPONENT') {
			element = element.parentElement;
		}

		return element.querySelectorAll(this.config.FocusableSelectors);
	}

	private getDefaultFocusableElements(element: HTMLElement): NodeListOf<Element> {
		return element.querySelectorAll(MODAL_DEFAULT_SELECTOR);
	}

	/**
	 * filter element which we need to ignore
	 * this method isn't used on focus with `tab`,
	 * because there we need to be able go through
	 * toolbar buttons
	 * @param el
	 */
	private filterAllowed(el: HTMLElement,
		rawElements:  NodeListOf<Element> = this.getFocusableElements(el)): Element[] {

		// Ignore untabbable elements, ie. those with tabindex = -1
		const tabbableEl = this.filterTabbableElements(rawElements);
		const focusableElements = this.filterVisibleElements(<HTMLElement[]>tabbableEl);

		if (focusableElements.length > 0) {
			// filter ignore elements
			// to prevent focusing unavailable element
			const ignoreElements = Array.from((<HTMLElement>el).querySelectorAll(this.config.IgnoreFocusSelectors));

			if (ignoreElements.length > 0) {
				return focusableElements.filter((element: Element) => ignoreElements.indexOf(element) === -1);
			}

			return focusableElements;
		}

		return [];
	}

	private filterTabbableElements(elements: NodeListOf<Element>): Element[] {
		const filtered = [];

		for (let i = 0; i < elements.length; i++) {
			const element = <HTMLElement>elements[i];
			if (element.tabIndex !== -1) {
				filtered.push(element);
			}
		}
		return filtered;
	}

	private filterVisibleElements(elements: HTMLElement[]): Element[] {
		return elements.filter((element: HTMLElement) => element.offsetWidth > 0 || element.offsetHeight > 0);
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
}
