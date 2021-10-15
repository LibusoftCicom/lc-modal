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
	ChangeDetectorRef
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { IModalDimensions } from './modal-types.class';
import { ModalConfig } from './modal-config.class';
import { IHostModalComponent } from './modal-component.interface';
import { ModalClassNames, ModalConfiguration, ModalConfigurationEventType } from './modal-configuration.class';
import { filter } from 'rxjs/operators';

@Component({
	selector: `modal-component`,
	templateUrl: `./modal.component.html`,
	styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, AfterViewInit, OnDestroy, IHostModalComponent {

	@ViewChild('content', { static: true, read: ViewContainerRef })
	private contentRef: ViewContainerRef;

	@ViewChild('modalBox', { static: true })
	private modalBox: ElementRef;

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

	public ngAfterViewInit(): void {
		setTimeout(() => this.autoFocus(), 100);

		/**
		 * in case we doesn't have min width and min height:
		 * we will have problem in case when
		 * user manually triggers maximize and after that minimize
		 * modal will take max width and height he can depending on window size, not the previous one
		 */
		if (!this.modalConfiguration.isMaximized()) {
			if (!this.modalConfiguration.getMinWidth()) {
				this.modalConfiguration.setMinWidth(this.getWidth());
			}

			if (!this.modalConfiguration.getMinHeight()) {
				this.modalConfiguration.setMinHeight(this.getHeight());
			}
		}
	}

	public ngOnDestroy(): void {
		this.eventDestroySubscriptions.forEach(subscription => subscription.unsubscribe());
		this.eventDestroySubscriptions.length = 0;
		this.eventDestroyHooks.forEach(destroyFn => destroyFn());
		this.eventDestroyHooks.length = 0;
		this.focusOnChangeElement = null;
		this.modalConfiguration = null;
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
			this.height(this.modalConfiguration.getHeight());
			this.minHeight(this.modalConfiguration.getMinHeight());
			this.setMaxHeight(this.modalConfiguration.getMaxHeight());
			this.width(this.modalConfiguration.getWidth());
			this.minWidth(this.modalConfiguration.getMinWidth());
			this.setMaxWidth(this.modalConfiguration.getMaxWidth());
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
				this.setLeftPosition(this.modalConfiguration.getLeftPosition());
			}

			if (this.modalConfiguration.getTopPosition() != null) {
				this.setTopPosition(this.modalConfiguration.getTopPosition());
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

				const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

				// TODO -> je li potrebno napraviti restore -> provjeriti dinamički kreirane modalne ekrane
				if (width < 600) {
				// 	this.modalConfiguration.clearMinSize();
				}
				// } else {
				// 	// this.modalConfiguration.restoreInitialMinSize();
				// }
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
				.subscribe(({ value }) => this.height(value))
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.MIN_HEIGHT_CHANGE))
				.subscribe(({ value }) => this.minHeight(value))
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.MAX_HEIGHT_CHANGE))
				.subscribe(({ value }) => this.setMaxHeight(value))
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.WIDTH_CHANGE))
				.subscribe(({ value }) => this.width(value))
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.MIN_WIDTH_CHANGE))
				.subscribe(({ value }) => this.minWidth(value))
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.MAX_WIDTH_CHANGE))
				.subscribe(({ value }) => this.setMaxWidth(value))
		);

		this.eventDestroySubscriptions.push(
			this.modalConfiguration
				.valueChanges
				.pipe(filter(({ type }) => type === ModalConfigurationEventType.POSITION_CHANGE))
				.subscribe(({ value }) => this.setPosition(value.top, value.left))
		);
	}

	private display(isVisible: boolean): void {
		if (this.hostElementRef) {
			this.renderer.setStyle(this.hostElementRef.nativeElement, 'display', isVisible ? 'block' : 'none');
		}
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

	private height(value: number): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'height',
			value != null ? value.toString() + this.modalConfiguration.getDimensionUnits() : value);
	}

	private minHeight(value: number): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'minHeight',
			value != null ? value.toString() + this.modalConfiguration.getDimensionUnits() : value);
	}

	private setMaxHeight(value: number): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'maxHeight',
			value != null ? value.toString() + this.modalConfiguration.getDimensionUnits() : value);
	}

	private width(value: number): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'width',
			value != null ? value.toString() + this.modalConfiguration.getDimensionUnits() : value);
	}

	private minWidth(value: number): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'minWidth',
			value != null ? value.toString() + this.modalConfiguration.getDimensionUnits() : value);
	}

	private setMaxWidth(value: number): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'maxWidth',
			value != null ? value.toString() + this.modalConfiguration.getDimensionUnits() : value);
	}

	private setMarginTop(value: number): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'marginTop',
			value != null ? value.toString() + this.modalConfiguration.getDimensionUnits() : value);
	}

	private setMarginleft(value: number): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'marginLeft',
			value != null ? value.toString() + this.modalConfiguration.getDimensionUnits() : value);
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
	 * get element calculated margins
	 */
	private getMargins(): {
		top: number;
		left: number;
		bottom: number;
		right: number;
	} {
		const styles = this.getStyles();
		const top = parseInt(styles.marginTop, 10);
		const bottom = parseInt(styles.marginBottom, 10);
		const left = parseInt(styles.marginLeft, 10);
		const right = parseInt(styles.marginRight, 10);

		return { top, left, bottom, right };
	}

	/**
	 * set position relative to parent overlay
	 */
	private setPosition(top: number, left: number): void {
		if (top !== null) {
			this.setTopPosition(top);
		}

		if (left !== null) {
			this.setLeftPosition(left);
		}
	}

	public get hostElement(): HTMLElement {
		return this.hostElementRef.nativeElement;
	}

	/**
	 * set left position relative to parent overlay
	 */
	private setLeftPosition(left: number): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'left', left.toString() + 'px');
		this.renderer.setStyle(this.modalBox.nativeElement, 'marginLeft', '0');
	}

	/**
	 * set top position relative to parent overlay
	 */
	private setTopPosition(top: number): void {
		this.renderer.setStyle(this.modalBox.nativeElement, 'top', top.toString() + 'px');
		this.renderer.setStyle(this.modalBox.nativeElement, 'marginTop', '0');
	}

	/**
	 * get left position relative to parent overlay
	 */
	public getPositionLeft(): number {
		const position = this.modalConfiguration.getLeftPosition();
		if (position != null) {
			return position;
		}

		return this.getClientRects().left;
	}

	/**
	 * get top position relative to parent overlay
	 */
	public getPositionTop(): number {
		const position = this.modalConfiguration.getTopPosition();
		if (position != null) {
			return position;
		}

		return this.getClientRects().top;
	}

	private changeStackOrder(index: number) {
		this.renderer.setStyle(this.hostElementRef.nativeElement, 'z-index', index);
	}

	@HostListener('mousedown', ['$event'])
	public setActive(event: MouseEvent): void {}

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
		}

		// else focus other elements
		const el = this.hostElementRef.nativeElement;
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

		const focusableElements = this.filterAllowed(el);

		if (focusableElements.length > 0) {
			this.handleFocus(focusableElements[0]);
			return;
		}

		// if there is nothing to focus we should at least move focus from active element
		this.invokeElementMethod(document.activeElement, 'blur');
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

	/**
	 * helper method to determinate new postion according to boundbox
	 */
	private checkBoundBox(dir: 'left' | 'top', position: number): number {
		if (dir === 'left') {
			const boundboxWidth = this.modalConfiguration.getBoundbox().width;

			if (position > boundboxWidth - 30) {
				return boundboxWidth - 30;
			}

			const n = 0 - this.getWidth() + 60;
			if (position < n) {
				return n;
			}

			return position;
		} else {
			const boundboxHeight = this.modalConfiguration.getBoundbox().height;

			if (position > boundboxHeight - 30) {
				return boundboxHeight - 30;
			}

			if (position < 0) {
				return 0;
			}

			return position;
		}
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

		const focusableElements = this.filterAllowed(el);
		if (focusableElements.length === 0) {
			if (document.activeElement) {
				this.invokeElementMethod(document.activeElement, 'blur');
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

	private getFocusableElements(element: HTMLElement): Element[] {
		// ako element ima parent i ako nije riječ o modal-component elementu
		// koji je root element modalnog prikaza
		// krenut ćemo od njega kako bi i prosljeđeni element uzeli u obzir
		if (element.parentElement && element.tagName !== 'MODAL-COMPONENT') {
			element = element.parentElement;
		}

		const rawElements = element.querySelectorAll(this.config.FocusableSelectors);

		// Ignore untabbable elements, ie. those with tabindex = -1
		const tabbableEl = this.filterTabbableElements(rawElements);

		return this.filterVisibleElements(<HTMLElement[]>tabbableEl);
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

	/**
	 * filter element which we need to ignore
	 * this method isn't used on focus with `tab`,
	 * because there we need to be able go through
	 * toolbar buttons
	 * @param el
	 */
	private filterAllowed(el: HTMLElement): Element[] {
		const focusableElements = this.getFocusableElements(el);

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
